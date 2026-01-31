import type { DeviceProductionTable as DeviceProductionTableType, RecipeItem } from '../types/device';
import type { ItemLookup } from '../types/catalog';
import ItemImage from './ItemImage';

interface DeviceProductionTableProps {
  table: DeviceProductionTableType;
  itemLookup?: ItemLookup;
}

interface RecipeItemRendererProps {
  items: RecipeItem[];
  itemLookup?: ItemLookup;
}

function RecipeItemRenderer({ items, itemLookup }: RecipeItemRendererProps) {
  if (items.length === 0) {
    return <td className="border border-gray-300 p-2 text-center text-gray-400">-</td>;
  }

  return (
    <td className="border border-gray-300 p-2">
      <div className="flex flex-col gap-2">
        {items.map((item, index) => {
          const lookupItem = itemLookup?.[item.id];
          const countText = item.count !== 0 ? `x${item.count}` : '';

          return (
            <a
              key={index}
              href={`#/item/${item.id}`}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 transition-colors"
            >
              {lookupItem && (
                <>
                  <ItemImage src={lookupItem.image} alt={lookupItem.name} className="w-8 h-8 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{lookupItem.name}</div>
                    {countText && <div className="text-xs text-gray-500">{countText}</div>}
                  </div>
                </>
              )}
              {!lookupItem && (
                <div className="text-sm text-gray-400">
                  [{item.id}] {countText}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </td>
  );
}

export default function DeviceProductionTable({ table, itemLookup }: DeviceProductionTableProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">{table.deviceName} - 生产表格</h3>
      
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full border-collapse border border-gray-300 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-3 text-left font-semibold">原料需求</th>
              <th className="border border-gray-300 p-3 text-left font-semibold">制作产物</th>
              <th className="border border-gray-300 p-3 text-left font-semibold">制造需要时间</th>
            </tr>
          </thead>
          <tbody>
            {table.recipes.map((recipe, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                <RecipeItemRenderer items={recipe.materials} itemLookup={itemLookup} />
                <RecipeItemRenderer items={recipe.products} itemLookup={itemLookup} />
                <td className="border border-gray-300 p-2 text-center">
                  <div className="text-sm font-medium">
                    {recipe.manufacturingTime || '-'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-600 mt-4">
        共 {table.recipeCount} 个配方
      </div>
    </div>
  );
}
