import type {
  ProductionPlan,
  DeviceConfig,
  Connection,
  DependencyNode,
  ManufacturingRecipe,
} from '../types/manufacturing';
import type { ItemLookup } from '../types/catalog';
import { TRANSFER_RATE_PER_PIPE, BASE_MATERIAL_EXTRACTION_RATE } from './constants';

type StageRate = { stage: string; rate: number; limitedBy: string };

export function calculateMinimumScalePlan(
  targetItemId: string,
  targetItemName: string,
  dependencyTree: DependencyNode,
  itemLookup: ItemLookup
): ProductionPlan {
  const selectedRecipes = new Map<string, ManufacturingRecipe>();
  selectRecipesForMinScale(dependencyTree, selectedRecipes);

  const effectiveRates = new Map<string, number>();
  const stageRates: StageRate[] = [];
  const targetNodeRate = calculateEffectiveRate(
    dependencyTree,
    selectedRecipes,
    effectiveRates,
    stageRates
  );
  const bottleneckStage = findBottleneckStage(stageRates);
  const calculatedOutputRate = bottleneckStage?.rate ?? targetNodeRate;

  const deviceUsage = new Map<
    string,
    Array<{ itemId: string; recipe: ManufacturingRecipe }>
  >();
  for (const [itemId, recipe] of selectedRecipes) {
    if (!deviceUsage.has(recipe.deviceId)) {
      deviceUsage.set(recipe.deviceId, []);
    }
    deviceUsage.get(recipe.deviceId)!.push({ itemId, recipe });
  }

  const devices: DeviceConfig[] = [];
  const connections: Connection[] = [];

  for (const [deviceId, recipes] of deviceUsage) {
    const primaryRecipe = recipes[0].recipe;

    const deviceConfig: DeviceConfig = {
      deviceId,
      deviceName: primaryRecipe.deviceName,
      recipe: primaryRecipe,
      count: 1,
      productionRate: 0,
      inputs: [],
      outputs: [],
    };

    for (const { recipe } of recipes) {
      for (const material of recipe.materials) {
        const isBaseMaterial = isItemBaseMaterial(material.id, dependencyTree);
        if (isBaseMaterial) {
          deviceConfig.inputs.push({
            itemId: material.id,
            source: 'warehouse',
          });
        } else {
          deviceConfig.inputs.push({
            itemId: material.id,
            source: `device-${material.id}`,
          });
        }
      }
    }

    for (const { recipe } of recipes) {
      for (const product of recipe.products) {
        deviceConfig.outputs.push({
          itemId: product.id,
          destination: product.id === targetItemId ? 'output' : `device-${product.id}`,
        });
      }
    }

    deviceConfig.productionRate = calculateDeviceRate(recipes, effectiveRates);

    devices.push(deviceConfig);
  }

  buildConnections(devices, connections);

  const bottleneck = findBottleneck(devices);

  const baseMaterialsMap = calculateBaseMaterialConsumption(
    targetItemId,
    calculatedOutputRate,
    selectedRecipes,
    dependencyTree
  );

  return {
    type: 'scale',
    name: '最小规模生产方案',
    targetProduct: { id: targetItemId, name: targetItemName },
    calculatedOutputRate,
    bottleneckStage,
    devices,
    totalDeviceCount: devices.length,
    bottleneck,
    connections,
    baseMaterials: Array.from(baseMaterialsMap.entries()).map(([id, rate]) => ({
      id,
      name: getItemName(id, dependencyTree, itemLookup),
      requiredRate: rate,
    })),
  };
}

function calculateEffectiveRate(
  node: DependencyNode,
  selectedRecipes: Map<string, ManufacturingRecipe>,
  effectiveRates: Map<string, number>,
  stageRates: StageRate[]
): number {
  const cached = effectiveRates.get(node.itemId);
  if (cached !== undefined) {
    return cached;
  }

  if (node.isBase || node.recipes.length === 0) {
    const baseRate = BASE_MATERIAL_EXTRACTION_RATE;
    effectiveRates.set(node.itemId, baseRate);
    stageRates.push({
      stage: `${node.itemName} 采集`,
      rate: baseRate,
      limitedBy: '基础采集',
    });
    return baseRate;
  }

  const recipe = selectedRecipes.get(node.itemId);
  if (!recipe) {
    const fallbackRate = BASE_MATERIAL_EXTRACTION_RATE;
    effectiveRates.set(node.itemId, fallbackRate);
    stageRates.push({
      stage: `${node.itemName} 采集`,
      rate: fallbackRate,
      limitedBy: '基础采集',
    });
    return fallbackRate;
  }

  effectiveRates.set(node.itemId, NaN);

  let limitingInput: { name: string; rate: number; limitedBy: string } | null = null;

  for (const material of recipe.materials) {
    const materialCount = Math.max(material.count, 1);
    const childNode = node.children.find((child) => child.itemId === material.id);
    let childRate = BASE_MATERIAL_EXTRACTION_RATE;

    if (childNode) {
      childRate = calculateEffectiveRate(
        childNode,
        selectedRecipes,
        effectiveRates,
        stageRates
      );
      
      if (isNaN(childRate)) {
        console.warn(`检测到循环依赖: ${material.name} 在计算 ${node.itemName} 时`);
        childRate = BASE_MATERIAL_EXTRACTION_RATE;
      }
    } else {
      stageRates.push({
        stage: `${material.name} 采集`,
        rate: BASE_MATERIAL_EXTRACTION_RATE,
        limitedBy: '基础采集',
      });
    }

    const transferRate = Math.min(childRate, TRANSFER_RATE_PER_PIPE);
    const outputEquivalentRate = transferRate / materialCount;
    const transferLimitedBy =
      childRate <= TRANSFER_RATE_PER_PIPE ? '上游产能' : '传送带';

    stageRates.push({
      stage: `${material.name} 传送`,
      rate: outputEquivalentRate,
      limitedBy: transferLimitedBy,
    });

    if (!limitingInput || outputEquivalentRate < limitingInput.rate) {
      limitingInput = {
        name: material.name,
        rate: outputEquivalentRate,
        limitedBy: transferLimitedBy,
      };
    }
  }

  const machineRate =
    recipe.manufacturingTime > 0
      ? 1 / recipe.manufacturingTime
      : Number.POSITIVE_INFINITY;
  const inputRate = limitingInput ? limitingInput.rate : Number.POSITIVE_INFINITY;
  const effectiveRate = Math.min(machineRate, inputRate);
  const limitedBy =
    machineRate <= inputRate
      ? '设备产能'
      : `原料受限: ${limitingInput?.name ?? '输入'}`;

  stageRates.push({
    stage: `${node.itemName} 生产`,
    rate: effectiveRate,
    limitedBy,
  });

  effectiveRates.set(node.itemId, effectiveRate);
  return effectiveRate;
}

function findBottleneckStage(stageRates: StageRate[]): StageRate | undefined {
  if (stageRates.length === 0) {
    return undefined;
  }

  return stageRates.reduce((slowest, current) =>
    current.rate < slowest.rate ? current : slowest
  );
}

function calculateDeviceRate(
  recipes: Array<{ itemId: string; recipe: ManufacturingRecipe }>,
  effectiveRates: Map<string, number>
): number {
  let deviceRate = Number.POSITIVE_INFINITY;

  for (const recipeUsage of recipes) {
    const rate = effectiveRates.get(recipeUsage.itemId);
    if (rate === undefined) {
      continue;
    }
    deviceRate = Math.min(deviceRate, rate);
  }

  return Number.isFinite(deviceRate) ? deviceRate : 0;
}

function calculateBaseMaterialConsumption(
  targetItemId: string,
  outputRate: number,
  selectedRecipes: Map<string, ManufacturingRecipe>,
  dependencyTree: DependencyNode
): Map<string, number> {
  const baseMaterials = new Map<string, number>();

  if (outputRate <= 0) {
    return baseMaterials;
  }

  const queue: Array<{ itemId: string; rate: number }> = [
    { itemId: targetItemId, rate: outputRate },
  ];
  const visited = new Set<string>();  // Add visited check to prevent infinite loops

  while (queue.length > 0) {
    const { itemId, rate } = queue.shift()!;
    
    if (visited.has(itemId) || rate <= 0) {
      continue;
    }
    visited.add(itemId);

    const recipe = selectedRecipes.get(itemId);
    if (!recipe || isItemBaseMaterial(itemId, dependencyTree)) {
      baseMaterials.set(itemId, (baseMaterials.get(itemId) || 0) + rate);
      continue;
    }

    for (const material of recipe.materials) {
      const materialRate = rate * material.count;
      if (
        isItemBaseMaterial(material.id, dependencyTree) ||
        !selectedRecipes.has(material.id)
      ) {
        baseMaterials.set(
          material.id,
          (baseMaterials.get(material.id) || 0) + materialRate
        );
      } else {
        queue.push({ itemId: material.id, rate: materialRate });
      }
    }
  }

  return baseMaterials;
}

function selectRecipesForMinScale(
  node: DependencyNode,
  selectedRecipes: Map<string, ManufacturingRecipe>
): void {
  if (node.isBase || node.recipes.length === 0) {
    return;
  }

  const recipe = selectOptimalRecipe(node, 'scale');
  if (recipe) {
    selectedRecipes.set(node.itemId, recipe);
  }

  for (const child of node.children) {
    selectRecipesForMinScale(child, selectedRecipes);
  }
}

function selectOptimalRecipe(
  node: DependencyNode,
  strategy: 'efficiency' | 'scale'
): ManufacturingRecipe | undefined {
  if (node.recipes.length === 0) {
    return undefined;
  }

  if (node.recipes.length === 1) {
    return node.recipes[0];
  }

  if (strategy === 'scale') {
    return node.recipes.reduce((best, current) => {
      const bestMaterials = best.materials.length;
      const currentMaterials = current.materials.length;
      if (currentMaterials !== bestMaterials) {
        return currentMaterials < bestMaterials ? current : best;
      }
      return current.manufacturingTime < best.manufacturingTime
        ? current
        : best;
    });
  }

  return node.recipes.reduce((best, current) =>
    current.manufacturingTime < best.manufacturingTime ? current : best
  );
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
          count:1,
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

  const slowestDevice = devices.reduce((slowest, current) =>
    current.productionRate < slowest.productionRate ? current : slowest
  );

  return {
    itemId: slowestDevice.deviceId,
    description: `${slowestDevice.deviceName} 产能受限 (${slowestDevice.productionRate.toFixed(2)} 个/秒)`,
  };
}
