import { useState, useEffect } from 'react';
import ItemEditor from './ItemEditor';

interface ItemsPanelProps {
  customItems: Record<string, any>;
  onLoad: () => Promise<void>;
  filterType?: '5' | '6'; // 5 = devices, 6 = items
}

export default function ItemsPanel({ customItems, onLoad, filterType }: ItemsPanelProps) {
  const [mergedItems, setMergedItems] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<{id?: string; item?: any; apiItem?: any} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineEditData, setInlineEditData] = useState<any>({});

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

  const startInlineEdit = (id: string, item: any) => {
    setInlineEditingId(id);
    setInlineEditData({
      name: item.custom?.name || item.api?.name || '',
      width: item.custom?.width || item.api?.width || '',
      height: item.custom?.height || item.api?.height || '',
      powerConsumption: item.custom?.powerConsumption || item.api?.powerConsumption || ''
    });
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineEditData({});
  };

  const saveInlineEdit = async (id: string, item: any) => {
    const subTypeID = item.api?.subTypeID || item.custom?.subTypeID;
    const payload: any = {
      name: inlineEditData.name,
      image: item.custom?.image || item.api?.image,
      subTypeID: subTypeID || null,
      subTypeName: item.custom?.subTypeName || item.api?.subTypeName || null
    };

    if (subTypeID === '5') {
      payload.width = inlineEditData.width ? parseInt(String(inlineEditData.width), 10) : null;
      payload.height = inlineEditData.height ? parseInt(String(inlineEditData.height), 10) : null;
      payload.powerConsumption = inlineEditData.powerConsumption ? parseInt(String(inlineEditData.powerConsumption), 10) : null;
    }

    await fetch(`http://localhost:3001/api/custom/items/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    setInlineEditingId(null);
    setInlineEditData({});
    await fetchMergedItems();
    await onLoad();
  };

  const filteredItems = Object.entries(mergedItems).filter(([id, item]: any) => {
    // Filter by type (devices or items)
    if (filterType) {
      const itemType = item.api?.subTypeID || item.custom?.subTypeID;
      if (itemType !== filterType) return false;
    }
    
    // Filter by search query
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const searchFields = [
      id,
      item.api?.name,
      item.api?.subTypeName,
      item.custom?.name,
      item.custom?.subTypeName,
    ].filter(Boolean).map(String).join(' ').toLowerCase();
    return searchFields.includes(query);
  });

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
        <h2 className="text-lg font-semibold">
          {filterType === '5' ? '设备管理（API数据 + 自定义数据对比）' : filterType === '6' ? '物品管理（API数据 + 自定义数据对比）' : '物品管理（API数据 + 自定义数据对比）'}
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm w-64"
          />
          <button
            onClick={() => setEditingItem({})}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            + 新增{filterType === '5' ? '设备' : filterType === '6' ? '物品' : '物品'}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2 text-left">ID</th>
              <th className="border border-gray-300 p-2 text-left">名称</th>
              <th className="border border-gray-300 p-2 text-left">图片</th>
              <th className="border border-gray-300 p-2 text-left">子类型</th>
              <th className="border border-gray-300 p-2 text-left">宽度</th>
              <th className="border border-gray-300 p-2 text-left">高度</th>
              <th className="border border-gray-300 p-2 text-left">功率消耗</th>
              <th className="border border-gray-300 p-2 text-left">状态</th>
              <th className="border border-gray-300 p-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="border border-gray-300 p-4 text-center text-gray-500">
                  {Object.keys(mergedItems).length === 0 ? '暂无数据（API数据或自定义数据）' : '未找到匹配的结果'}
                </td>
              </tr>
            ) : (
              filteredItems.map(([id, item]: any) => {
                const isInlineEditing = inlineEditingId === id;
                const isDevice = item.api?.subTypeID === '5' || item.custom?.subTypeID === '5';
                
                return (
                  <tr key={id} className={isInlineEditing ? 'bg-yellow-50' : ''}>
                    <td className="border border-gray-300 p-2 font-mono text-sm">{id}</td>
                    
                    {/* Name field */}
                    <td className="border border-gray-300 p-2">
                      {isInlineEditing ? (
                        <input
                          type="text"
                          value={inlineEditData.name}
                          onChange={(e) => setInlineEditData({...inlineEditData, name: e.target.value})}
                          className="w-full border border-blue-300 rounded px-2 py-1 text-sm"
                        />
                      ) : (
                        item.isCustom ? (
                          <span className="text-green-600 font-medium">{item.custom?.name || '-'}</span>
                        ) : (
                          <div>
                            <div className="text-gray-400 text-sm line-through">{item.api?.name || '-'}</div>
                            <div className="text-blue-600 font-medium">{item.custom?.name || '-（无修改）'}</div>
                          </div>
                        )
                      )}
                    </td>
                    
                    {/* Image field */}
                    <td className="border border-gray-300 p-2 text-sm">
                      {item.isCustom ? (item.custom?.image || '-') : `${item.api?.image || '-'} / ${item.custom?.image || '无修改'}`}
                    </td>
                    
                    {/* SubType field */}
                    <td className="border border-gray-300 p-2">
                      {item.isCustom ? (item.custom?.subTypeName || '-') : (item.api?.subTypeName || item.custom?.subTypeName || '-')}
                    </td>
                    
                    {/* Width field */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isInlineEditing && isDevice ? (
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={inlineEditData.width}
                          onChange={(e) => setInlineEditData({...inlineEditData, width: e.target.value})}
                          className="w-full border border-blue-300 rounded px-2 py-1 text-sm text-center"
                        />
                      ) : (
                        isDevice ? (item.custom?.width ?? item.api?.width ?? '-') : '-'
                      )}
                    </td>
                    
                    {/* Height field */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isInlineEditing && isDevice ? (
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={inlineEditData.height}
                          onChange={(e) => setInlineEditData({...inlineEditData, height: e.target.value})}
                          className="w-full border border-blue-300 rounded px-2 py-1 text-sm text-center"
                        />
                      ) : (
                        isDevice ? (item.custom?.height ?? item.api?.height ?? '-') : '-'
                      )}
                    </td>
                    
                    {/* Power Consumption field */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isInlineEditing && isDevice ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={inlineEditData.powerConsumption}
                          onChange={(e) => setInlineEditData({...inlineEditData, powerConsumption: e.target.value})}
                          className="w-full border border-blue-300 rounded px-2 py-1 text-sm text-center"
                        />
                      ) : (
                        isDevice ? (item.custom?.powerConsumption ?? item.api?.powerConsumption ?? '-') : '-'
                      )}
                    </td>
                    
                    {/* Status field */}
                    <td className="border border-gray-300 p-2">
                      {item.isCustom ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">新增</span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">已修改</span>
                      )}
                    </td>
                    
                    {/* Actions field */}
                    <td className="border border-gray-300 p-2">
                      {isInlineEditing ? (
                        <div className="flex gap-1">
                          <button 
                            onClick={() => saveInlineEdit(id, item)} 
                            className="text-green-600 hover:text-green-800 text-sm px-2 py-1 border border-green-600 rounded"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={cancelInlineEdit} 
                            className="text-gray-600 hover:text-gray-800 text-sm px-2 py-1 border border-gray-600 rounded"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button 
                            onClick={() => startInlineEdit(id, item)} 
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            快捷
                          </button>
                          <button 
                            onClick={() => handleEdit(id)} 
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            编辑
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(id)} 
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            重置
                          </button>
                        </div>
                      )}
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
