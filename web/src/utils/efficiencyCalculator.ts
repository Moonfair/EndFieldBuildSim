import type {
  ProductionPlan,
  DeviceConfig,
  Connection,
  DependencyNode,
  ManufacturingRecipe,
} from '../types/manufacturing';
import type { ItemLookup } from '../types/catalog';

import { TRANSFER_RATE_PER_PIPE } from './constants';

type Fraction = {
  numerator: bigint;
  denominator: bigint;
};

const ZERO_FRACTION: Fraction = { numerator: 0n, denominator: 1n };

function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function gcdBigInt(a: bigint, b: bigint): bigint {
  let x = absBigInt(a);
  let y = absBigInt(b);
  while (y !== 0n) {
    const temp = x % y;
    x = y;
    y = temp;
  }
  return x === 0n ? 1n : x;
}

function lcmBigInt(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) {
    return 0n;
  }
  return (a / gcdBigInt(a, b)) * b;
}

function normalizeFraction(value: Fraction): Fraction {
  if (value.numerator === 0n) {
    return ZERO_FRACTION;
  }
  const denominator = value.denominator < 0n ? -value.denominator : value.denominator;
  const numerator = value.denominator < 0n ? -value.numerator : value.numerator;
  const divisor = gcdBigInt(absBigInt(numerator), denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

function addFraction(a: Fraction, b: Fraction): Fraction {
  return normalizeFraction({
    numerator: a.numerator * b.denominator + b.numerator * a.denominator,
    denominator: a.denominator * b.denominator,
  });
}

function multiplyFraction(a: Fraction, b: Fraction): Fraction {
  return normalizeFraction({
    numerator: a.numerator * b.numerator,
    denominator: a.denominator * b.denominator,
  });
}

function divideFraction(a: Fraction, b: Fraction): Fraction {
  if (b.numerator === 0n) {
    return ZERO_FRACTION;
  }
  return normalizeFraction({
    numerator: a.numerator * b.denominator,
    denominator: a.denominator * b.numerator,
  });
}

function fractionFromInt(value: number): Fraction {
  return normalizeFraction({ numerator: BigInt(value), denominator: 1n });
}

function fractionFromNumber(value: number, precision: number = 6): Fraction {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return ZERO_FRACTION;
  }
  if (Number.isInteger(value)) {
    return fractionFromInt(value);
  }
  const multiplier = 10 ** precision;
  const numerator = BigInt(Math.round(value * multiplier));
  return normalizeFraction({ numerator, denominator: BigInt(multiplier) });
}

function scaleFractionToInteger(value: Fraction, scale: bigint): bigint {
  if (value.numerator === 0n) {
    return 0n;
  }
  return (value.numerator * scale) / value.denominator;
}


export function calculateMaximumEfficiencyPlan(
  targetItemId: string,
  targetItemName: string,
  dependencyTree: DependencyNode,
  itemLookup: ItemLookup
): ProductionPlan {
  console.log('[EFFICIENCY CALC] START:', { targetItemId, targetItemName });
  console.log('[EFFICIENCY CALC] Tree:', { isBase: dependencyTree.isBase, recipesCount: dependencyTree.recipes.length, childrenCount: dependencyTree.children.length });

  const selectedRecipes = new Map<string, ManufacturingRecipe>();
  selectRecipesForEfficiency(dependencyTree, selectedRecipes);

  selectedRecipes.forEach((recipe) => {
    console.log('[EFFICIENCY CALC] Selected recipe for', (recipe.products[0]?.name || 'unknown'), ':', recipe.deviceName);
  });
  console.log('[EFFICIENCY CALC] Selected recipes count:', selectedRecipes.size);

  const { devices, connections, baseMaterials, calculatedOutputRate } =
    balanceZeroWasteFlows(
      selectedRecipes,
      dependencyTree,
      targetItemId,
      itemLookup
    );

  console.log('[EFFICIENCY CALC] After balancing:', { devicesCount: devices.length, baseMaterialsCount: baseMaterials.length, calculatedOutputRate });

  const bottleneck = findBottleneck(devices);

  return {
    type: 'efficiency',
    name: '最高效率生产方案',
    targetProduct: { id: targetItemId, name: targetItemName },
    calculatedOutputRate,
    devices,
    totalDeviceCount: devices.reduce((sum, d) => sum + d.count, 0),
    bottleneck,
    connections,
    baseMaterials,
  };
}

export function getSelectedRecipes(
  dependencyTree: DependencyNode
): Map<string, ManufacturingRecipe> {
  const selectedRecipes = new Map<string, ManufacturingRecipe>();
  selectRecipesForEfficiency(dependencyTree, selectedRecipes);
  return selectedRecipes;
}

function selectRecipesForEfficiency(
  node: DependencyNode,
  selectedRecipes: Map<string, ManufacturingRecipe>
): void {
  if (node.isBase || node.recipes.length === 0) {
    console.log('[SELECT] Skipping', node.itemName, '- isBase:', node.isBase, 'recipesCount:', node.recipes.length);
    return;
  }

  const fastestRecipe = node.recipes.reduce((fastest, current) =>
    current.manufacturingTime < fastest.manufacturingTime ? current : fastest
  );
  
  console.log('[SELECT] Selected recipe for', node.itemName, ':', fastestRecipe.deviceName);

  selectedRecipes.set(node.itemId, fastestRecipe);

  for (const child of node.children) {
    selectRecipesForEfficiency(child, selectedRecipes);
  }
}

function propagateRequirements(
  node: DependencyNode,
  requiredAmount: Fraction,
  selectedRecipes: Map<string, ManufacturingRecipe>,
  requirements: Map<string, Fraction>,
  baseRequirements: Map<string, Fraction>,
  craftsPerMinute: Map<string, Fraction>
): void {
  console.log('[PROPAGATE] Node:', node.itemName, 'required:', `${requiredAmount.numerator}/${requiredAmount.denominator}`);
  
  if (requiredAmount.numerator === 0n) {
    console.log('[PROPAGATE] Skipping - zero requirement');
    return;
  }

  const currentRequirement = requirements.get(node.itemId) ?? ZERO_FRACTION;
  requirements.set(node.itemId, addFraction(currentRequirement, requiredAmount));

  const recipe = selectedRecipes.get(node.itemId);
  if (node.isBase || !recipe) {
    console.log('[PROPAGATE]', node.itemName, 'is base or no recipe - adding to baseRequirements');
    const existingBase = baseRequirements.get(node.itemId) ?? ZERO_FRACTION;
    baseRequirements.set(node.itemId, addFraction(existingBase, requiredAmount));
    return;
  }

  const productEntry =
    recipe.products.find((product) => product.id === node.itemId) ?? recipe.products[0];
  const productCount = productEntry?.count && productEntry.count > 0 ? productEntry.count : 1;
  
  console.log('[PROPAGATE]', node.itemName, 'productEntry:', productEntry, 'productCount:', productCount);
  const productCountFrac = fractionFromNumber(productCount);
  console.log('[PROPAGATE]', node.itemName, 'productCountFrac:', `${productCountFrac.numerator}/${productCountFrac.denominator}`);
  console.log('[PROPAGATE]', node.itemName, 'requiredAmount:', `${requiredAmount.numerator}/${requiredAmount.denominator}`);
  
  const craftsNeeded = divideFraction(requiredAmount, productCountFrac);
  
  console.log('[PROPAGATE]', node.itemName, 'craftsNeeded:', `${craftsNeeded.numerator}/${craftsNeeded.denominator}`, 'productCount:', productCount);

  const existingCrafts = craftsPerMinute.get(node.itemId) ?? ZERO_FRACTION;
  craftsPerMinute.set(node.itemId, addFraction(existingCrafts, craftsNeeded));
  
  console.log('[PROPAGATE]', node.itemName, 'total crafts:', `${craftsPerMinute.get(node.itemId)!.numerator}/${craftsPerMinute.get(node.itemId)!.denominator}`);

  for (const material of recipe.materials) {
    const materialAmount = multiplyFraction(craftsNeeded, fractionFromNumber(material.count));
    const childNode =
      node.children.find((child) => child.itemId === material.id) ??
      ({
        itemId: material.id,
        itemName: material.name,
        isBase: true,
        recipes: [],
        children: [],
      } as DependencyNode);
    propagateRequirements(
      childNode,
      materialAmount,
      selectedRecipes,
      requirements,
      baseRequirements,
      craftsPerMinute
    );
  }
}

function balanceZeroWasteFlows(
  selectedRecipes: Map<string, ManufacturingRecipe>,
  dependencyTree: DependencyNode,
  targetItemId: string,
  itemLookup: ItemLookup
): {
  devices: DeviceConfig[];
  connections: Connection[];
  baseMaterials: Array<{ id: string; name: string; requiredRate: number }>;
  calculatedOutputRate: number;
} {
  const baseTargetRatePerMinute = fractionFromInt(1);

  const requirements = new Map<string, Fraction>();
  const baseRequirements = new Map<string, Fraction>();
  const craftsPerMinute = new Map<string, Fraction>();

  propagateRequirements(
    dependencyTree,
    baseTargetRatePerMinute,
    selectedRecipes,
    requirements,
    baseRequirements,
    craftsPerMinute
  );
  
  console.log('[PROPAGATE] Requirements map:', requirements.size, 'entries');
  console.log('[PROPAGATE] CraftsPerMinute map:', craftsPerMinute.size, 'entries');
  console.log('[PROPAGATE] CraftsPerMinute keys:', Array.from(craftsPerMinute.keys()));
  console.log('[PROPAGATE] BaseRequirements:', baseRequirements.size, 'entries');

  const deviceCountFractions = new Map<string, Fraction>();
  craftsPerMinute.forEach((crafts, itemId) => {
    const recipe = selectedRecipes.get(itemId);
    if (!recipe) return;
    const manufacturingTime = recipe.manufacturingTime > 0 ? recipe.manufacturingTime : 1;
    const craftsPerDevice = divideFraction(
      fractionFromInt(60),
      fractionFromInt(manufacturingTime)
    );
    const count = divideFraction(crafts, craftsPerDevice);
    deviceCountFractions.set(itemId, count);
  });

  const denominators: bigint[] = [];
  deviceCountFractions.forEach((fraction) => {
    if (fraction.denominator > 0n) {
      denominators.push(fraction.denominator);
    }
  });
  baseRequirements.forEach((fraction) => {
    if (fraction.denominator > 0n) {
      denominators.push(fraction.denominator);
    }
  });
  requirements.forEach((fraction, itemId) => {
    if (!selectedRecipes.has(itemId)) {
      return;
    }
    if (fraction.denominator > 0n) {
      denominators.push(fraction.denominator);
    }
  });
  if (baseTargetRatePerMinute.denominator > 0n) {
    denominators.push(baseTargetRatePerMinute.denominator);
  }

  const scale = denominators.reduce<bigint>((acc, value) => {
    if (acc === 0n) return value;
    if (value === 0n) return acc;
    return lcmBigInt(acc, value);
  }, denominators.length > 0 ? 1n : 1n);

  const devices: DeviceConfig[] = [];
  
  console.log('[BALANCE] Scale:', scale.toString());
  console.log('[BALANCE] Device count fractions:', Array.from(deviceCountFractions.entries()).slice(0, 5).map(([id, f]) => ({ id, frac: `${f.numerator}/${f.denominator}` })));

  selectedRecipes.forEach((recipe, itemId) => {
    const countFraction = deviceCountFractions.get(itemId);
    if (!countFraction) {
      console.log('[BALANCE] No count fraction for', itemId);
      return;
    }
    const scaledCount = scaleFractionToInteger(countFraction, scale);
    console.log('[BALANCE] Item', itemId, 'scaled count:', scaledCount.toString());
    if (scaledCount === 0n) {
      console.log('[BALANCE] Skipping', itemId, '- zero count');
      return;
    }

    const requiredPerMinute = requirements.get(itemId) ?? ZERO_FRACTION;
    const scaledRequirement = scaleFractionToInteger(requiredPerMinute, scale);
    const productionRatePerSecond = Number(scaledRequirement) / 60;

    const device: DeviceConfig = {
      deviceId: recipe.deviceId,
      deviceName: recipe.deviceName,
      recipe,
      count: Number(scaledCount),
      productionRate: productionRatePerSecond,
      inputs: [],
      outputs: [],
    };

    for (const material of recipe.materials) {
      const isBaseMaterial = isItemBaseMaterial(material.id, dependencyTree);
      device.inputs.push({
        itemId: material.id,
        source: isBaseMaterial ? 'warehouse' : `device-${material.id}`,
      });
    }

    for (const product of recipe.products) {
      device.outputs.push({
        itemId: product.id,
        destination: product.id === targetItemId ? 'output' : `device-${product.id}`,
      });
    }

    devices.push(device);
  });

  const connections: Connection[] = [];
  buildConnections(devices, connections);

  const baseMaterials = Array.from(baseRequirements.entries())
    .map(([id, fraction]) => {
      const scaledRequirement = scaleFractionToInteger(fraction, scale);
      return {
        id,
        name: getItemName(id, dependencyTree, itemLookup),
        requiredRate: Number(scaledRequirement) / 60,
      };
    })
    .filter((material) => material.requiredRate > 0);

  const scaledTargetPerMinute = scaleFractionToInteger(baseTargetRatePerMinute, scale);

  return {
    devices,
    connections,
    baseMaterials,
    calculatedOutputRate: Number(scaledTargetPerMinute) / 60,
  };
}

function isItemBaseMaterial(
  itemId: string,
  tree: DependencyNode
): boolean {
  if (tree.itemId === itemId) {
    return tree.isBase;
  }
  for (const child of tree.children) {
    if (isItemBaseMaterial(itemId, child)) {
      return true;
    }
  }
  return false;
}

function getItemName(itemId: string, tree: DependencyNode, itemLookup: ItemLookup): string {
  if (tree.itemId === itemId) {
    return tree.itemName;
  }
  for (const child of tree.children) {
    const name = getItemName(itemId, child, itemLookup);
    if (name) {
      return name;
    }
  }
  return itemLookup[itemId]?.name || `物品 ${itemId}`;
}

function buildConnections(
  devices: DeviceConfig[],
  connections: Connection[]
): void {
  for (const device of devices) {
    for (const output of device.outputs) {
      if (output.destination !== 'output') {
        connections.push({
          from: device.deviceId,
          to: output.destination.replace('device-', ''),
          itemId: output.itemId,
          count: 1,
          rate: TRANSFER_RATE_PER_PIPE,
        });
      }
    }
  }
}

function findBottleneck(
  devices: DeviceConfig[]
): { itemId: string; description: string } | null {
  if (devices.length === 0) {
    return null;
  }

  const targetDevice = devices.find(
    (d) => d.outputs.some((o) => o.destination === 'output')
  );

  if (!targetDevice) {
    return null;
  }

  const slowestDevice = devices.reduce((slowest, current) =>
    current.productionRate < slowest.productionRate ? current : slowest
  );

  if (slowestDevice.deviceId === targetDevice.deviceId) {
    return null;
  }

  return {
    itemId: slowestDevice.deviceId,
    description: `${slowestDevice.deviceName} 产能受限 (${slowestDevice.productionRate.toFixed(2)} 个/秒)`,
  };
}
