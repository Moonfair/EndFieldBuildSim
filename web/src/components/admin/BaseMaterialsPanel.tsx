import { useState, useEffect } from 'react';

interface BaseMaterialsPanelProps {
  onSettingsChange?: (fixedBaseMaterials: string[]) => void;
}

export default function BaseMaterialsPanel({ onSettingsChange }: BaseMaterialsPanelProps) {
  const [fixedBaseMaterials, setFixedBaseMaterials] = useState<Record<string, boolean>>({});
  const [itemLookup, setItemLookup] = useState<Record<string, { name: string }>>({});
  const [loading, setLoading] = useState(true);

  const fetchItemLookup = async () => {
    try {
      const res = await fetch('/data/item_lookup.json');
      const data = await res.json();
      setItemLookup(data);
    } catch (error) {
      console.error('Failed to load item lookup:', error);
    }
  };

  const fetchFixedBaseMaterials = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/custom/base-materials');
      const data = await res.json();
      const materialsMap: Record<string, boolean> = {};
      for (const id of data.fixedBaseMaterials || []) {
        materialsMap[id] = true;
      }
      setFixedBaseMaterials(materialsMap);
    } catch (error) {
      console.error('Failed to load fixed base materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFixed = async (itemId: string) => {
    try {
      const newFixed = !fixedBaseMaterials[itemId];
      const res = await fetch('http://localhost:3001/api/custom/base-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, isFixed: newFixed }),
      });
      const data = await res.json();
      
      setFixedBaseMaterials((prev: any) => ({
        ...prev,
        [itemId]: newFixed,
      }));
      
      if (onSettingsChange && data.fixedBaseMaterials) {
        onSettingsChange(data.fixedBaseMaterials);
      }
    } catch (error) {
      console.error('Failed to toggle fixed material:', error);
    }
  };

  useEffect(() => {
    fetchItemLookup();
    fetchFixedBaseMaterials();
  }, []);

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  const allItemIds = Object.keys(itemLookup).sort();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">固定视为基础产物</h3>
        <p className="text-sm text-gray-600 mb-4">
          以下物品将始终被视为基础产物，不会在"基础原料选择"列表中出现
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allItemIds.map((itemId) => (
            <label
              key={itemId}
              className={`
                flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                ${fixedBaseMaterials[itemId]
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <input
                type="checkbox"
                checked={fixedBaseMaterials[itemId] || false}
                onChange={() => toggleFixed(itemId)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {itemLookup[itemId]?.name || itemId}
                </div>
                <div className="text-xs text-gray-600">
                  ID: {itemId}
                </div>
              </div>
            </label>
          ))}
        </div>

        {allItemIds.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>没有可配置的物品</p>
          </div>
        )}
      </div>
    </div>
  );
}