import type { ProductionPlan } from '../types/manufacturing';
import { useNavigate } from 'react-router-dom';
import type { ItemLookup } from '../types/catalog';
import ItemImage from './ItemImage';

interface PlanVisualizerProps {
  plan: ProductionPlan;
  itemLookup: ItemLookup;
}

export default function PlanVisualizer({ plan, itemLookup }: PlanVisualizerProps) {
  const navigate = useNavigate();

  console.log('[VISUALIZER] Rendering plan:', {
    name: plan.name,
    devices: plan.devices.length,
    connections: plan.connections.length,
    baseMaterials: plan.baseMaterials.length,
    calculatedOutputRate: plan.calculatedOutputRate
  });
  
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
          
        </div>
      </div>

      {plan.bottleneck && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 mb-2">产能瓶颈</h4>
          <p className="text-amber-800">{plan.bottleneck.description}</p>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-gray-900 mb-4">设备连接</h4>
        <ConnectionGraph
          connections={plan.connections}
          devices={plan.devices}
          baseMaterials={plan.baseMaterials}
          itemLookup={itemLookup}
          navigate={navigate}
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
<div className="flex-1">
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

      <div>
        <h4 className="font-semibold text-gray-900 mb-4">设备配置</h4>
        <div className="space-y-4">
          {plan.devices.map((device, index) => (
            <DeviceCard key={`${device.deviceId}-${index}`} device={device} itemLookup={itemLookup} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DeviceCardProps {
  device: ProductionPlan['devices'][0];
  itemLookup: ItemLookup;
}

function DeviceCard({ device, itemLookup }: DeviceCardProps) {
  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm ${device.hasOverflow ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h5 className="font-semibold text-gray-900">{device.deviceName}</h5>
          <div className="text-sm text-gray-600 mt-1">
            设备 ID：{device.deviceId}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {device.hasOverflow && (
            <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
              ⚠️ 浪费 -{((1 - 1 / device.overflowRate!) * 100).toFixed(1)}%
            </div>
          )}
          <div className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-medium">
            {device.count} {device.count > 1 ? '台' : '台'}
          </div>
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
  itemLookup: ItemLookup;
  navigate: ReturnType<typeof import('react-router-dom').useNavigate>;
}

type GraphNode = {
  id: string;
  label: string;
  stage: number;
  row: number;
  type: 'base' | 'device' | 'product';
  isFinal?: boolean;
  deviceCount?: number;
  productionRate?: number;
};

type GraphEdge = {
  from: string;
  to: string;
  product: string;
};

type GraphDevice = {
  graphId: string;
  config: ProductionPlan['devices'][0];
};

function ConnectionGraph({
  connections,
  devices,
  baseMaterials,
  itemLookup,
  navigate,
}: ConnectionGraphProps) {
  const hasPlanConnections = connections.length > 0;

  const handleItemClick = (itemId: string) => {
    const item = itemLookup[itemId];
    if (!item) return;

    if (item.type === 'device') {
      navigate(`/device/${itemId}`);
    } else {
      navigate(`/item/${itemId}`);
    }
  };

  // ========== Step 1: Build device maps ==========
  const graphDevices: GraphDevice[] = devices.map((device, index) => ({
    graphId: `${device.deviceId}-${index}`,
    config: device,
  }));

  const deviceMap = new Map<string, GraphDevice>();
  graphDevices.forEach((entry) => {
    deviceMap.set(entry.graphId, entry);
  });

  const outputToDevice = new Map<string, GraphDevice>();
  const deviceIdToDevice = new Map<string, GraphDevice>();
  
  graphDevices.forEach((entry) => {
    deviceIdToDevice.set(entry.config.deviceId, entry);
    entry.config.outputs.forEach((output) => {
      if (!outputToDevice.has(output.itemId)) {
        outputToDevice.set(output.itemId, entry);
      }
    });
  });

  const baseMaterialMap = new Map<string, string>();
  const baseMaterialRates = new Map<string, number>();
  baseMaterials.forEach((material) => {
    baseMaterialMap.set(material.id, material.name);
    baseMaterialRates.set(material.id, material.requiredRate);
  });

  const finalDeviceIds = new Set(
    graphDevices
      .filter((entry) => entry.config.outputs.some((output) => output.destination === 'output'))
      .map((entry) => entry.graphId)
  );

  const nodeMap = new Map<string, GraphNode>();
  const stageMap = new Map<string, number>();
  const edges: GraphEdge[] = [];

  const BASE_EXTRACTION_RATE = 0.5;

  // ========== Step 2: Helper to resolve upstream node ID ==========
  const getUpstreamNodeId = (input: { itemId: string; source: string }): string | null => {
    if (input.source && input.source.startsWith('dev-')) {
      const upstreamDevice = deviceIdToDevice.get(input.source);
      return upstreamDevice ? upstreamDevice.graphId : null;
    } else if (input.source && input.source.startsWith('device-')) {
      const itemId = input.source.replace('device-', '');
      const upstreamDevice = outputToDevice.get(itemId);
      return upstreamDevice ? upstreamDevice.graphId : null;
    }
    return null; // warehouse source
  };

  // ========== Step 3: Compute stages using topological sort ==========
  const computeStage = (graphId: string, stack: Set<string>): number => {
    if (stageMap.has(graphId)) {
      return stageMap.get(graphId) as number;
    }
    if (stack.has(graphId)) {
      return 1; // cycle detected
    }
    stack.add(graphId);

    const entry = deviceMap.get(graphId);
    const device = entry?.config;
    if (!device) {
      stageMap.set(graphId, 1);
      stack.delete(graphId);
      return 1;
    }

    let maxStage = 0;
    device.inputs.forEach((input) => {
      const upstreamId = getUpstreamNodeId(input);
      if (upstreamId) {
        maxStage = Math.max(maxStage, computeStage(upstreamId, stack));
      }
    });

    const currentStage = maxStage + 1;
    stageMap.set(graphId, currentStage);
    stack.delete(graphId);
    return currentStage;
  };

  // Compute stages for all devices
  graphDevices.forEach(({ graphId }) => {
    computeStage(graphId, new Set());
  });

  // ========== Step 4: Create base nodes and build edges ==========
  const baseNodeIds = new Set<string>();
  
  const ensureBaseNode = (itemId: string): string => {
    const nodeId = `base-${itemId}`;
    if (!nodeMap.has(nodeId)) {
      const label = itemLookup[itemId]?.name || baseMaterialMap.get(itemId) || itemId;
      const requiredRate = baseMaterialRates.get(itemId) ?? 0;
      const deviceCount = requiredRate > 0 ? Math.ceil(requiredRate / BASE_EXTRACTION_RATE) : 0;
      
      nodeMap.set(nodeId, {
        id: nodeId,
        label,
        stage: 0,
        row: 0, // Will be assigned later
        type: 'base',
        deviceCount,
        productionRate: requiredRate,
      });
      stageMap.set(nodeId, 0);
      baseNodeIds.add(nodeId);
    }
    return nodeId;
  };

  // Create device nodes
  graphDevices.forEach(({ graphId, config }) => {
    nodeMap.set(graphId, {
      id: graphId,
      label: config.deviceName,
      stage: stageMap.get(graphId) ?? 1,
      row: 0, // Will be assigned later
      type: 'device',
      isFinal: finalDeviceIds.has(graphId),
    });
  });

  // Build edges and ensure base nodes exist
  graphDevices.forEach(({ graphId, config }) => {
    config.inputs.forEach((input) => {
      const upstreamId = getUpstreamNodeId(input);
      const fromId = upstreamId ?? ensureBaseNode(input.itemId);
      const productName = itemLookup[input.itemId]?.name || input.itemId;
      edges.push({ from: fromId, to: graphId, product: productName });
    });
  });

  if (edges.length === 0 && !hasPlanConnections) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
        无需设备连接（所有原料来自仓库）
      </div>
    );
  }

  // ========== Step 5: Build adjacency lists for layout algorithm ==========
  // outgoing: node -> list of downstream nodes
  // incoming: node -> list of upstream nodes
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  
  nodeMap.forEach((_, nodeId) => {
    outgoing.set(nodeId, []);
    incoming.set(nodeId, []);
  });
  
  edges.forEach((edge) => {
    outgoing.get(edge.from)?.push(edge.to);
    incoming.get(edge.to)?.push(edge.from);
  });

  // ========== Step 6: Group nodes by stage ==========
  const maxStage = Math.max(...Array.from(nodeMap.values()).map(n => n.stage));
  const stageNodes: string[][] = Array.from({ length: maxStage + 1 }, () => []);
  
  nodeMap.forEach((node) => {
    stageNodes[node.stage].push(node.id);
  });

  // ========== Step 7: Barycenter-based ordering to minimize crossings ==========
  // Initialize order: base nodes first, then devices by their first input's base material
  const nodeOrder = new Map<string, number>();
  
  // Initial ordering for stage 0 (base materials)
  // Sort by downstream device stages to group related materials
  const baseNodeList = stageNodes[0];
  const baseDownstreamInfo = baseNodeList.map(nodeId => {
    const downstreamStages = (outgoing.get(nodeId) || []).map(
      targetId => stageMap.get(targetId) ?? 1
    );
    const avgStage = downstreamStages.length > 0 
      ? downstreamStages.reduce((a, b) => a + b, 0) / downstreamStages.length 
      : 0;
    return { nodeId, avgStage };
  });
  baseDownstreamInfo.sort((a, b) => a.avgStage - b.avgStage);
  baseDownstreamInfo.forEach(({ nodeId }, idx) => {
    nodeOrder.set(nodeId, idx);
  });

  // Initial ordering for device stages
  for (let stage = 1; stage <= maxStage; stage++) {
    const nodesAtStage = stageNodes[stage];
    // Sort by barycenter of incoming nodes
    const nodeBarycenter = nodesAtStage.map(nodeId => {
      const incomingNodes = incoming.get(nodeId) || [];
      if (incomingNodes.length === 0) return { nodeId, barycenter: 0 };
      const sum = incomingNodes.reduce((acc, srcId) => acc + (nodeOrder.get(srcId) ?? 0), 0);
      return { nodeId, barycenter: sum / incomingNodes.length };
    });
    nodeBarycenter.sort((a, b) => a.barycenter - b.barycenter);
    nodeBarycenter.forEach(({ nodeId }, idx) => {
      nodeOrder.set(nodeId, idx);
    });
  }

  // ========== Step 8: Iterative barycenter refinement ==========
  const ITERATIONS = 4;
  
  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Forward pass: stage 1 to maxStage
    for (let stage = 1; stage <= maxStage; stage++) {
      const nodesAtStage = stageNodes[stage];
      const nodeBarycenter = nodesAtStage.map(nodeId => {
        const incomingNodes = incoming.get(nodeId) || [];
        if (incomingNodes.length === 0) return { nodeId, barycenter: nodeOrder.get(nodeId) ?? 0 };
        const sum = incomingNodes.reduce((acc, srcId) => acc + (nodeOrder.get(srcId) ?? 0), 0);
        return { nodeId, barycenter: sum / incomingNodes.length };
      });
      nodeBarycenter.sort((a, b) => a.barycenter - b.barycenter);
      nodeBarycenter.forEach(({ nodeId }, idx) => {
        nodeOrder.set(nodeId, idx);
      });
    }
    
    // Backward pass: stage maxStage-1 to 0
    for (let stage = maxStage - 1; stage >= 0; stage--) {
      const nodesAtStage = stageNodes[stage];
      const nodeBarycenter = nodesAtStage.map(nodeId => {
        const outgoingNodes = outgoing.get(nodeId) || [];
        if (outgoingNodes.length === 0) return { nodeId, barycenter: nodeOrder.get(nodeId) ?? 0 };
        const sum = outgoingNodes.reduce((acc, tgtId) => acc + (nodeOrder.get(tgtId) ?? 0), 0);
        return { nodeId, barycenter: sum / outgoingNodes.length };
      });
      nodeBarycenter.sort((a, b) => a.barycenter - b.barycenter);
      nodeBarycenter.forEach(({ nodeId }, idx) => {
        nodeOrder.set(nodeId, idx);
      });
    }
  }

  // ========== Step 9: Global row assignment to avoid edge-node conflicts ==========
  // Use a global grid approach: assign each node a unique global row
  // ensuring that edges don't pass through other nodes
  
  const cardWidth = 260;
  const cardHeight = 90;
  const columnGap = 100;
  const rowGap = 20;
  
  // First, assign global rows using a greedy algorithm
  // Track which global rows are occupied at each stage
  const globalRowAssignment = new Map<string, number>();
  const occupiedRows = new Map<number, Set<number>>(); // stage -> set of occupied global rows
  
  for (let s = 0; s <= maxStage; s++) {
    occupiedRows.set(s, new Set());
  }
  
  // Process stages from left to right
  for (let stage = 0; stage <= maxStage; stage++) {
    const nodesAtStage = stageNodes[stage];
    // Sort by barycenter order
    nodesAtStage.sort((a, b) => (nodeOrder.get(a) ?? 0) - (nodeOrder.get(b) ?? 0));
    
    for (const nodeId of nodesAtStage) {
      // Calculate preferred row based on incoming edges
      const incomingNodes = incoming.get(nodeId) || [];
      let preferredRow = 0;
      
      if (incomingNodes.length > 0) {
        // Use median of incoming node rows for better stability
        const incomingRows = incomingNodes
          .map(srcId => globalRowAssignment.get(srcId))
          .filter((r): r is number => r !== undefined)
          .sort((a, b) => a - b);
        
        if (incomingRows.length > 0) {
          const midIdx = Math.floor(incomingRows.length / 2);
          preferredRow = incomingRows[midIdx];
        }
      } else if (stage === 0) {
        // For base nodes without dependencies, use their barycenter order
        preferredRow = nodeOrder.get(nodeId) ?? 0;
      }
      
      // Find nearest available row that doesn't conflict with edges
      let assignedRow = preferredRow;
      const stageOccupied = occupiedRows.get(stage)!;
      
      // Check if preferred row is available
      if (stageOccupied.has(assignedRow)) {
        // Search for nearest available row
        let searchRadius = 1;
        while (true) {
          const upRow = preferredRow - searchRadius;
          const downRow = preferredRow + searchRadius;
          
          if (upRow >= 0 && !stageOccupied.has(upRow)) {
            assignedRow = upRow;
            break;
          }
          if (!stageOccupied.has(downRow)) {
            assignedRow = downRow;
            break;
          }
          searchRadius++;
          if (searchRadius > 100) break; // Safety limit
        }
      }
      
      globalRowAssignment.set(nodeId, assignedRow);
      stageOccupied.add(assignedRow);
      
      // Reserve rows for edge paths to this node
      // For each incoming edge, reserve the row range between source and target
      for (const srcId of incomingNodes) {
        const srcRow = globalRowAssignment.get(srcId);
        const srcStage = stageMap.get(srcId) ?? 0;
        if (srcRow !== undefined) {
          const minRow = Math.min(srcRow, assignedRow);
          const maxRow = Math.max(srcRow, assignedRow);
          // Reserve intermediate rows at intermediate stages
          for (let s = srcStage + 1; s < stage; s++) {
            for (let r = minRow; r <= maxRow; r++) {
              occupiedRows.get(s)!.add(r);
            }
          }
        }
      }
    }
  }
  
  // ========== Step 10: Calculate layout positions ==========
  const layout = new Map<string, { x: number; y: number }>();
  
  // Find the range of global rows used
  const allRows = Array.from(globalRowAssignment.values());
  const minGlobalRow = Math.min(...allRows, 0);
  const maxGlobalRow = Math.max(...allRows, 0);
  const totalRows = maxGlobalRow - minGlobalRow + 1;
  
  // Calculate positions
  nodeMap.forEach((node) => {
    const globalRow = globalRowAssignment.get(node.id) ?? 0;
    const adjustedRow = globalRow - minGlobalRow; // Normalize to 0-based
    
    const x = node.stage * (cardWidth + columnGap);
    const y = adjustedRow * (cardHeight + rowGap);
    layout.set(node.id, { x, y });
    
    // Update node.row for consistency
    node.row = adjustedRow;
  });

  // Calculate container dimensions
  let containerWidth = (maxStage + 1) * (cardWidth + columnGap);
  let containerHeight = totalRows * (cardHeight + rowGap);
  
  containerWidth = Math.max(800, containerWidth + columnGap);
  containerHeight = Math.max(200, containerHeight + rowGap);

  // Calculate midX for each target node
  const targetNodeMidXMap = new Map<string, number>();
  const edgesByTarget = new Map<string, Array<{ edge: typeof edges[0]; startX: number }>>();
  
  edges.forEach((edge) => {
    const fromPos = layout.get(edge.from);
    if (!fromPos) return;
    
    const startX = fromPos.x + cardWidth;
    if (!edgesByTarget.has(edge.to)) {
      edgesByTarget.set(edge.to, []);
    }
    edgesByTarget.get(edge.to)!.push({ edge, startX });
  });
  
  edgesByTarget.forEach((edgeList, targetId) => {
    const maxStartX = Math.max(...edgeList.map(e => e.startX));
    const toPos = layout.get(targetId);
    if (toPos) {
      const midX = (maxStartX + toPos.x) / 2;
      targetNodeMidXMap.set(targetId, midX);
    }
  });

  // ========== Step 11: Calculate edge geometries and crossings ==========
  const cornerRadius = 12;
  const jumpRadius = 6; // Size of the jump arc
  
  // Pre-calculate all edge segments for crossing detection
  type EdgeSegment = {
    edgeIndex: number;
    type: 'horizontal' | 'vertical';
    x1: number; y1: number; x2: number; y2: number;
  };
  
  const allSegments: EdgeSegment[] = [];
  const edgeGeometries: Array<{
    startX: number; startY: number;
    endX: number; endY: number;
    midX: number;
    isHorizontal: boolean;
    verticalStartY: number;
    verticalEndY: number;
  }> = [];
  
  edges.forEach((edge, index) => {
    const fromPos = layout.get(edge.from);
    const toPos = layout.get(edge.to);
    const midX = targetNodeMidXMap.get(edge.to);
    if (!fromPos || !toPos || midX === undefined) return;

    const startX = fromPos.x + cardWidth;
    const startY = fromPos.y + cardHeight / 2;
    const endX = toPos.x;
    const endY = toPos.y + cardHeight / 2;
    
    const isHorizontal = Math.abs(endY - startY) < 1;
    const isGoingDown = endY > startY;
    
    const verticalStartY = isHorizontal ? startY : startY + (isGoingDown ? cornerRadius : -cornerRadius);
    const verticalEndY = isHorizontal ? endY : endY - (isGoingDown ? cornerRadius : -cornerRadius);
    
    edgeGeometries[index] = {
      startX, startY, endX, endY, midX,
      isHorizontal,
      verticalStartY,
      verticalEndY
    };
    
    if (isHorizontal) {
      // Single horizontal segment
      allSegments.push({
        edgeIndex: index,
        type: 'horizontal',
        x1: startX, y1: startY, x2: endX, y2: endY
      });
    } else {
      // First horizontal segment
      allSegments.push({
        edgeIndex: index,
        type: 'horizontal',
        x1: startX, y1: startY, x2: midX, y2: startY
      });
      // Vertical segment
      allSegments.push({
        edgeIndex: index,
        type: 'vertical',
        x1: midX, y1: verticalStartY, x2: midX, y2: verticalEndY
      });
      // Second horizontal segment
      allSegments.push({
        edgeIndex: index,
        type: 'horizontal',
        x1: midX, y1: endY, x2: endX, y2: endY
      });
    }
  });
  
  // Find crossings: vertical segments crossing horizontal segments from OTHER edges
  const crossingsPerEdge = new Map<number, number[]>(); // edgeIndex -> array of Y positions where crossings occur
  
  allSegments.forEach((seg) => {
    if (seg.type !== 'vertical') return;
    
    const crossings: number[] = [];
    const vx = seg.x1; // x position of vertical segment
    const vy1 = Math.min(seg.y1, seg.y2);
    const vy2 = Math.max(seg.y1, seg.y2);
    
    allSegments.forEach((otherSeg) => {
      if (otherSeg.edgeIndex === seg.edgeIndex) return; // Skip same edge
      if (otherSeg.type !== 'horizontal') return;
      
      const hy = otherSeg.y1; // y position of horizontal segment
      const hx1 = Math.min(otherSeg.x1, otherSeg.x2);
      const hx2 = Math.max(otherSeg.x1, otherSeg.x2);
      
      // Check if they intersect
      if (vx > hx1 && vx < hx2 && hy > vy1 && hy < vy2) {
        crossings.push(hy);
      }
    });
    
    if (crossings.length > 0) {
      // Sort crossings by Y position
      crossings.sort((a, b) => a - b);
      const existing = crossingsPerEdge.get(seg.edgeIndex) || [];
      crossingsPerEdge.set(seg.edgeIndex, [...existing, ...crossings]);
    }
  });

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
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#3B82F6" />
            </marker>
          </defs>
          {edges.map((edge, index) => {
            const geom = edgeGeometries[index];
            if (!geom) return null;
            
            const { startX, startY, endX, endY, midX, isHorizontal, verticalStartY, verticalEndY } = geom;
            const crossings = crossingsPerEdge.get(index) || [];
            
            let path = `M ${startX} ${startY}`;
            
            if (isHorizontal) {
              path += ` H ${endX}`;
            } else {
              const isGoingDown = endY > startY;
              
              // First horizontal segment to first corner
              const firstCornerX = midX - cornerRadius;
              path += ` H ${firstCornerX}`;
              
              // First rounded corner (horizontal to vertical)
              path += ` Q ${midX} ${startY}, ${midX} ${verticalStartY}`;
              
              // Vertical segment with jump arcs at crossings
              if (crossings.length > 0) {
                // Sort crossings in the direction of travel
                const sortedCrossings = isGoingDown 
                  ? crossings.filter(y => y > verticalStartY && y < verticalEndY).sort((a, b) => a - b)
                  : crossings.filter(y => y < verticalStartY && y > verticalEndY).sort((a, b) => b - a);
                
                for (const crossY of sortedCrossings) {
                  // Draw line to just before the crossing
                  const beforeJump = isGoingDown ? crossY - jumpRadius : crossY + jumpRadius;
                  path += ` V ${beforeJump}`;
                  
                  // Draw jump arc (semicircle to the right)
                  const afterJump = isGoingDown ? crossY + jumpRadius : crossY - jumpRadius;
                  path += ` A ${jumpRadius} ${jumpRadius} 0 0 ${isGoingDown ? 1 : 0} ${midX} ${afterJump}`;
                }
                
                // Continue to vertical end
                path += ` V ${verticalEndY}`;
              } else {
                path += ` V ${verticalEndY}`;
              }
              
              // Second rounded corner (vertical to horizontal)
              const secondCornerX = midX + cornerRadius;
              path += ` Q ${midX} ${endY}, ${secondCornerX} ${endY}`;
              
              // Final horizontal segment to endpoint
              path += ` H ${endX}`;
            }

            return (
              <g key={index}>
                <path
                  d={path}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth={1}
                  strokeLinecap="round"
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={midX}
                  y={(startY + endY) / 2 - 6}
                  textAnchor="middle"
                  className="fill-gray-700"
                  style={{ fontSize: '13px', fontWeight: 500 }}
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

          const entry = deviceMap.get(node.id);
          const device = entry?.config;
          const productionRate = device ? (device.productionRate * 60).toFixed(2) : null;
          const count = device?.count;

          const baseClasses =
            node.type === 'base'
              ? 'bg-blue-50 border-blue-300 text-blue-900'
              : node.type === 'product'
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : node.isFinal
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : device?.hasOverflow
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : 'bg-white border-gray-200 text-gray-900';

          const getItemIdForClick = () => {
            if (node.type === 'base') {
              return node.id.replace('base-', '');
            }
            if (node.type === 'device' && device) {
              return device.deviceId;
            }
            return null;
          };

          const handleClick = () => {
            const itemId = getItemIdForClick();
            if (itemId) {
              handleItemClick(itemId);
            }
          };

          return (
            <div
              key={node.id}
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y,
                width: cardWidth,
                height: cardHeight,
              }}
            >
              <div className={`rounded-lg p-3 shadow-sm border h-full ${baseClasses} flex gap-2`}>
                {node.type === 'device' && device && (
                  <div className="flex-shrink-0 h-full flex items-center pr-2">
                    <div className="h-full cursor-pointer hover:opacity-80" onClick={() => handleItemClick(device.deviceId)}>
                      <ItemImage
                        src={itemLookup[device.recipe.deviceId]?.image || ''}
                        alt={device.deviceName}
                        className="h-full object-contain rounded"
                      />
                    </div>
                  </div>
                )}
                {node.type === 'base' && (
                  <div className="flex-shrink-0 h-full flex items-center pr-2">
                    <div className="h-full cursor-pointer hover:opacity-80" onClick={() => handleItemClick('170')}>
                      <ItemImage
                        src={itemLookup['170']?.image || ''}
                        alt="仓库取货口"
                        className="h-full object-contain rounded"
                      />
                    </div>
                  </div>
                )}
<div className="flex-1">
                  <div
                    className="text-sm font-semibold mb-1 whitespace-nowrap cursor-pointer hover:text-blue-600"
                    onClick={handleClick}
                  >{node.label}</div>
                  {node.type === 'base' && (
                    <>
                      {node.deviceCount !== undefined && node.deviceCount > 0 && (
                        <>
                          <div className="text-xs text-blue-600 mb-2 whitespace-nowrap"><span className="px-2 py-0.5 bg-blue-100 rounded-full">{node.deviceCount} 台</span></div>
                          <div className="text-xs text-gray-600 whitespace-nowrap">
                            {((node.productionRate ?? 0) * 60).toFixed(2)} 个/分钟
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {node.type === 'product' && (
                    <div className="text-xs text-blue-700 whitespace-nowrap">最终产物</div>
                  )}
                  {node.type === 'device' && device && (
                    <>
                      <div className="text-xs text-blue-600 mb-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-blue-100 rounded-full">{count} 台</span>
                        {device.hasOverflow && (
                          <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px]">
                            -{((1 - 1 / device.overflowRate!) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 whitespace-nowrap">{productionRate} 个/分钟</div>
                    </>
                  )}
                </div>
                <div className="flex-shrink-0 h-full flex items-center">
                  {node.type === 'device' && device && (
                    <>
{device.outputs.length > 0 && device.outputs.map((output, idx) => {
                        const item = itemLookup[output.itemId];
                        return item ? (
                          <div key={idx} className="h-full cursor-pointer hover:opacity-80" onClick={() => handleItemClick(output.itemId)}>
                            <ItemImage
                              src={item.image}
                              alt={item.name}
                              className="h-full object-contain rounded"
                            />
                          </div>
                        ) : null;
                      })}
                    </>
                  )}
                  {node.type === 'base' && (
                    <div className="h-full cursor-pointer hover:opacity-80" onClick={() => handleItemClick(node.id.replace('base-', ''))}>
                      <ItemImage
                        src={itemLookup[node.id.replace('base-', '')]?.image || ''}
                        alt={node.label}
                        className="h-full object-contain rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
