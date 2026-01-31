import type { DependencyNode, ManufacturingRecipe, RecipeLookup } from '../types/manufacturing';

interface BuildOptions {
  targetItemId: string;
  targetItemName: string;
  baseMaterialIds: Set<string>;
  recipeLookup: RecipeLookup;
  maxDepth?: number;
  visited?: Set<string>;
}

export function buildDependencyTree(options: BuildOptions): DependencyNode {
  const {
    targetItemId,
    targetItemName,
    baseMaterialIds,
    recipeLookup,
    maxDepth = 50,
    visited = new Set(),
  } = options;

  if (visited.has(targetItemId)) {
    return {
      itemId: targetItemId,
      itemName: targetItemName,
      isBase: false,
      recipes: [],
      children: [],
    };
  }

  if (maxDepth <= 0) {
    return {
      itemId: targetItemId,
      itemName: targetItemName,
      isBase: true,
      recipes: [],
      children: [],
    };
  }

  visited.add(targetItemId);

  const isBaseMaterial = baseMaterialIds.has(targetItemId);
  const recipes = recipeLookup.asProducts.get(targetItemId) || [];

  const children: DependencyNode[] = [];
  const uniqueMaterialIds = new Set<string>();

  for (const recipe of recipes) {
    for (const material of recipe.materials) {
      if (uniqueMaterialIds.has(material.id)) continue;
      uniqueMaterialIds.add(material.id);

      if (!isBaseMaterial && !baseMaterialIds.has(material.id)) {
        const childNode = buildDependencyTree({
          targetItemId: material.id,
          targetItemName: material.name,
          baseMaterialIds,
          recipeLookup,
          maxDepth: maxDepth - 1,
          visited: new Set(visited),
        });
        children.push(childNode);
      }
    }
  }

  return {
    itemId: targetItemId,
    itemName: targetItemName,
    isBase: isBaseMaterial || recipes.length === 0,
    recipes,
    children,
  };
}

export function selectOptimalRecipe(
  node: DependencyNode,
  strategy: 'efficiency' | 'scale'
): ManufacturingRecipe | undefined {
  if (node.isBase || node.recipes.length === 0) {
    return undefined;
  }

  if (strategy === 'scale') {
    const uniqueDevices = new Set(node.recipes.map((r) => r.deviceId));
    if (uniqueDevices.size === 1) {
      return node.recipes[0];
    }

    return node.recipes.reduce((best, current) => {
      const bestMaterialCount = best.materials.length;
      const currentMaterialCount = current.materials.length;
      return currentMaterialCount < bestMaterialCount ? current : best;
    });
  }

  return node.recipes.reduce((best, current) => {
    const bestTime = best.manufacturingTime;
    const currentTime = current.manufacturingTime;
    return currentTime < bestTime ? current : best;
  });
}

export function countRequiredItems(
  node: DependencyNode,
  selectedRecipes: Map<string, ManufacturingRecipe>,
  quantity: number = 1
): Map<string, number> {
  const result = new Map<string, number>();
  const recipe = selectedRecipes.get(node.itemId);

  if (!recipe || node.isBase) {
    result.set(node.itemId, (result.get(node.itemId) || 0) + quantity);
    return result;
  }

  for (const product of recipe.products) {
    const productQuantity = quantity * product.count;
    result.set(node.itemId, (result.get(node.itemId) || 0) + productQuantity);
  }

  for (const material of recipe.materials) {
    const materialQuantity = quantity * material.count;
    for (const child of node.children) {
      if (child.itemId === material.id) {
        const childRequirements = countRequiredItems(
          child,
          selectedRecipes,
          materialQuantity
        );
        for (const [id, qty] of childRequirements) {
          result.set(id, (result.get(id) || 0) + qty);
        }
      }
    }
  }

  return result;
}

export function findCircularDependencies(
  node: DependencyNode,
  path: string[] = []
): string[][] | null {
  const currentPath = [...path, node.itemId];

  if (path.includes(node.itemId)) {
    return [currentPath];
  }

  for (const child of node.children) {
    const cycles = findCircularDependencies(child, currentPath);
    if (cycles) {
      return cycles;
    }
  }

  return null;
}
