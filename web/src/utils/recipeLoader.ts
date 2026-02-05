import type { ManufacturingRecipe, RecipeLookup } from '../types/manufacturing';
import type { ItemLookup } from '../types/catalog';

function tarjanSCC(adj: Map<string, Set<string>>): string[][] {
  let index = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const idx = new Map<string, number>();
  const low = new Map<string, number>();
  const sccs: string[][] = [];

  function strongConnect(v: string) {
    idx.set(v, index);
    low.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    for (const w of (adj.get(v) ?? [])) {
      if (!idx.has(w)) {
        strongConnect(w);
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v)!, idx.get(w)!));
      }
    }

    if (low.get(v) === idx.get(v)) {
      const component: string[] = [];
      while (true) {
        const x = stack.pop()!;
        onStack.delete(x);
        component.push(x);
        if (x === v) break;
      }
      sccs.push(component);
    }
  }

  for (const v of adj.keys()) {
    if (!idx.has(v)) strongConnect(v);
  }

  return sccs;
}

function buildItemAdjacency(recipes: ManufacturingRecipe[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();

  const ensure = (id: string) => {
    if (!adj.has(id)) adj.set(id, new Set());
  };

  for (const r of recipes) {
    for (const p of r.products) {
      ensure(p.id);
      for (const m of r.materials) {
        ensure(m.id);
        adj.get(p.id)!.add(m.id);
      }
    }
  }

  return adj;
}

function buildCycleGroups(
  adj: Map<string, Set<string>>,
  asProducts: Map<string, ManufacturingRecipe[]>
): Map<string, Set<string>> {
  const sccs = tarjanSCC(adj);
  const cycleGroupByItem = new Map<string, Set<string>>();

  const hasSelfLoop = (v: string) => (adj.get(v)?.has(v) ?? false);

  for (const comp of sccs) {
    const cyclic = comp.length > 1 || (comp.length === 1 && hasSelfLoop(comp[0]));
    if (!cyclic) continue;

    // Check if this SCC is a real deadlock (no base items)
    // An SCC is safe if any item has a recipe with all materials outside the SCC
    const sccSet = new Set(comp);
    let isSafe = false;

    for (const itemId of comp) {
      const recipes = asProducts.get(itemId) ?? [];
      for (const recipe of recipes) {
        // Check if all materials are outside the SCC (or no materials)
        const allMaterialsOutside = recipe.materials.every(m => !sccSet.has(m.id));
        if (allMaterialsOutside) {
          // This item can be produced from outside the SCC, so SCC is safe
          isSafe = true;
          break;
        }
      }
      if (isSafe) break;
    }

    if (isSafe) {
      // SCC has at least one base item, ignore it
      console.log(`[Cycle Detection] SCC ignored (has base items): [${comp.join(', ')}]`);
      continue;
    }

    // SCC is a real deadlock, add to cycle groups
    console.log(`[Cycle Detection] SCC detected as deadlock: [${comp.join(', ')}]`);
    const set = new Set(comp);
    for (const v of comp) {
      cycleGroupByItem.set(v, set);
    }
  }

  return cycleGroupByItem;
}

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

const STORAGE_KEY = 'ignored_devices';

const cacheUpdateListeners = new Set<() => void>();

export function onCacheUpdate(listener: () => void): () => void {
  cacheUpdateListeners.add(listener);
  return () => {
    cacheUpdateListeners.delete(listener);
  };
}

export function notifyCacheUpdate(): void {
  cacheUpdateListeners.forEach((listener) => {
    listener();
  });
}

let defaultIgnoredDevicesCache: Set<string> | null = null;

async function loadDefaultIgnoredDevices(): Promise<Set<string>> {
  if (defaultIgnoredDevicesCache) {
    return defaultIgnoredDevicesCache;
  }
  
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/overrides/ignored_devices.json`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.ignoredDevices)) {
        defaultIgnoredDevicesCache = new Set(data.ignoredDevices);
        return defaultIgnoredDevicesCache;
      }
    }
  } catch (error) {
    console.warn('Failed to load default ignored devices:', error);
  }
  
  defaultIgnoredDevicesCache = new Set();
  return defaultIgnoredDevicesCache;
}

async function getIgnoredDevices(): Promise<Set<string>> {
  // Load defaults from config file first
  const defaults = await loadDefaultIgnoredDevices();
  
  // Then check localStorage for user overrides
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      // User has explicitly set their preferences (even if empty)
      const deviceIds = JSON.parse(stored) as string[];
      return new Set(deviceIds);
    }
  } catch (error) {
    console.warn('Failed to load ignored devices from localStorage:', error);
  }
  
  // No user preferences, use defaults
  return defaults;
}

let cachedRecipeLookup: RecipeLookup | null = null;
let cachedRecipes: Map<string, ManufacturingRecipe> | null = null;

function hasNetOutput(recipe: ManufacturingRecipe): boolean {
  for (const product of recipe.products) {
    const matchingMaterial = recipe.materials.find(m => m.id === product.id);
    const netOutput = product.count - (matchingMaterial?.count || 0);
    if (netOutput > 0) {
      return true;
    }
  }
  return false;
}

export async function loadRecipeLookup(_itemLookup?: ItemLookup): Promise<RecipeLookup> {
  if (cachedRecipeLookup) {
    return cachedRecipeLookup;
  }

  const ignoredDevices = await getIgnoredDevices();

  const asMaterials = new Map<string, ManufacturingRecipe[]>();
  const asProducts = new Map<string, ManufacturingRecipe[]>();
  const byDevice = new Map<string, ManufacturingRecipe[]>();
  cachedRecipes = new Map<string, ManufacturingRecipe>();

  const response = await fetch(`${import.meta.env.BASE_URL}data/recipe_database.json`);
  if (!response.ok) {
    console.error('Failed to load recipe_database.json');
    return { asMaterials, asProducts, byDevice, cycleGroups: new Map() };
  }

  const database: RecipeDatabase = await response.json();

  for (const [recipeId, recipe] of Object.entries(database.recipes)) {
    if (ignoredDevices.has(recipe.deviceId)) {
      continue;
    }
    const manufacturingRecipe: ManufacturingRecipe = {
      deviceId: recipe.deviceId,
      deviceName: recipe.deviceName,
      materials: recipe.materials.map(m => ({
        ...m,
        count: typeof m.count === 'string' ? parseFloat(m.count) : m.count
      })),
      products: recipe.products.map(p => ({
        ...p,
        count: typeof p.count === 'string' ? parseFloat(p.count) : p.count
      })),
      manufacturingTime: recipe.manufacturingTime || 2,
    };

    cachedRecipes.set(recipeId, manufacturingRecipe);

  }

  const recipesArray = Array.from(cachedRecipes?.values() ?? []);
  const adj = buildItemAdjacency(recipesArray);

  const populateLookup = (
    source: Record<string, string[]>,
    target: Map<string, ManufacturingRecipe[]>
  ) => {
    for (const [key, recipeIds] of Object.entries(source)) {
      const recipes = recipeIds
        .map((recipeId) => cachedRecipes?.get(recipeId))
        .filter((recipe): recipe is ManufacturingRecipe => Boolean(recipe))
        .filter((recipe) => hasNetOutput(recipe));
      if (recipes.length > 0) {
        target.set(key, recipes);
      }
    }
  };

  populateLookup(database.asMaterials, asMaterials);
  populateLookup(database.asProducts, asProducts);
  populateLookup(database.byDevice, byDevice);

  const cycleGroups = buildCycleGroups(adj, asProducts);

  cachedRecipeLookup = { asMaterials, asProducts, byDevice, cycleGroups };
  return cachedRecipeLookup;
}

export function getRecipes(): Map<string, ManufacturingRecipe> {
  return cachedRecipes || new Map();
}

export function clearRecipeCache(): void {
  cachedRecipeLookup = null;
  cachedRecipes = null;
  notifyCacheUpdate();
  console.log('[RecipeLoader] Cache cleared, will reload on next use');
}
