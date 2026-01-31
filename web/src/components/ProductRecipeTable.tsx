import type { ManufacturingRecipe } from '../types/manufacturing';
import type { ItemLookup } from '../types/catalog';
import ItemImage from './ItemImage';

interface ProductRecipeTableProps {
  recipes: ManufacturingRecipe[];
  itemLookup?: ItemLookup;
  targetItemId: string;
}

function DeviceCell({ deviceId, deviceName, itemLookup }: { deviceId: string; deviceName: string, itemLookup?: ItemLookup }) {
  const deviceData = itemLookup?.[deviceId];

  return (
    <td className="border border-gray-300 p-2">
      <a href={`#/device/${deviceId}`} className="flex items-center gap-2 hover:bg-gray-100 rounded transition-colors">
        {deviceData ? (
          <>
            <ItemImage src={deviceData.image} alt={deviceData.name} className="w-8 h-8 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{deviceData.name}</div>
            </div>
          </>
        ) : (
          <div className="text-sm">{deviceName}</div>
        )}
      </a>
    </td>
  );
}

function RecipeCell({ items, highlightItemId, itemLookup }: { items: { id: string; name: string; count: number }[], highlightItemId?: string, itemLookup?: ItemLookup }) {
  if (items.length === 0) {
    return <td className="border border-gray-300 p-2 text-center text-gray-400">-</td>;
  }

  return (
    <td className="border border-gray-300 p-2">
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const itemData = itemLookup?.[item.id];
          const isHighlighted = highlightItemId === item.id;

          return (
            <a
              key={item.id}
              href={`#/item/${item.id}`}
              className={`flex items-center gap-2 p-2 rounded transition-colors ${isHighlighted ? 'bg-yellow-100 border border-yellow-300' : 'hover:bg-gray-100'}`}
            >
              {itemData && (
                <>
                  <ItemImage src={itemData.image} alt={itemData.name} className="w-8 h-8 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{itemData.name}</div>
                    <div className="text-xs text-gray-500">x{item.count}</div>
                  </div>
                </>
              )}
              {!itemData && (
                <div className="text-sm text-gray-400">
                  [{item.id}] x{item.count}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </td>
  );
}

export default function ProductRecipeTable({ recipes, itemLookup, targetItemId }: ProductRecipeTableProps) {
  if (recipes.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">作为产物的配方</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-3 text-left font-semibold">合成设备</th>
              <th className="border border-gray-300 p-3 text-left font-semibold">原料需求</th>
              <th className="border border-gray-300 p-3 text-left font-semibold">合成产物</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((recipe) => (
              <tr key={recipe.deviceId} className="hover:bg-gray-50">
                <DeviceCell deviceId={recipe.deviceId} deviceName={recipe.deviceName} itemLookup={itemLookup} />
                <RecipeCell items={recipe.materials} itemLookup={itemLookup} />
                <RecipeCell items={recipe.products} highlightItemId={targetItemId} itemLookup={itemLookup} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}