import { useState, useEffect } from 'react';
import ItemsPanel from '../components/admin/ItemsPanel';
import RecipesPanel from '../components/admin/RecipesPanel';

type Tab = 'items' | 'recipes' | 'settings';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('items');
  const [customItems, setCustomItems] = useState<Record<string, any>>({ items: {} });
  const [customRecipes, setCustomRecipes] = useState({ recipes: {}, deletedRecipes: [] });
  const [loading, setLoading] = useState(true);

  const fetchCustomData = async () => {
    try {
      const [itemsRes, recipesRes] = await Promise.all([
        fetch('http://localhost:3001/api/custom/items'),
        fetch('http://localhost:3001/api/custom/recipes')
      ]);
      setCustomItems(await itemsRes.json());
      setCustomRecipes(await recipesRes.json());
    } catch (error) {
      console.error('Failed to load custom data:', error);
    } finally {
      setLoading(false);
    }
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
              className={`px-4 py-2 \${activeTab === tab ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
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
          <h2 className="text-lg font-semibold mb-3">Settings</h2>
          <p className="text-gray-600">Run Python data collection scripts to update API data</p>
        </div>
      )}
    </div>
  );
}
