import type { ManufacturingRecipe, RecipeLookup } from '../types/manufacturing';
import type { ItemLookup } from '../types/catalog';

interface RecipeEntry {
  deviceId: string;
  deviceName: string;
  materials: Array<{ id: string; name: string; count: number }>;
  products: Array<{ id: string; name: string; count: number }>;
  manufacturingTime?: number;
}

interface RecipeDatabase {
  recipes: Record<string, RecipeEntry>;
  asMaterials: Record<string, string[]>;
  asProducts: Record<string, string[]>;
  byDevice: Record<string, string[]>;
}

let cachedRecipeLookup: RecipeLookup | null = null;
let cachedRecipes: Map<string, ManufacturingRecipe> | null = null;

export async function loadRecipeLookup(_itemLookup?: ItemLookup): Promise<RecipeLookup> {
  if (cachedRecipeLookup) {
    return cachedRecipeLookup;
  }

  const asMaterials = new Map<string, ManufacturingRecipe[]>();
  const asProducts = new Map<string, ManufacturingRecipe[]>();
  const byDevice = new Map<string, ManufacturingRecipe[]>();
  cachedRecipes = new Map<string, ManufacturingRecipe>();

  const response = await fetch(`${import.meta.env.BASE_URL}data/recipe_database.json`);
  if (!response.ok) {
    console.error('Failed to load recipe_database.json');
    return { asMaterials, asProducts, byDevice };
  }

  const database: RecipeDatabase = await response.json();

  for (const [recipeId, recipe] of Object.entries(database.recipes)) {
    const manufacturingRecipe: ManufacturingRecipe = {
      deviceId: recipe.deviceId,
      deviceName: recipe.deviceName,
      materials: recipe.materials,
      products: recipe.products,
      manufacturingTime: recipe.manufacturingTime || 2,
    };

    cachedRecipes.set(recipeId, manufacturingRecipe);

  }

  const populateLookup = (
    source: Record<string, string[]>,
    target: Map<string, ManufacturingRecipe[]>
  ) => {
    for (const [key, recipeIds] of Object.entries(source)) {
      const recipes = recipeIds
        .map((recipeId) => cachedRecipes?.get(recipeId))
        .filter((recipe): recipe is ManufacturingRecipe => Boolean(recipe));
      if (recipes.length > 0) {
        target.set(key, recipes);
      }
    }
  };

  populateLookup(database.asMaterials, asMaterials);
  populateLookup(database.asProducts, asProducts);
  populateLookup(database.byDevice, byDevice);

  cachedRecipeLookup = { asMaterials, asProducts, byDevice };
  return cachedRecipeLookup;
}

export function getRecipes(): Map<string, ManufacturingRecipe> {
  return cachedRecipes || new Map();
}
