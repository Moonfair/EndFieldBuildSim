import type { ProductionPlan } from '../types/manufacturing';
import type { ItemLookup } from '../types/catalog';
import ItemImage from './ItemImage';

interface PlanVisualizerProps {
  plan: ProductionPlan;
  itemLookup: ItemLookup;
}

export default function PlanVisualizer({ plan, itemLookup }: PlanVisualizerProps) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">{plan.name}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-blue-700">目标产物</div>
            <div className="font-medium text-blue-900">{plan.targetProduct.name}</div>
          </div>
          <div>
            <div className="text-blue-700">目标产出率</div>
            <div className="font-medium text-blue-900">
              {plan.targetRate.toFixed(2)} 个/秒
            </div>
          </div>
          <div>
            <div className="text-blue-700">设备总数</div>
            <div className="font-medium text-blue-900">{plan.totalDeviceCount}</div>
          </div>
          <div>
            <div className="text-blue-700">方案类型</div>
            <div className="font-medium text-blue-900">
              {plan.type === 'efficiency' ? '最高效率' : '最小规模'}
            </div>
          </div>
        </div>
      </div>

      {plan.bottleneck && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 mb-2">产能瓶颈</h4>
          <p className="text-amber-800">{plan.bottleneck.description}</p>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-gray-900 mb-4">设备配置</h4>
        <div className="space-y-4">
          {plan.devices.map((device, index) => (
            <DeviceCard key={`${device.deviceId}-${index}`} device={device} itemLookup={itemLookup} />
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-4">设备连接</h4>
        <ConnectionGraph connections={plan.connections} devices={plan.devices} itemLookup={itemLookup} />
      </div>

      {plan.baseMaterials.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">基础原料需求</h4>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {plan.baseMaterials.map((material) => {
                const item = itemLookup[material.id];
                return (
                  <div
                    key={material.id}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    {item && (
                      <ItemImage src={item.image} alt={material.name} className="w-10 h-10" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{material.name}</div>
                      <div className="text-xs text-gray-600">
                        需求率：{material.requiredRate.toFixed(3)} 个/秒
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DeviceCardProps {
  device: ProductionPlan['devices'][0];
  itemLookup: ItemLookup;
}

function DeviceCard({ device, itemLookup }: DeviceCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h5 className="font-semibold text-gray-900">{device.deviceName}</h5>
          <div className="text-sm text-gray-600 mt-1">
            设备 ID：{device.deviceId}
          </div>
        </div>
        <div className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-medium">
          {device.count} {device.count > 1 ? '台' : '台'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-600">生产速率</div>
          <div className="font-medium text-gray-900">
            {device.productionRate.toFixed(3)} 个/秒
          </div>
        </div>
        <div>
          <div className="text-gray-600">制造时间</div>
          <div className="font-medium text-gray-900">
            {device.recipe.manufacturingTime} 秒
          </div>
        </div>
        <div>
          <div className="text-gray-600">原料数</div>
          <div className="font-medium text-gray-900">
            {device.recipe.materials.length}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">输入</div>
          <div className="flex flex-wrap gap-2">
            {device.inputs.map((input, index) => {
              const item = itemLookup[input.itemId];
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded text-xs"
                >
                  {item && (
                    <ItemImage src={item.image} alt={item.name} className="w-5 h-5" />
                  )}
                  <span className="text-gray-700">
                    {item?.name || input.itemId}
                  </span>
                  {input.source === 'warehouse' && (
                    <span className="text-blue-600">📦</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">输出</div>
          <div className="flex flex-wrap gap-2">
            {device.outputs.map((output, index) => {
              const item = itemLookup[output.itemId];
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 px-2 py-1 bg-green-100 rounded text-xs"
                >
                  {item && (
                    <ItemImage src={item.image} alt={item.name} className="w-5 h-5" />
                  )}
                  <span className="text-green-800">
                    {item?.name || output.itemId}
                  </span>
                  {output.destination === 'output' && (
                    <span className="text-green-600">🎯</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConnectionGraphProps {
  connections: ProductionPlan['connections'];
  devices: ProductionPlan['devices'];
  itemLookup: ItemLookup;
}

function ConnectionGraph({ connections, devices, itemLookup }: ConnectionGraphProps) {
  const groupedConnections = connections.reduce((acc, conn) => {
    const key = `${conn.from}-${conn.to}`;
    if (!acc.has(key)) {
      acc.set(key, []);
    }
    acc.get(key)!.push(conn);
    return acc;
  }, new Map<string, ProductionPlan['connections'][0][]>());

  if (connections.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
        无需设备连接（所有原料来自仓库）
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
      <div className="min-w-[600px]">
        {Array.from(groupedConnections.entries()).map(([key, conns]) => {
          const [from, to] = key.split('-');
          const fromDevice = devices.find((d) => d.deviceId === from);
          const toDevice = devices.find((d) => d.deviceId === to);
          const item = itemLookup[conns[0].itemId];

          return (
            <div key={key} className="flex items-center gap-3 py-2">
              <div className="flex-1 text-right">
                <div className="font-medium text-sm text-gray-900">
                  {fromDevice?.deviceName || from}
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-lg">
                <span className="text-xs text-blue-700">
                  {conns.length} 条连接
                </span>
                {item && (
                  <ItemImage src={item.image} alt={item.name} className="w-4 h-4" />
                )}
                <span className="text-xs text-blue-700">
                  {item.name || conns[0].itemId}
                </span>
                <span className="text-xs text-blue-900 font-medium">
                  {conns[0].rate} 个/秒
                </span>
              </div>

              <div className="flex-1 text-left">
                <div className="font-medium text-sm text-gray-900">
                  {toDevice?.deviceName || to}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
