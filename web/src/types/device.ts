export interface RecipeItem {
  id: string;
  name: string;
  count: number;
}

export interface Recipe {
  materials: RecipeItem[];
  products: RecipeItem[];
  manufacturingTime?: number;
}

export interface DeviceProductionTable {
  deviceId: string;
  deviceName: string;
  recipeCount: number;
  recipes: Recipe[];
}
