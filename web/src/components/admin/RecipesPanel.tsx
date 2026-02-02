import { useState } from 'react';
import RecipeEditor from './RecipeEditor';

interface RecipesPanelProps {
  customRecipes: {recipes: Record<string, any>; deletedRecipes: string[]};
  onLoad: () => Promise<void>;
}

export default function RecipesPanel({ customRecipes, onLoad }: RecipesPanelProps) {
  const [editingRecipe, setEditingRecipe] = useState<{id?: string; recipe?: any} | null>(null);

  const handleSaveRecipe = async (id: string, data: any) => {
    await fetch(`http://localhost:3001/api/custom/recipes/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    setEditingRecipe(null);
    await onLoad();
  };

  const handleDeleteRecipe = async (id: string) => {
    if (confirm('确定要删除此自定义配方吗？将恢复使用API原始数据。')) {
      await fetch(`http://localhost:3001/api/custom/recipes/${id}`, { method: 'DELETE' });
      await onLoad();
    }
  };

  const handleEdit = (id: string) => {
    setEditingRecipe({ id, recipe: customRecipes.recipes[id] });
  };

  const handleAdd = () => {
    setEditingRecipe({ id: `custom_recipe_${Date.now()}` });
  };

  if (editingRecipe) {
    return (
      <RecipeEditor
        recipeId={editingRecipe.id}
        recipe={editingRecipe.recipe}
        onSave={handleSaveRecipe}
        onCancel={() => setEditingRecipe(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">自定义配方</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          + 新增配方
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2 text-left">配方ID</th>
              <th className="border border-gray-300 p-2 text-left">设备</th>
              <th className="border border-gray-300 p-2 text-left">原料</th>
              <th className="border border-gray-300 p-2 text-left">产物</th>
              <th className="border border-gray-300 p-2 text-left">时间</th>
              <th className="border border-gray-300 p-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(customRecipes.recipes || {}).length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-gray-300 p-4 text-center text-gray-500">
                  暂无自定义配方
                </td>
              </tr>
            ) : (
              Object.entries(customRecipes.recipes || {}).map(([id, recipe]: any) => (
                <tr key={id}>
                  <td className="border border-gray-300 p-2 text-sm">{id}</td>
                  <td className="border border-gray-300 p-2">{recipe.deviceName || recipe.deviceId || '-'}</td>
                  <td className="border border-gray-300 p-2 text-sm">
                    {(recipe.materials || []).map((m: any, i: number) => (
                      <span key={i} className="mr-1">{m.name || m.id}x{m.count}</span>
                    ))}
                  </td>
                  <td className="border border-gray-300 p-2 text-sm">
                    {(recipe.products || []).map((p: any, i: number) => (
                      <span key={i} className="mr-1">{p.name || p.id}x{p.count}</span>
                    ))}
                  </td>
                  <td className="border border-gray-300 p-2">{recipe.manufacturingTime || '-'}s</td>
                  <td className="border border-gray-300 p-2">
                    <button onClick={() => handleEdit(id)} className="text-blue-600 hover:text-blue-800 text-sm mr-2">
                      编辑
                    </button>
                    <button onClick={() => handleDeleteRecipe(id)} className="text-red-600 hover:text-red-800 text-sm">
                      重置到API
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
