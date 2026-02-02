import { useState, useEffect } from 'react';
import RecipeEditor from './RecipeEditor';

interface RecipesPanelProps {
  customRecipes: { recipes: Record<string, any>; deletedRecipes: string[] };
  onLoad: () => Promise<void>;
}

export default function RecipesPanel({ customRecipes, onLoad }: RecipesPanelProps) {
  const [mergedRecipes, setMergedRecipes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [editingRecipe, setEditingRecipe] = useState<{id?: string; recipe?: any; apiRecipe?: any} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMergedRecipes();
  }, [customRecipes]);

  const fetchMergedRecipes = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/custom/recipes');
      const data = await res.json();
      setMergedRecipes(data.recipes || {});
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCell = (recipe: any, field: string) => {
    const apiRecipe = recipe.api;
    const customRecipe = recipe.custom;
    const apiValue = apiRecipe?.[field];
    const customValue = customRecipe?.[field];
    const mergedValue = customValue ?? apiValue;

    if (customValue && apiValue && customValue !== apiValue) {
      return (
        <>
          <span className="line-through text-gray-400 mr-1">{apiValue}</span>
          <span className="font-bold text-black">{customValue}</span>
        </>
      );
    }
    return mergedValue || '-';
  };

  const handleSaveRecipe = async (id: string, data: any) => {
    await fetch(`http://localhost:3001/api/custom/recipes/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    setEditingRecipe(null);
    await fetchMergedRecipes();
    await onLoad();
  };

const handleEdit = async (id: string) => {
  const res = await fetch(`http://localhost:3001/api/custom/recipes/${id}`);
  const data = await res.json();
  setEditingRecipe({ id, recipe: data.custom, apiRecipe: data.api });
  };

  if (editingRecipe) {
    return (
      <RecipeEditor
        recipeId={editingRecipe.id}
        recipe={editingRecipe.recipe}
        apiRecipe={editingRecipe.apiRecipe}
        onSave={handleSaveRecipe}
        onCancel={() => setEditingRecipe(null)}
      />
    );
  }

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  const recipes = mergedRecipes;

  const filteredRecipes = Object.entries(recipes).filter(([id, recipe]: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const materials = (recipe.custom?.materials || recipe.api?.materials || []).map((m: any) => m.name || m.id).join(' ');
    const products = (recipe.custom?.products || recipe.api?.products || []).map((p: any) => p.name || p.id).join(' ');
    const searchFields = [
      id,
      recipe.api?.deviceId,
      recipe.api?.deviceName,
      recipe.custom?.deviceId,
      recipe.custom?.deviceName,
      recipe.api?.manufacturingTime,
      recipe.custom?.manufacturingTime,
      materials,
      products,
    ].filter(Boolean).map(String).join(' ').toLowerCase();
    return searchFields.includes(query);
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">配方管理（API数据 + 自定义数据对比）</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm w-64"
          />
          <button
            onClick={() => setEditingRecipe({})}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            + 新增配方
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2 text-left w-32">设备</th>
              <th className="border border-gray-300 p-2 text-left w-64">原料</th>
              <th className="border border-gray-300 p-2 text-left w-64">产物</th>
              <th className="border border-gray-300 p-2 text-left w-16">时间</th>
              <th className="border border-gray-300 p-2 text-left w-24">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecipes.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-gray-300 p-4 text-center text-gray-500">
                  {Object.keys(recipes).length === 0 ? '暂无数据（API数据或自定义数据）' : '未找到匹配的结果'}
                </td>
              </tr>
            ) : (
              filteredRecipes.map(([id, recipe]: any) => {
                const apiRecipe = recipe.api;
                const customRecipe = recipe.custom;
                const mergedDeviceName = renderCell(recipe, 'deviceName');
                const mergedMaterials = customRecipe?.materials || apiRecipe?.materials || [];
                const mergedProducts = customRecipe?.products || apiRecipe?.products || [];
                const mergedTime = renderCell(recipe, 'manufacturingTime');

                return (
                  <tr key={id}>
                    <td className="border border-gray-300 p-2 w-32">{mergedDeviceName}</td>
                    <td className="border border-gray-300 p-2 text-sm w-64 whitespace-normal">
                      {mergedMaterials.map((m: any) => m.name || m.id).join(', ')}
                    </td>
                    <td className="border border-gray-300 p-2 text-sm w-64 whitespace-normal">
                      {mergedProducts.map((p: any) => p.name || p.id).join(', ')}
                    </td>
                    <td className="border border-gray-300 p-2 w-16">{mergedTime}s</td>
                    <td className="border border-gray-300 p-2 w-24">
                      <button onClick={() => handleEdit(id)} className="text-blue-600 hover:text-blue-800 text-sm">编辑</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
