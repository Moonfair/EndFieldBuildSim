import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { CatalogItem, ItemLookup } from '../types/catalog';
import ItemCard from '../components/ItemCard';
import { SearchInput } from '../components/ui/SearchInput';
import { Skeleton } from '../components/ui/Skeleton';
import { loadRecipeLookup } from '../utils/recipeLoader';

export default function SearchPage() {
  const [itemLookup, setItemLookup] = useState<ItemLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recipeLookup, setRecipeLookup] = useState<Awaited<ReturnType<typeof loadRecipeLookup>> | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [itemResponse, recipeData] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/item_lookup.json`),
          loadRecipeLookup()
        ]);

        if (!itemResponse.ok) throw new Error(`HTTP ${itemResponse.status}`);

        const itemData: ItemLookup = await itemResponse.json();
        setItemLookup(itemData);
        setRecipeLookup(recipeData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('加载数据失败');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const items = useMemo<CatalogItem[]>(() => {
    if (!itemLookup) return [];

    const participatingItems = new Set<string>();

    if (recipeLookup) {
      recipeLookup.asMaterials.forEach((_recipes, itemId) => {
        participatingItems.add(itemId);
      });
      recipeLookup.asProducts.forEach((_recipes, itemId) => {
        participatingItems.add(itemId);
      });
      recipeLookup.byDevice.forEach((_recipes, deviceId) => {
        participatingItems.add(deviceId);
      });
    }

    const filteredItems = Object.values(itemLookup).filter((item) =>
      participatingItems.has(item.itemId)
    );

    return filteredItems.sort((a, b) => {
      const aIsDevice = a.subTypeID === '5';
      const bIsDevice = b.subTypeID === '5';

      if (aIsDevice && !bIsDevice) return 1;
      if (!aIsDevice && bIsDevice) return -1;

      return a.name.localeCompare(b.name);
    });
  }, [itemLookup, recipeLookup]);

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
