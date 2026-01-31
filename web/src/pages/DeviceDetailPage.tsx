import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { ItemResponse } from '../types/detail';
import type { DeviceProductionTable as DeviceProductionTableType } from '../types/device';
import type { ItemLookup } from '../types/catalog';
import type { Block } from '../types/document';
import DocumentRenderer from '../components/DocumentRenderer';
import DeviceProductionTable from '../components/DeviceProductionTable';
import ItemImage from '../components/ItemImage';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '@/lib/utils';

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [deviceData, setDeviceData] = useState<ItemResponse | null>(null);
  const [productionTable, setProductionTable] = useState<DeviceProductionTableType | null>(null);
  const [itemLookup, setItemLookup] = useState<ItemLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/item_details/${id}.json`).then((res) => {
        if (!res.ok) throw new Error(`Device not found: ${id}`);
        return res.json();
      }),
      fetch(`${import.meta.env.BASE_URL}data/device_production_tables/${id}.json`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
      fetch(`${import.meta.env.BASE_URL}data/item_lookup.json`).then((res) => res.json()),
    ])
      .then(([deviceRes, productionRes, lookupRes]) => {
        setDeviceData(deviceRes);
        setProductionTable(productionRes);
        setItemLookup(lookupRes);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load device detail:', err);
        setError('加载数据失败');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Skeleton className="h-4 w-24 mb-6" />
        <div className="bg-white rounded-card shadow-card p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deviceData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || '设备不存在'}</div>
          <Link to="/" className="text-blue-600 hover:text-blue-800 underline">
            返回搜索
          </Link>
        </div>
      </div>
    );
  }

  const device = deviceData.data.item;
  const coverImage = device.brief?.cover;
  const deviceName = device.name || '未知设备';
  const mainType = device.mainType?.name;
  const subType = device.subType?.name;

  const extractDocument = (docMap: Record<string, any> | undefined) => {
    if (!docMap) return null;
    const docId = Object.keys(docMap)[0];
    const doc = docMap[docId];
    if (!doc || !doc.blockIds || !doc.blockMap) return null;

    const blocks: Block[] = doc.blockIds
      .map((blockId: string) => doc.blockMap[blockId])
      .filter((block: any) => block !== undefined);

    return { blocks, blockMap: doc.blockMap };
  };

  const briefDoc = extractDocument(device.brief?.description as any);
  const mainDoc = extractDocument(device.document?.documentMap as any);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl" data-testid="device-detail-page">
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:text-blue-800 underline text-sm">
          ← 返回搜索
        </Link>
      </div>

      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {coverImage && (
            <div className="flex-shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 aspect-square">
                <ItemImage src={coverImage} alt={deviceName} className="w-full h-full rounded-xl shadow-card" />
              </div>
            </div>
          )}
          
          <div className="flex-1">
            {subType && (
              <span className={cn(
                "inline-block text-xs px-2 py-1 rounded-full text-white mb-2",
                subType === "设备" ? "bg-badge-device" : "bg-badge-item"
              )}>
                {subType}
              </span>
            )}
            <h1 className="text-3xl font-bold mb-2">{deviceName}</h1>
            {(mainType || subType) && (
              <div className="text-sm text-gray-600 mb-4">
                {mainType && <span>{mainType}</span>}
                {mainType && subType && <span className="mx-2">•</span>}
                {subType && <span>{subType}</span>}
              </div>
            )}
            
            {briefDoc && (
              <div className="text-gray-700">
                <DocumentRenderer
                  blocks={briefDoc.blocks}
                  blockMap={briefDoc.blockMap}
                  itemLookup={itemLookup || undefined}
                />
              </div>
            )}
          </div>
        </div>

        {mainDoc && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-100">详细信息</h2>
            <DocumentRenderer
              blocks={mainDoc.blocks}
              blockMap={mainDoc.blockMap}
              itemLookup={itemLookup || undefined}
            />
          </div>
        )}
      </div>

      {productionTable && (
        <div className="bg-white rounded-card shadow-card p-6">
          <DeviceProductionTable table={productionTable} itemLookup={itemLookup || undefined} />
        </div>
      )}
    </div>
  );
}
