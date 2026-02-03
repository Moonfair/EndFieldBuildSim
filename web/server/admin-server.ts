/**
 * Express admin server for custom data management
 * Provides CRUD API for items, recipes, and base materials
 */

import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const CUSTOM_DATA_DIR = path.join(__dirname, '../public/data/custom');
const API_DATA_DIR = path.join(__dirname, '../public/data');

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'] }));
app.use(express.json());

app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function loadCustomItems() {
  try {
    const file = path.join(CUSTOM_DATA_DIR, 'items.json');
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function loadCustomRecipes() {
  try {
    const file = path.join(CUSTOM_DATA_DIR, 'recipes.json');
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { recipes: {}, deletedRecipes: [], fixedBaseMaterials: [] };
  }
}

async function loadApiItems() {
  try {
    const file = path.join(API_DATA_DIR, 'item_lookup.json');
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function loadApiRecipes() {
  try {
    const file = path.join(API_DATA_DIR, 'recipe_database.json');
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data).recipes || {};
  } catch (error) {
    return {};
  }
}

async function saveCustomItems(items: any) {
  const file = path.join(CUSTOM_DATA_DIR, 'items.json');
  await fs.writeFile(file, JSON.stringify(items, null, 2), 'utf-8');
}

async function saveCustomRecipes(data: any) {
  const file = path.join(CUSTOM_DATA_DIR, 'recipes.json');
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
}

// Base Materials Settings API
app.get('/api/custom/base-materials', async (req, res) => {
  try {
    const data = await loadCustomRecipes();
    const fixedBaseMaterials: string[] = data.fixedBaseMaterials || [];
    res.json({ fixedBaseMaterials });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/custom/base-materials', async (req, res) => {
  try {
    const { itemId, isFixed } = req.body;
    const data = await loadCustomRecipes();
    
    if (!data.fixedBaseMaterials) {
      data.fixedBaseMaterials = [];
    }
    
    if (isFixed) {
      if (!data.fixedBaseMaterials.includes(itemId)) {
        data.fixedBaseMaterials.push(itemId);
      }
    } else {
      data.fixedBaseMaterials = data.fixedBaseMaterials.filter((id: string) => id !== itemId);
    }
    
    await saveCustomRecipes(data);
    res.json({ success: true, fixedBaseMaterials: data.fixedBaseMaterials });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Recipes with comparison
app.get('/api/custom/recipes', async (req, res) => {
  const [customRecipes, apiRecipes] = await Promise.all([
    loadCustomRecipes(),
    loadApiRecipes()
  ]);
  const merged = {};
  for (const [id, apiRecipe] of Object.entries(apiRecipes || {})) {
    const customRecipe = customRecipes.recipes[id] || null;
    merged[id] = {
      api: apiRecipe,
      custom: customRecipe || null,
      isCustom: Boolean(customRecipe)
    };
  }
  for (const [id, customRecipe] of Object.entries(customRecipes.recipes || {})) {
    if (!apiRecipes[id]) {
      merged[id] = {
        api: null,
        custom: customRecipe,
        isCustom: true
      };
    }
  }
  res.json({
    recipes: merged,
    fixedBaseMaterials: customRecipes.fixedBaseMaterials || []
  });
});

app.get('/api/custom/recipes/:id', async (req, res) => {
  const [customRecipes, apiRecipes] = await Promise.all([
    loadCustomRecipes(),
    loadApiRecipes()
  ]);
  const { id } = req.params;
  const customRecipe = customRecipes.recipes[id] || null;
  const apiRecipe = apiRecipes[id] || null;
  res.json({
    custom: customRecipe,
    api: apiRecipe,
    isCustom: Boolean(customRecipe)
  });
});

app.post('/api/custom/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await loadCustomRecipes();
    data.recipes[id] = req.body;
    await saveCustomRecipes(data);
    res.json({ success: true, data: data.recipes[id] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/custom/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await loadCustomRecipes();
    if (data.recipes[id]) {
      delete data.recipes[id];
      data.deletedRecipes.push(id);
      await saveCustomRecipes(data);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Items routes
app.get('/api/custom/items', async (req, res) => {
  const [customItems, apiItems] = await Promise.all([
    loadCustomItems(),
    loadApiItems()
  ]);
  const merged = {};
  for (const [id, apiItem] of Object.entries(apiItems || {})) {
    merged[id] = {
      api: apiItem,
      custom: customItems[id] || null,
      isCustom: Boolean(customItems[id])
    };
  }
  for (const [id, customItem] of Object.entries(customItems || {})) {
    if (!apiItems[id]) {
      merged[id] = {
        api: null,
        custom: customItem,
        isCustom: true
      };
    }
  }
  res.json({ items: merged });
});

app.get('/api/custom/items/:id', async (req, res) => {
  const { id } = req.params;
  const [customItems, apiItems] = await Promise.all([
    loadCustomItems(),
    loadApiItems()
  ]);
  const customItem = customItems[id] || null;
  const apiItem = apiItems[id] || null;
  res.json({
    custom: customItem,
    api: apiItem,
    isCustom: Boolean(customItem)
  });
});

app.post('/api/custom/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const items = await loadCustomItems();
    items[id] = req.body;
    await saveCustomItems(items);
    res.json({ success: true, data: items[id] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/custom/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const items = await loadCustomItems();
    if (items[id]) {
      delete items[id];
      await saveCustomItems(items);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Admin server running on port ${PORT}`);
  console.log(`CORS enabled for Vite dev server`);
});