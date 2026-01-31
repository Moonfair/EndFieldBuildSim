import type {
  ProductionPlan,
  DeviceConfig,
  Connection,
  DependencyNode,
  ManufacturingRecipe,
} from '../types/manufacturing';

const TRANSFER_RATE_PER_PIPE = 0.5;

export function calculateMaximumEfficiencyPlan(
  targetItemId: string,
  targetItemName: string,
  dependencyTree: DependencyNode,
  targetRate: number = 1
): ProductionPlan {
  const selectedRecipes = new Map<string, ManufacturingRecipe>();
  selectRecipesForEfficiency(dependencyTree, selectedRecipes);

  const { devices, connections, baseMaterials, bottleneck } = optimizeForEfficiency(
    selectedRecipes,
    targetItemId,
    targetRate,
    dependencyTree
  );

  return {
    type: 'efficiency',
    name: '最高效率生产方案',
    targetProduct: { id: targetItemId, name: targetItemName },
    targetRate,
    devices,
    totalDeviceCount: devices.reduce((sum, d) => sum + d.count, 0),
    bottleneck,
    connections,
    baseMaterials,
  };
}

function selectRecipesForEfficiency(
  node: DependencyNode,
  selectedRecipes: Map<string, ManufacturingRecipe>
): void {
  if (node.isBase || node.recipes.length === 0) {
    return;
  }

  const fastestRecipe = node.recipes.reduce((fastest, current) =>
    current.manufacturingTime < fastest.manufacturingTime ? current : fastest
  );

  selectedRecipes.set(node.itemId, fastestRecipe);

  for (const child of node.children) {
    selectRecipesForEfficiency(child, selectedRecipes);
  }
}

function optimizeForEfficiency(
  selectedRecipes: Map<string, ManufacturingRecipe>,
  targetItemId: string,
  targetRate: number,
  dependencyTree: DependencyNode
): {
  devices: DeviceConfig[];
  connections: Connection[];
  baseMaterials: Array<{ id: string; name: string; requiredRate: number }>;
  bottleneck: { itemId: string; description: string } | null;
} {
  const devices: DeviceConfig[] = [];
  const connections: Connection[] = [];
  const baseMaterialsMap = new Map<string, number>();

  const requiredProductionRates = calculateRequiredRates(
    targetItemId,
    targetRate,
    selectedRecipes
  );

  for (const [itemId, recipe] of selectedRecipes) {
    const requiredRate = requiredProductionRates.get(itemId) || 0;
    const deviceProductionRate = 1 / recipe.manufacturingTime;

    const deviceCount = Math.ceil(requiredRate / deviceProductionRate);

    const device: DeviceConfig = {
      deviceId: recipe.deviceId,
      deviceName: recipe.deviceName,
      recipe,
      count: deviceCount,
      productionRate: deviceProductionRate * deviceCount,
      inputs: [],
      outputs: [],
    };

    for (const material of recipe.materials) {
      const materialRequiredRate = requiredRate * material.count;
      const isBaseMaterial = isItemBaseMaterial(material.id, dependencyTree);

      if (isBaseMaterial) {
        const totalSupplyNeeded = materialRequiredRate * deviceCount;
        baseMaterialsMap.set(
          material.id,
          (baseMaterialsMap.get(material.id) || 0) + totalSupplyNeeded
        );
        device.inputs.push({
          itemId: material.id,
          source: 'warehouse',
        });
      } else {
        device.inputs.push({
          itemId: material.id,
          source: `device-${material.id}`,
        });
      }
    }

    for (const product of recipe.products) {
      device.outputs.push({
        itemId: product.id,
        destination: product.id === targetItemId ? 'output' : `device-${product.id}`,
      });
    }

    devices.push(device);
  }

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

  const bottleneck = findBottleneck(devices);

  const baseMaterials = Array.from(baseMaterialsMap.entries()).map(
    ([id, rate]) => ({
      id,
      name: getItemName(id, dependencyTree),
      requiredRate: rate,
    })
  );

  return { devices, connections, baseMaterials, bottleneck };
}

function calculateRequiredRates(
  targetItemId: string,
  targetRate: number,
  selectedRecipes: Map<string, ManufacturingRecipe>
): Map<string, number> {
  const rates = new Map<string, number>();
  const queue: Array<{ itemId: string; rate: number }> = [
    { itemId: targetItemId, rate: targetRate },
  ];

  while (queue.length > 0) {
    const { itemId, rate } = queue.shift()!;
    rates.set(itemId, rate);

    const recipe = selectedRecipes.get(itemId);
    if (!recipe) continue;

    for (const material of recipe.materials) {
      const materialRate = rate * material.count;
      if (!rates.has(material.id)) {
        queue.push({ itemId: material.id, rate: materialRate });
      } else {
        rates.set(material.id, rates.get(material.id)! + materialRate);
      }
    }
  }

  return rates;
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

function getItemName(itemId: string, tree: DependencyNode): string {
  if (tree.itemId === itemId) {
    return tree.itemName;
  }
  for (const child of tree.children) {
    const name = getItemName(itemId, child);
    if (name) {
      return name;
    }
  }
  return `物品 ${itemId}`;
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
