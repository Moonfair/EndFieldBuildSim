import type {
  ProductionPlan,
  DeviceConfig,
  Connection,
  DependencyNode,
  ManufacturingRecipe,
} from '../types/manufacturing';

const TRANSFER_RATE_PER_PIPE = 0.5;

export function calculateMinimumScalePlan(
  targetItemId: string,
  targetItemName: string,
  dependencyTree: DependencyNode,
  targetRate: number = 1
): ProductionPlan {
  const selectedRecipes = new Map<string, ManufacturingRecipe>();
  selectRecipesForMinScale(dependencyTree, selectedRecipes);

  const deviceUsage = new Map<string, ManufacturingRecipe[]>();
  for (const recipe of selectedRecipes.values()) {
    if (!deviceUsage.has(recipe.deviceId)) {
      deviceUsage.set(recipe.deviceId, []);
    }
    deviceUsage.get(recipe.deviceId)!.push(recipe);
  }

  const devices: DeviceConfig[] = [];
  const connections: Connection[] = [];
  const baseMaterials = new Map<string, number>();

  for (const [deviceId, recipes] of deviceUsage) {
    const primaryRecipe = recipes[0];
    const totalMaterialCount = recipes.reduce(
      (sum, r) => sum + r.materials.length,
      0
    );
    const totalProductCount = recipes.reduce(
      (sum, r) => sum + r.products.reduce((s, p) => s + p.count, 0),
      0
    );

    const avgProductionTime =
      recipes.reduce((sum, r) => sum + r.manufacturingTime, 0) /
      recipes.length;

    const deviceConfig: DeviceConfig = {
      deviceId,
      deviceName: primaryRecipe.deviceName,
      recipe: primaryRecipe,
      count: 1,
      productionRate: 0,
      inputs: [],
      outputs: [],
    };

    for (const recipe of recipes) {
      for (const material of recipe.materials) {
        const isBaseMaterial = isItemBaseMaterial(material.id, dependencyTree);
        if (isBaseMaterial) {
          baseMaterials.set(
            material.id,
            (baseMaterials.get(material.id) || 0) + material.count * targetRate
          );
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

    for (const recipe of recipes) {
      for (const product of recipe.products) {
        deviceConfig.outputs.push({
          itemId: product.id,
          destination: product.id === targetItemId ? 'output' : `device-${product.id}`,
        });
      }
    }

    deviceConfig.productionRate = Math.min(
      1 / avgProductionTime,
      totalProductCount / totalMaterialCount
    );

    devices.push(deviceConfig);
  }

  buildConnections(devices, connections);

  const bottleneck = findBottleneck(devices);

  return {
    type: 'scale',
    name: '最小规模生产方案',
    targetProduct: { id: targetItemId, name: targetItemName },
    targetRate,
    devices,
    totalDeviceCount: devices.length,
    bottleneck,
    connections,
    baseMaterials: Array.from(baseMaterials.entries()).map(([id, rate]) => ({
      id,
      name: getItemName(id, dependencyTree),
      requiredRate: rate,
    })),
  };
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
