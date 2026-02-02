import { useState, useEffect } from 'react';
import ItemEditor from './ItemEditor';

interface ItemsPanelProps {
  customItems: Record<string, any>;
  onLoad: () => Promise<void>;
}

export default function ItemsPanel({ customItems, onLoad }: ItemsPanelProps) {
  const [mergedItems, setMergedItems] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<{id?: string; item?: any; apiItem?: any} | null>(null);

  useEffect(() => {
    fetchMergedItems();
  }, [customItems]);

  const fetchMergedItems = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/custom/items');
      const data = await res.json();
      setMergedItems(data.items);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (id: string, data: any) => {
    await fetch(`http://localhost:3001/api/custom/items/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    setEditingItem(null);
    await fetchMergedItems();
    await onLoad();
  };

  const handleEdit = async (id: string) => {
    const res = await fetch(`http://localhost:3001/api/custom/items/${id}`);
    const data = await res.json();
    setEditingItem({ id, item: data.custom, apiItem: data.api });
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('确定要删除此自定义数据吗？将恢复使用API原始数据。')) {
      await fetch(`http://localhost:3001/api/custom/items/${id}`, { method: 'DELETE' });
      await fetchMergedItems();
      await onLoad();
    }
  };

  if (editingItem) {
    return (
      <ItemEditor
        itemId={editingItem.id}
        item={editingItem.item}
        apiItem={editingItem.apiItem}
        onSave={handleSaveItem}
        onCancel={() => setEditingItem(null)}
      />
    );
  }

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">物品管理（API数据 + 自定义数据对比）</h2>
        <button
          onClick={() => setEditingItem({})}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          + 新增物品
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2 text-left">ID</th>
              <th className="border border-gray-300 p-2 text-left">名称</th>
              <th className="border border-gray-300 p-2 text-left">图片</th>
              <th className="border border-gray-300 p-2 text-left">子类型</th>
              <th className="border border-gray-300 p-2 text-left">状态</th>
              <th className="border border-gray-300 p-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(mergedItems).length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-gray-300 p-4 text-center text-gray-500">
                  暂无数据（API数据或自定义数据）
                </td>
              </tr>
            ) : (
              Object.entries(mergedItems).map(([id, item]: any) => (
                <tr key={id}>
                  <td className="border border-gray-300 p-2 font-mono text-sm">{id}</td>
                  <td className="border border-gray-300 p-2">
                    {item.isCustom ? (
                      <span className="text-green-600 font-medium">{item.custom?.name || '-'}</span>
                    ) : (
                      <div>
                        <div className="text-gray-400 text-sm line-through">{item.api?.name || '-'}</div>
                        <div className="text-blue-600 font-medium">{item.custom?.name || '-（无修改）'}</div>
                      </div>
                    )}
                  </td>
                  <td className="border border-gray-300 p-2 text-sm">
                    {item.isCustom ? (item.custom?.image || '-') : `${item.api?.image || '-'} / ${item.custom?.image || '无修改'}`}
                  </td>
                  <td className="border border-gray-300 p-2">{item.isCustom ? (item.custom?.subTypeName || '-') : (item.api?.subTypeName || item.custom?.subTypeName || '-')}</td>
                  <td className="border border-gray-300 p-2">
                    {item.isCustom ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">新增</span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">已修改</span>
                    )}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <button onClick={() => handleEdit(id)} className="text-blue-600 hover:text-blue-800 text-sm mr-2">编辑</button>
                    <button onClick={() => handleDeleteItem(id)} className="text-red-600 hover:text-red-800 text-sm">重置</button>
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
