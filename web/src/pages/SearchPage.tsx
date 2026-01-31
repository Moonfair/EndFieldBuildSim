import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { CatalogItem, ItemLookup } from '../types/catalog';
import ItemCard from '../components/ItemCard';
import { SearchInput } from '../components/ui/SearchInput';
import { Skeleton } from '../components/ui/Skeleton';

export default function SearchPage() {
  const [itemLookup, setItemLookup] = useState<ItemLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/item_lookup.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: ItemLookup) => {
        setItemLookup(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load item lookup:', err);
        setError('加载数据失败');
        setLoading(false);
      });
  }, []);

  const items = useMemo<CatalogItem[]>(() => {
    if (!itemLookup) return [];
    return Object.values(itemLookup);
  }, [itemLookup]);

  const fuse = useMemo(() => {
    if (items.length === 0) return null;
    return new Fuse(items, {
      keys: ['name'],
      threshold: 0.3,
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    if (!fuse) return [];
    
    const results = fuse.search(searchQuery);
    return results.map((result) => result.item);
  }, [searchQuery, items, fuse]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-12 w-full mb-6 rounded-lg" />
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-card shadow-card p-4">
              <Skeleton className="w-24 h-24 mx-auto rounded" />
              <Skeleton className="h-4 w-3/4 mx-auto mt-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6" data-testid="search-page">
      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="搜索物品..."
        />
      </div>

      <div className="mb-4 text-sm text-gray-600">
        {searchQuery ? `找到 ${filteredItems.length} 个匹配物品` : `共 ${items.length} 个物品`}
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-fade-in">
          {filteredItems.map((item) => (
            <ItemCard key={item.itemId} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          没有找到匹配的物品
        </div>
      )}
    </div>
  );
}
