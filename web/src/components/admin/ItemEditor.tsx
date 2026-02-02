import React, { useState } from 'react';

export interface ItemEditorProps {
  itemId?: string;
  item?: any;
  apiItem?: any;
  onSave: (id: string, data: any) => Promise<void>;
  onCancel: () => void;
}

export default function ItemEditor({ itemId, item, apiItem, onSave, onCancel }: ItemEditorProps) {
  const [formData, setFormData] = useState({
    id: itemId || '',
    name: item?.name || apiItem?.name || '',
    image: item?.image || apiItem?.image || '',
    subTypeID: item?.subTypeID || apiItem?.subTypeID || '',
    subTypeName: item?.subTypeName || apiItem?.subTypeName || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) {
      alert('请输入物品ID');
      return;
    }
    await onSave(formData.id, {
      name: formData.name,
      image: formData.image,
      subTypeID: formData.subTypeID || null,
      subTypeName: formData.subTypeName || null
    });
  };

  const showApiValue = apiItem !== null && !itemId;
  
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">
        {itemId ? '编辑物品' : '新增物品'} {apiItem && '(从API数据编辑)'}
      </h3>
      <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
        <p><strong>提示：</strong></p>
        <ul className="list-disc pl-5 mt-2">
          <li>灰色文字 = API原始数据</li>
          <li>黑色文字 = 自定义数据（未修改则显示API数据）</li>
          <li>编辑后保存只更新自定义字段</li>
        </ul>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">物品ID *</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({...formData, id: e.target.value})}
              disabled={!!itemId}
              className="w-full border border-gray-300 rounded p-2"
              placeholder="例如: 1 或 custom_001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
            {showApiValue && apiItem?.name && (
              <div className="text-gray-400 text-sm mb-1">API原始值: {apiItem.name}</div>
            )}
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-gray-300 rounded p-2"
              placeholder="物品显示名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">图片路径</label>
            {showApiValue && apiItem?.image && (
              <div className="text-gray-400 text-sm mb-1">API原始值: {apiItem.image}</div>
            )}
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({...formData, image: e.target.value})}
              className="w-full border border-gray-300 rounded p-2"
              placeholder="/images/items/custom.png"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">子类型ID</label>
              {showApiValue && apiItem?.subTypeID && (
                <div className="text-gray-400 text-sm mb-1">API原始值: {apiItem.subTypeID}</div>
              )}
              <input
                type="text"
                value={formData.subTypeID}
                onChange={(e) => setFormData({...formData, subTypeID: e.target.value})}
                className="w-full border border-gray-300 rounded p-2"
                placeholder="设备或物品类型ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">子类型名称</label>
              {showApiValue && apiItem?.subTypeName && (
                <div className="text-gray-400 text-sm mb-1">API原始值: {apiItem.subTypeName}</div>
              )}
              <input
                type="text"
                value={formData.subTypeName}
                onChange={(e) => setFormData({...formData, subTypeName: e.target.value})}
                className="w-full border border-gray-300 rounded p-2"
                placeholder="例如: 设备"
              />
            </div>
          </div>
        </div>
        <div className="flex space-x-3 mt-6">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            保存
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
