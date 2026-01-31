export interface RecipeItem {
  id: string;
  name: string;
  count: string;
}

export interface Recipe {
  materials: RecipeItem[];
  products: RecipeItem[];
  manufacturingTime?: string;
}

export interface DeviceProductionTable {
  deviceId: string;
  deviceName: string;
  recipeCount: number;
  recipes: Recipe[];
}
