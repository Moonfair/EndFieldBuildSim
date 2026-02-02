import React, { useState } from 'react';

export interface RecipeEditorProps {
  recipeId?: string;
  recipe?: any;
  apiRecipe?: any;
  onSave: (id: string, data: any) => Promise<void>;
  onCancel: () => void;
}

export default function RecipeEditor({ recipeId, recipe, apiRecipe, onSave, onCancel }: RecipeEditorProps) {
  const [formData, setFormData] = useState({
    id: recipeId || '',
    deviceId: recipe?.deviceId || apiRecipe?.deviceId || '174',
    deviceName: recipe?.deviceName || apiRecipe?.deviceName || '',
    manufacturingTime: recipe?.manufacturingTime || apiRecipe?.manufacturingTime || 2,
    materials: recipe?.materials || apiRecipe?.materials || [{id: '', name: '', count: 1}],
    products: recipe?.products || apiRecipe?.products || [{id: '', name: '', count: 1}]
  });

  const handleMaterialChange = (index: number, field: string, value: string | number) => {
    const newMaterials = [...formData.materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setFormData({...formData, materials: newMaterials});
  };

  const handleProductChange = (index: number, field: string, value: string | number) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setFormData({...formData, products: newProducts});
  };

  const addMaterial = () => {
    setFormData({...formData, materials: [...formData.materials, {id: '', name: '', count: 1}]});
  };

  const removeMaterial = (index: number) => {
    if (formData.materials.length > 1) {
      setFormData({...formData, materials: formData.materials.filter((_: any, i: number) => i !== index)});
    }
  };

  const addProduct = () => {
    setFormData({...formData, products: [...formData.products, {id: '', name: '', count: 1}]});
  };

  const removeProduct = (index: number) => {
    if (formData.products.length > 1) {
      setFormData({...formData, products: formData.products.filter((_: any, i: number) => i !== index)});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) {
      alert('请输入配方ID');
      return;
    }
    if (formData.materials.some((m: any) => !m.id) || formData.products.some((p: any) => !p.id)) {
      alert('请填写所有原料和产物的ID');
      return;
    }
    const data = {
      deviceId: formData.deviceId,
      deviceName: formData.deviceName,
      materials: formData.materials.map((m: any) => ({
        id: m.id,
        name: m.name || ('Item ' + m.id),
        count: Number(m.count)
      })),
      products: formData.products.map((p: any) => ({
        id: p.id,
        name: p.name || ('Item ' + p.id),
        count: Number(p.count)
      })),
      manufacturingTime: Number(formData.manufacturingTime)
    };
    await onSave(formData.id, data);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">
        {recipeId ? '编辑配方' : '新增配方'} {(apiRecipe && '(从API数据编辑)')}
      </h3>
      <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
        <p><strong>提示：</strong></p>
        <ul className="list-disc pl-5 mt-2">
          <li>灰色文字 = API原始数据</li>
          <li>黑色文字 = 自定义数据（未修改则显示API数据）</li>
          <li>编辑后保存只更新自定义字段</li>
        </ul>
        {apiRecipe && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="font-semibold">API原始配方数据：</p>
            <div className="text-xs mt-1">
              <p>原料: {(apiRecipe.materials || []).map((m: any) => m.name || m.id).join(', ') || '-'}</p>
              <p>产物: {(apiRecipe.products || []).map((p: any) => p.name || p.id).join(', ') || '-'}</p>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">配方ID</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
                disabled={!!recipeId}
                className="w-full border border-gray-300 rounded p-2"
              />
            </div>
<div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设备ID</label>
            {apiRecipe?.deviceId && (
              <div className="text-gray-400 text-sm mb-1">API原始值: {apiRecipe.deviceId}</div>
            )}
            <input
              type="text"
              value={formData.deviceId}
              onChange={(e) => setFormData({...formData, deviceId: e.target.value})}
              className="w-full border border-gray-300 rounded p-2"
              placeholder="例如: 174"
            />
          </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设备名称</label>
            {apiRecipe?.deviceName && (
              <div className="text-gray-400 text-sm mb-1">API原始值: {apiRecipe.deviceName}</div>
            )}
            <input
              type="text"
              value={formData.deviceName}
              onChange={(e) => setFormData({...formData, deviceName: e.target.value})}
              className="w-full border border-gray-300 rounded p-2"
              placeholder="种植机"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">制造时间(秒)</label>
            {apiRecipe?.manufacturingTime && apiRecipe?.manufacturingTime !== undefined && (
              <div className="text-gray-400 text-sm mb-1">API原始值: {apiRecipe.manufacturingTime}</div>
            )}
            <input
              type="number"
              value={formData.manufacturingTime}
              onChange={(e) => setFormData({...formData, manufacturingTime: Number(e.target.value)})}
              className="w-full border border-gray-300 rounded p-2"
              min="1"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">原料</label>
              <button type="button" onClick={addMaterial} className="text-sm text-blue-600 hover:text-blue-800">
                + 添加原料
              </button>
            </div>
            {formData.materials.map((material: any, index: number) => (
              <div key={index} className="flex gap-2 mb-2">
                <input type="text" value={material.id} onChange={(e) => handleMaterialChange(index, 'id', e.target.value)} placeholder="物品ID" className="flex-1 border border-gray-300 rounded p-2" />
                <input type="text" value={material.name} onChange={(e) => handleMaterialChange(index, 'name', e.target.value)} placeholder="名称" className="flex-1 border border-gray-300 rounded p-2" />
                <input type="number" value={material.count} onChange={(e) => handleMaterialChange(index, 'count', e.target.value)} placeholder="数量" className="w-20 border border-gray-300 rounded p-2" min="1" />
                <button type="button" onClick={() => removeMaterial(index)} className="text-red-600 hover:text-red-800 text-sm">✕</button>
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">产物</label>
              <button type="button" onClick={addProduct} className="text-sm text-blue-600 hover:text-blue-800">
                + 添加产物
              </button>
            </div>
            {formData.products.map((product: any, index: number) => (
              <div key={index} className="flex gap-2 mb-2">
                <input type="text" value={product.id} onChange={(e) => handleProductChange(index, 'id', e.target.value)} placeholder="物品ID" className="flex-1 border border-gray-300 rounded p-2" />
                <input type="text" value={product.name} onChange={(e) => handleProductChange(index, 'name', e.target.value)} placeholder="名称" className="flex-1 border border-gray-300 rounded p-2" />
                <input type="number" value={product.count} onChange={(e) => handleProductChange(index, 'count', e.target.value)} placeholder="数量" className="w-20 border border-gray-300 rounded p-2" min="1" />
                <button type="button" onClick={() => removeProduct(index)} className="text-red-600 hover:text-red-800 text-sm">✕</button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex space-x-3 mt-6">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">取消</button>
        </div>
      </form>
    </div>
  );
}
