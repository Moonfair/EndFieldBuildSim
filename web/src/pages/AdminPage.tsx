import { useState, useEffect } from 'react';
import ItemsPanel from '../components/admin/ItemsPanel';
import RecipesPanel from '../components/admin/RecipesPanel';
import BaseMaterialsPanel from '../components/admin/BaseMaterialsPanel';
import IgnoredDevicesPanel from '../components/admin/IgnoredDevicesPanel';
import { clearRecipeCache } from '../utils/recipeLoader';

type Tab = 'items' | 'recipes' | 'settings';
type SettingsTab = 'base-materials' | 'ignored-devices';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('items');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('base-materials');
  const [customItems, setCustomItems] = useState<Record<string, any>>({ items: {} });
  const [customRecipes, setCustomRecipes] = useState({ recipes: {}, deletedRecipes: [], fixedBaseMaterials: [] });
  const [_fixedBaseMaterials, setFixedBaseMaterials] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomData = async () => {
    try {
      const [itemsRes, recipesRes, materialsRes] = await Promise.all([
        fetch('http://localhost:3001/api/custom/items'),
        fetch('http://localhost:3001/api/custom/recipes'),
        fetch('http://localhost:3001/api/custom/base-materials')
      ]);
      const recipesData = await recipesRes.json();
      const materialsData = await materialsRes.json();
      
      setCustomItems(await itemsRes.json());
      setCustomRecipes(recipesData);
      setFixedBaseMaterials(materialsData.fixedBaseMaterials || []);
    } catch (error) {
      console.error('Failed to load custom data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFixedMaterialsChange = (materials: string[]) => {
    setFixedBaseMaterials(materials);
  };

  const handleIgnoredDevicesChange = (_deviceIds: string[]) => {
    clearRecipeCache();
  };

  useEffect(() => {
    fetchCustomData();
  }, []);

  return (
    <div data-testid="admin-page" className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">Development only</p>

      <div className="border-b border-gray-300 mb-4">
        <div className="flex space-x-4">
          {(['items', 'recipes', 'settings'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 ${activeTab === tab ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-gray-500">Loading...</div>}

      {!loading && activeTab === 'items' && (
        <ItemsPanel customItems={customItems} onLoad={fetchCustomData} />
      )}

      {!loading && activeTab === 'recipes' && (
        <RecipesPanel customRecipes={customRecipes} onLoad={fetchCustomData} />
      )}

      {!loading && activeTab === 'settings' && (
        <div>
          <div className="border-b border-gray-300 mb-4">
            <div className="flex space-x-4">
              {(['base-materials', 'ignored-devices'] as SettingsTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSettingsTab(tab)}
                  className={`px-4 py-2 ${settingsTab === tab ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
                >
                  {tab === 'base-materials' ? '基础材料' : '忽略设备'}
                </button>
              ))}
            </div>
          </div>

          {settingsTab === 'base-materials' && (
            <div>
              <h2 className="text-lg font-semibold mb-3">基础材料设置</h2>
              <BaseMaterialsPanel
                onSettingsChange={handleFixedMaterialsChange}
              />
            </div>
          )}

          {settingsTab === 'ignored-devices' && (
            <IgnoredDevicesPanel onIgnoredDevicesChange={handleIgnoredDevicesChange} />
          )}
        </div>
      )}
    </div>
  );
}