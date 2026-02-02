/**
 * Data merge utility for custom data overrides
 * Merges custom data with API data (custom → API → fallback)
 */

import type { ItemLookup } from '../types/catalog';
import type { RecipeDatabase } from '../types/manufacturing';
import type { CustomItem, CustomRecipe } from '../types/custom';

/**
 * Merge items: custom overrides take precedence over API data
 */
export function mergeItems(
  apiItems: ItemLookup,
  customItems: Record<string, CustomItem>
): ItemLookup {
  const merged: ItemLookup = { ...apiItems };

  // Apply custom overrides (partial merge)
  for (const [id, customItem] of Object.entries(customItems)) {
    const apiItem = apiItems[id];
    if (apiItem) {
      // Partial override: merge provided fields
      merged[id] = {
        ...apiItem,
        ...customItem
      };
    }
    // Note: Custom items for non-existent IDs are ignored at merge time
    // (could optionally add new items if needed)
  }

  return merged;
}

/**
 * Merge recipes: custom overrides take precedence
 */
export function mergeRecipes(
  apiRecipes: RecipeDatabase['recipes'],
  customRecipes: Record<string, CustomRecipe>,
  deletedRecipes: string[]
): RecipeDatabase['recipes'] {
  const merged = { ...apiRecipes };

  // Apply custom overrides
  for (const [id, customRecipe] of Object.entries(customRecipes)) {
    merged[id] = {
      ...apiRecipes[id],
      ...customRecipe,
      // Ensure count is number for type safety
      materials: customRecipe.materials.map(m => ({ ...m, count: Number(m.count) })),
      products: customRecipe.products.map(p => ({ ...p, count: Number(p.count) })),
    };
  }

  // Remove deleted custom recipes (revert to API)
  for (const id of deletedRecipes) {
    if (apiRecipes[id]) {
      // Revert to API data
      merged[id] = { ...apiRecipes[id] };
    }
  }

  return merged;
}

/**
 * Rebuild recipe indexes (asMaterials, asProducts, byDevice)
 * Called when custom recipes are added/modified
 */
export function rebuildRecipeIndexes(mergedRecipes: RecipeDatabase['recipes']) {
  const asMaterials: Record<string, string[]> = {};
  const asProducts: Record<string, string[]> = {};
  const byDevice: Record<string, string[]> = {};

  for (const [recipeId, recipe] of Object.entries(mergedRecipes)) {
    // Index by materials
    for (const material of recipe.materials) {
      if (!asMaterials[material.id]) {
        asMaterials[material.id] = [];
      }
      asMaterials[material.id].push(recipeId);
    }

    // Index by products
    for (const product of recipe.products) {
      if (!asProducts[product.id]) {
        asProducts[product.id] = [];
      }
      asProducts[product.id].push(recipeId);
    }

    // Index by device
    const deviceId = recipe.deviceId;
    if (!byDevice[deviceId]) {
      byDevice[deviceId] = [];
    }
    byDevice[deviceId].push(recipeId);
  }

  return { asMaterials, asProducts, byDevice };
}
