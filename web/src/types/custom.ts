/**
 * Custom data layer types for overriding API data
 */

export interface CustomItem {
  id: string;
  name?: string;
  image?: string;
  subTypeID?: string;
  subTypeName?: string;
}

export interface CustomRecipe {
  id: string;
  deviceId: string;
  deviceName?: string;
  materials: Array<{
    id: string;
    name: string;
    count: string | number;
  }>;
  products: Array<{
    id: string;
    name: string;
    count: string | number;
  }>;
  manufacturingTime?: number;
}

export interface CustomDataDirectory {
  items: Record<string, CustomItem>;
  recipes: Record<string, CustomRecipe>;
  deletedRecipes: string[];
}
