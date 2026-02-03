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
            <div className="text-blue-700">计算产出率</div>
            <div className="font-medium text-blue-900">
              {(plan.calculatedOutputRate * 60).toFixed(2)} 个/分钟
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
        <ConnectionGraph
          connections={plan.connections}
          devices={plan.devices}
          baseMaterials={plan.baseMaterials}
          targetProduct={plan.targetProduct}
          itemLookup={itemLookup}
        />
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
                        需求率：{(material.requiredRate * 60).toFixed(3)} 个/分钟
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
            {(device.productionRate * 60).toFixed(3)} 个/分钟
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
  baseMaterials: ProductionPlan['baseMaterials'];
  targetProduct: ProductionPlan['targetProduct'];
  itemLookup: ItemLookup;
}

type GraphNode = {
  id: string;
  label: string;
  stage: number;
  row: number;
  type: 'base' | 'device' | 'product';
  isFinal?: boolean;
};

type GraphEdge = {
  from: string;
  to: string;
  product: string;
};

function ConnectionGraph({
  connections,
  devices,
  baseMaterials,
  targetProduct,
  itemLookup,
}: ConnectionGraphProps) {
  console.log('[ConnectionGraph] Devices:', devices.map(d => `${d.deviceName}(${d.deviceId})`));
  console.log('[ConnectionGraph] Connections:', connections.map(c => `${c.from}→${c.to} (${c.itemId})`));
  console.log('[ConnectionGraph] Base Materials:', baseMaterials.map(b => b.name));
  
  const hasPlanConnections = connections.length > 0;
  const deviceMap = new Map(devices.map((d) => [d.deviceId, d]));

  const baseMaterialMap = new Map<string, string>();
  baseMaterials.forEach((material) => {
    baseMaterialMap.set(material.id, material.name);
  });

  const finalDeviceIds = new Set(
    devices
      .filter((device) => device.outputs.some((output) => output.destination === 'output'))
      .map((device) => device.deviceId)
  );

  const nodeMap = new Map<string, GraphNode>();
  const stageMap = new Map<string, number>();
  const rowMap = new Map<string, number>();
  const edges: GraphEdge[] = [];

  // Assign each base material to a unique row
  const baseMaterialRows = new Map<string, number>();
  baseMaterials.forEach((material, index) => {
    baseMaterialRows.set(material.id, index);
  });

  // Ensure base material nodes exist
  const ensureBaseNode = (itemId: string): string => {
    const nodeId = `base-${itemId}`;
    if (!nodeMap.has(nodeId)) {
      const label = baseMaterialMap.get(itemId) || itemLookup[itemId]?.name || itemId;
      const row = baseMaterialRows.get(itemId) ?? 0;
      nodeMap.set(nodeId, {
        id: nodeId,
        label,
        stage: 0,
        row,
        type: 'base',
      });
      stageMap.set(nodeId, 0);
      rowMap.set(nodeId, row);
    }
    return nodeId;
  };

  baseMaterials.forEach((material) => {
    ensureBaseNode(material.id);
  });

  // Compute dependency stages for devices
  const computeStage = (deviceId: string, stack: Set<string>): number => {
    if (stageMap.has(deviceId)) {
      return stageMap.get(deviceId) as number;
    }
    if (stack.has(deviceId)) {
      return 1;
    }
    stack.add(deviceId);

    const device = deviceMap.get(deviceId);
    if (!device) {
      stageMap.set(deviceId, 1);
      stack.delete(deviceId);
      return 1;
    }

    let maxStage = 0;
    device.inputs.forEach((input) => {
      if (input.source && input.source.startsWith('device-')) {
        const upstreamId = input.source.replace('device-', '');
        maxStage = Math.max(maxStage, computeStage(upstreamId, stack));
      } else {
        maxStage = Math.max(maxStage, 0);
      }
    });

    const currentStage = maxStage + 1;
    stageMap.set(deviceId, currentStage);
    stack.delete(deviceId);
    return currentStage;
  };

  // Assign rows to devices based on which base material they primarily consume
  const assignDeviceRow = (deviceId: string, visited: Set<string>): number => {
    if (rowMap.has(deviceId)) {
      return rowMap.get(deviceId) as number;
    }
    if (visited.has(deviceId)) {
      return 0; // Fallback to row 0 for cycles
    }
    visited.add(deviceId);

    const device = deviceMap.get(deviceId);
    if (!device) {
      rowMap.set(deviceId, 0);
      visited.delete(deviceId);
      return 0;
    }

    // Find which base material this device primarily consumes
    let primaryRow = 0;

    for (const input of device.inputs) {
      if (input.source && input.source.startsWith('device-')) {
        // Trace upstream to find the base material
        const upstreamId = input.source.replace('device-', '');
        const upstreamRow = assignDeviceRow(upstreamId, visited);
        primaryRow = upstreamRow;
      } else {
        // Direct base material input
        const row = baseMaterialRows.get(input.itemId);
        if (row !== undefined) {
          primaryRow = row;
          break; // Use first base material found
        }
      }
    }

    rowMap.set(deviceId, primaryRow);
    visited.delete(deviceId);
    return primaryRow;
  };

  // Process all devices
  devices.forEach((device) => {
    computeStage(device.deviceId, new Set());
    const row = assignDeviceRow(device.deviceId, new Set());
    nodeMap.set(device.deviceId, {
      id: device.deviceId,
      label: device.deviceName,
      stage: stageMap.get(device.deviceId) ?? 1,
      row,
      type: 'device',
      isFinal: finalDeviceIds.has(device.deviceId),
    });
  });

  // Add final product node
  const maxStage = Math.max(...Array.from(stageMap.values()));
  const productNodeId = 'product-final';
  nodeMap.set(productNodeId, {
    id: productNodeId,
    label: targetProduct.name,
    stage: maxStage + 1,
    row: 0, // Center row for final product
    type: 'product',
  });

  // Build edges
  devices.forEach((device) => {
    device.inputs.forEach((input) => {
      let fromId: string;
      if (input.source && input.source.startsWith('device-')) {
        const itemId = input.source.replace('device-', '');
        const producingDevice = devices.find((d) =>
          d.outputs.some((o) => o.itemId === itemId)
        );
        fromId = producingDevice ? producingDevice.deviceId : ensureBaseNode(itemId);
      } else {
        fromId = ensureBaseNode(input.itemId);
      }

      const productName = itemLookup[input.itemId]?.name || input.itemId;
      edges.push({ from: fromId, to: device.deviceId, product: productName });
    });
  });

  // Add edges from final devices to product node
  finalDeviceIds.forEach((deviceId) => {
    const device = deviceMap.get(deviceId);
    if (device) {
      const output = device.outputs.find((o) => o.destination === 'output');
      if (output) {
        const productName = itemLookup[output.itemId]?.name || output.itemId;
        edges.push({ from: deviceId, to: productNodeId, product: productName });
      }
    }
  });

  if (edges.length === 0 && !hasPlanConnections) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
        无需设备连接（所有原料来自仓库）
      </div>
    );
  }

  const cardWidth = 180;
  const cardHeight = 90;
  const columnGap = 60;
  const rowGap = 20;

  const layout = new Map<string, { x: number; y: number }>();
  let containerHeight = 0;
  let containerWidth = 0;

  // First pass: Calculate base positions
  const basePositions = new Map<string, { x: number; y: number }>();
  nodeMap.forEach((node) => {
    const x = node.stage * (cardWidth + columnGap);
    const y = node.row * (cardHeight + rowGap);
    basePositions.set(node.id, { x, y });
    containerHeight = Math.max(containerHeight, y + cardHeight);
    containerWidth = Math.max(containerWidth, x + cardWidth);
  });

  // Second pass: Adjust device positions to center on inputs
  nodeMap.forEach((node) => {
    if (node.type === 'device') {
      const device = deviceMap.get(node.id);
      if (device && device.inputs.length > 1) {
        const inputNodeIds = device.inputs.map((input) => {
          if (input.source && input.source.startsWith('device-')) {
            return input.source.replace('device-', '');
          } else {
            return `base-${input.itemId}`;
          }
        });
        
        const inputPositions = inputNodeIds
          .map((id) => basePositions.get(id))
          .filter((pos): pos is { x: number; y: number } => pos !== undefined);
        
        if (inputPositions.length > 1) {
          const avgY = inputPositions.reduce((sum, pos) => sum + pos.y, 0) / inputPositions.length;
          const basePos = basePositions.get(node.id)!;
          basePositions.set(node.id, { x: basePos.x, y: avgY });
        }
      }
    }
  });

  // Copy adjusted positions to final layout
  basePositions.forEach((pos, id) => {
    layout.set(id, pos);
  });

  containerWidth = Math.max(800, containerWidth + columnGap);
  containerHeight = Math.max(400, containerHeight + rowGap);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 overflow-x-auto">
      <div className="relative" style={{ width: containerWidth, height: containerHeight }}>
        <svg
          className="absolute inset-0 pointer-events-none"
          width={containerWidth}
          height={containerHeight}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
            </marker>
          </defs>
          {edges.map((edge, index) => {
            const fromPos = layout.get(edge.from);
            const toPos = layout.get(edge.to);
            if (!fromPos || !toPos) return null;

            const startX = fromPos.x + cardWidth;
            const startY = fromPos.y + cardHeight / 2;
            const endX = toPos.x;
            const endY = toPos.y + cardHeight / 2;
            const midX = (startX + endX) / 2;

            const path = `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`;

            return (
              <g key={index}>
                <path
                  d={path}
                  fill="none"
                  stroke="#6B7280"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={midX}
                  y={(startY + endY) / 2 - 6}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                  style={{ fontSize: '11px' }}
                >
                  {edge.product}
                </text>
              </g>
            );
          })}
        </svg>

        {Array.from(nodeMap.values()).map((node) => {
          const pos = layout.get(node.id);
          if (!pos) return null;

          const baseClasses =
            node.type === 'base'
              ? 'bg-green-50 border-green-300 text-green-900'
              : node.type === 'product'
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : node.isFinal
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-gray-200 text-gray-900';

          const device = deviceMap.get(node.id);
          const productionRate = device ? (device.productionRate * 60).toFixed(2) : null;
          const count = device?.count;

          return (
            <div
              key={node.id}
              className={`absolute rounded-lg p-3 shadow-sm border ${baseClasses}`}
              style={{
                left: pos.x,
                top: pos.y,
                width: cardWidth,
                height: cardHeight,
              }}
            >
              <div className="text-sm font-semibold truncate mb-1">{node.label}</div>
              {node.type === 'base' && (
                <div className="text-xs text-green-700">基础原料</div>
              )}
              {node.type === 'product' && (
                <div className="text-xs text-blue-700">最终产物</div>
              )}
              {node.type === 'device' && device && (
                <>
                  <div className="text-xs text-blue-600 mb-1">{count} 台</div>
                  <div className="text-xs text-gray-600">{productionRate} 个/分钟</div>
                  {node.isFinal && (
                    <div className="text-xs text-green-600 mt-1">产出: {targetProduct.name}</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center text-gray-500 text-sm mt-4">
        图例：每行代表一条从基础原料到最终产物的生产线，流程自左向右。
      </div>
    </div>
  );
}
