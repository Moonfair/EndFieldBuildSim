import type { DependencyNode, ManufacturingRecipe } from '../types/manufacturing';
import type { ItemLookup } from '../types/catalog';
import ItemImage from './ItemImage';

interface BaseMaterialSelectorProps {
  dependencyTree: DependencyNode | null;
  selectedIds: Set<string>;
  onToggle: (itemId: string) => void;
  onUpdateTree: () => void;
  itemLookup: ItemLookup;
  selectedRecipes?: Map<string, ManufacturingRecipe>;
}

export default function BaseMaterialSelector({
  dependencyTree,
  selectedIds,
  onToggle,
  onUpdateTree,
  itemLookup,
  selectedRecipes,
}: BaseMaterialSelectorProps) {
  if (!dependencyTree) {
    return (
      <div className="text-center py-4 text-gray-500">
        正在加载依赖数据...
      </div>
    );
  }

  const allItems = selectedRecipes
    ? flattenDependencyTreeForSelectedRecipes(dependencyTree, selectedRecipes)
    : flattenDependencyTree(dependencyTree);

  const selectableItems = allItems.filter(
    (item) =>
      (item.recipes.length > 0 && !item.isBase) || selectedIds.has(item.itemId)
  );

  const allItemIds = new Set(allItems.map((item) => item.itemId));
  selectedIds.forEach((id) => {
    if (!allItemIds.has(id)) {
      const itemInfo = itemLookup[id];
      if (itemInfo) {
        selectableItems.push({
          itemId: id,
          itemName: itemInfo.name,
          isBase: true,
          recipes: [],
          depth: 0,
        });
      }
    }
  });

  const uniqueItems = Array.from(
    new Map(selectableItems.map((item) => [item.itemId, item])).values()
  );
  const selectedCount = selectedIds.size;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">
          基础原料选择
        </h4>
        <div className="text-sm text-gray-600">
          已选 {selectedCount} / 可选 {selectableItems.length}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">
                已标记为基础原料的物品将直接从仓库取用
              </p>
              <p className="text-xs text-blue-700">
                这些物品不需要制造设备，会从仓库以 2秒/个 的速度提供
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {uniqueItems.map((item) => {
          const isSelected = selectedIds.has(item.itemId);
          const itemInfo = itemLookup[item.itemId];

          return (
            <label
              key={item.itemId}
              className={`
                flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(item.itemId)}
                className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />

              {itemInfo && (
                <ItemImage src={itemInfo.image} alt={item.itemName} className="w-10 h-10" />
              )}

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 mb-1">
                  {item.itemName}
                </div>
                <div className="text-xs text-gray-600">
                  {item.recipes.length} 个可用配方
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {uniqueItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>没有可选择的中间产物</p>
          <p className="text-sm mt-2">
            所有物品都是基础原料或没有可用配方
          </p>
        </div>
      )}
    </div>
  );
}

interface FlatItem {
  itemId: string;
  itemName: string;
  isBase: boolean;
  recipes: DependencyNode['recipes'];
  depth: number;
}

function flattenDependencyTree(tree: DependencyNode): FlatItem[] {
  const items: FlatItem[] = [];
  const visited = new Set<string>();

  function traverse(node: DependencyNode, depth: number = 0) {
    if (visited.has(node.itemId)) {
      return;
    }
    visited.add(node.itemId);

    items.push({
      itemId: node.itemId,
      itemName: node.itemName,
      isBase: node.isBase,
      recipes: node.recipes,
      depth,
    });

    for (const child of node.children) {
      traverse(child, depth + 1);
    }
  }

  traverse(tree);
  return items;
}

function flattenDependencyTreeForSelectedRecipes(
  tree: DependencyNode,
  selectedRecipes: Map<string, ManufacturingRecipe>
): FlatItem[] {
  const items: FlatItem[] = [];
  const visited = new Set<string>();

  function traverse(node: DependencyNode, depth: number = 0, recipe: ManufacturingRecipe | null = null) {
    if (visited.has(node.itemId)) {
      return;
    }

    visited.add(node.itemId);
    items.push({
      itemId: node.itemId,
      itemName: node.itemName,
      isBase: node.isBase || (!recipe && node.recipes.length === 0),
      recipes: recipe ? [recipe] : [],
      depth,
    });

    if (node.isBase || !recipe) {
      return;
    }

    for (const material of recipe.materials) {
      const childNode = node.children.find((c) => c.itemId === material.id);
      if (childNode) {
        const childRecipe = selectedRecipes.get(material.id);
        traverse(childNode, depth + 1, childRecipe);
      }
    }
  }

  const rootRecipe = selectedRecipes.get(tree.itemId);
  traverse(tree, 0, rootRecipe);
  return items;
}