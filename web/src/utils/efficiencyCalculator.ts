import type {
  ProductionPlan,
  DeviceConfig,
  Connection,
  DependencyNode,
  ManufacturingRecipe,
} from '../types/manufacturing';

import { TRANSFER_RATE_PER_PIPE, BASE_MATERIAL_EXTRACTION_RATE } from './constants';

export function calculateMaximumEfficiencyPlan(
  targetItemId: string,
  targetItemName: string,
  dependencyTree: DependencyNode
): ProductionPlan {
  const selectedRecipes = new Map<string, ManufacturingRecipe>();
  selectRecipesForEfficiency(dependencyTree, selectedRecipes);

  const { devices, connections, baseMaterials, calculatedOutputRate } =
    balanceZeroWasteFlows(selectedRecipes, dependencyTree, targetItemId);

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

function balanceZeroWasteFlows(
  selectedRecipes: Map<string, ManufacturingRecipe>,
  dependencyTree: DependencyNode,
  targetItemId: string
): {
  devices: DeviceConfig[];
  connections: Connection[];
  baseMaterials: Array<{ id: string; name: string; requiredRate: number }>;
  calculatedOutputRate: number;
} {
  const devices: DeviceConfig[] = [];
  const connections: Connection[] = [];
  const baseMaterialsMap = new Map<string, number>();
  const outputRates = new Map<string, number>();

  const nodesInOrder = collectNodesInPostOrder(dependencyTree);

  for (const node of nodesInOrder) {
    if (node.isBase || !selectedRecipes.has(node.itemId)) {
      outputRates.set(node.itemId, BASE_MATERIAL_EXTRACTION_RATE);
      baseMaterialsMap.set(node.itemId, BASE_MATERIAL_EXTRACTION_RATE);
      continue;
    }

    const recipe = selectedRecipes.get(node.itemId)!;
    const maxInputRate = calculateMaxInputRate(recipe, outputRates);
    const singleDeviceRate =
      recipe.manufacturingTime > 0 ? 1 / recipe.manufacturingTime : 0;
    const deviceCount =
      maxInputRate > 0 && singleDeviceRate > 0
        ? Math.ceil(maxInputRate / singleDeviceRate)
        : 0;
    const outputRate = Math.min(maxInputRate, deviceCount * singleDeviceRate);

    outputRates.set(node.itemId, outputRate);

    const device: DeviceConfig = {
      deviceId: recipe.deviceId,
      deviceName: recipe.deviceName,
      recipe,
      count: deviceCount,
      productionRate: outputRate,
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

    if (deviceCount > 0) {
      devices.push(device);
    }
  }

  buildConnections(devices, connections);

  const baseMaterials = Array.from(baseMaterialsMap.entries()).map(
    ([id, rate]) => ({
      id,
      name: getItemName(id, dependencyTree),
      requiredRate: rate,
    })
  );

  return {
    devices,
    connections,
    baseMaterials,
    calculatedOutputRate: outputRates.get(targetItemId) || 0,
  };
}

function calculateMaxInputRate(
  recipe: ManufacturingRecipe,
  outputRates: Map<string, number>
): number {
  if (recipe.materials.length === 0) {
    return 0;
  }

  let maxInputRate = Number.POSITIVE_INFINITY;

  for (const material of recipe.materials) {
    if (material.count <= 0) {
      continue;
    }
    const availableRate = outputRates.get(material.id) || 0;
    const materialRate = availableRate / material.count;
    maxInputRate = Math.min(maxInputRate, materialRate);
  }

  return Number.isFinite(maxInputRate) ? maxInputRate : 0;
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

function collectNodesInPostOrder(node: DependencyNode): DependencyNode[] {
  const result: DependencyNode[] = [];
  const visited = new Set<string>();

  const visit = (current: DependencyNode) => {
    if (visited.has(current.itemId)) {
      return;
    }
    visited.add(current.itemId);
    for (const child of current.children) {
      visit(child);
    }
    result.push(current);
  };

  visit(node);
  return result;
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
