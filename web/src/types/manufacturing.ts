export interface ManufacturingRecipe {
  deviceId: string;
  deviceName: string;
  materials: Array<{ id: string; name: string; count: number }>;
  products: Array<{ id: string; name: string; count: number }>;
  manufacturingTime: number; // seconds
}

/**
 * 配方数据库
 */
export interface RecipeDatabase {
  recipes: Record<string, ManufacturingRecipe>;
  asMaterials: Record<string, string[]>;
  asProducts: Record<string, string[]>;
  byDevice: Record<string, string[]>;
}

/**
 * 设备生产表
 */
export interface DeviceProductionTable {
  deviceId: string;
  deviceName: string;
  recipeCount: number;
  recipes: Array<{
    materials: Array<{ id: string; name: string; count: number }>;
    products: Array<{ id: string; name: string; count: number }>;
  }>;
}

/**
 * 配方数据库
 */
export interface DependencyNode {
  itemId: string;
  itemName: string;
  isBase: boolean; // 是否为基础原料（无法生产或用户指定）
  recipes: ManufacturingRecipe[]; // 可用配方列表
  selectedRecipe?: ManufacturingRecipe; // 选中的配方
  children: DependencyNode[]; // 原料的依赖树
}

/**
 * 设备配置
 */
export interface DeviceConfig {
  deviceId: string;
  deviceName: string;
  recipe: ManufacturingRecipe;
  count: number; // 该设备数量
  productionRate: number; // 每秒产出数量
  inputs: Array<{ itemId: string; source: string }>; // 输入来源（设备或仓库）
  outputs: Array<{ itemId: string; destination: string }>; // 输出目标
  hasOverflow?: boolean; // 是否有产能溢出（最小规模方案中）
  overflowRate?: number; // 溢出率（实际产能 / 需求产能）
}

/**
 * 生产方案
 */
export interface ProductionPlan {
  type: 'efficiency' | 'minimum';
  name: string;
  targetProduct: { id: string; name: string };
  calculatedOutputRate: number;
  bottleneckStage?: { stage: string; rate: number; limitedBy: string };
  devices: DeviceConfig[];
  totalDeviceCount: number;
  bottleneck: { itemId: string; description: string } | null;
  connections: Connection[];
  baseMaterials: Array<{ id: string; name: string; requiredRate: number }>;
}

/**
 * 设备连接
 */
export interface Connection {
  from: string; // 设备ID 或 "warehouse"
  to: string; // 设备ID
  itemId: string;
  count: number; // 传输数量
  rate: number; // 传输速率（每秒）
}

/**
 * 模拟器状态
 */
export interface SimulatorState {
  targetItemId: string;
  targetRate?: number;
  baseMaterialIds: Set<string>; // 用户标记为基础原料的物品ID
  dependencyTree: DependencyNode | null;
  efficiencyPlan: ProductionPlan | null;
  minimumPlan: ProductionPlan | null; // 最小规模方案
  loading: boolean;
  error: string | null;
}

/**
 * 配方查找结果
 */
export interface RecipeLookup {
  asMaterials: Map<string, ManufacturingRecipe[]>; // itemId -> recipes (as material)
  asProducts: Map<string, ManufacturingRecipe[]>; // itemId -> recipes (as product)
  byDevice: Map<string, ManufacturingRecipe[]>; // deviceId -> recipes
  cycleGroups: Map<string, Set<string>>; // itemId -> cycle group ids
}
