/**
 * Express admin server for custom data management
 * Provides CRUD API for items and recipes
 * Runs on port 3001 with CORS for Vite dev server
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

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));
app.use(express.json());

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Load custom data
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
    return { recipes: {}, deletedRecipes: [] };
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
    return JSON.parse(data);
  } catch (error) {
    return null;
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

// Merge items with API data
function mergeItemData(apiItems: any, customItems: any) {
  const merged: any = {};
  
  for (const [id, apiItem] of Object.entries(apiItems || {})) {
    merged[id] = {
      api: apiItem,
      custom: customItems[id] || null,
      isCustom: Boolean(customItems[id])
    };
  }
  
  // Add items that only exist in custom data
  for (const [id, customItem] of Object.entries(customItems || {})) {
    if (!apiItems[id]) {
      merged[id] = {
        api: null,
        custom: customItem,
        isCustom: true
      };
    }
  }
  
  return merged;
}

// Routes - Get items with comparison
app.get('/api/custom/items', async (req, res) => {
  const [customItems, apiItems] = await Promise.all([
    loadCustomItems(),
    loadApiItems()
  ]);
  const merged = mergeItemData(apiItems, customItems);
  res.json({
    items: merged,
    apiData: apiItems,
    customData: customItems
  });
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

// Routes - Custom Recipes
app.get('/api/custom/recipes', async (req, res) => {
  const data = await loadCustomRecipes();
  res.json(data);
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

// Start server
app.listen(PORT, () => {
  console.log(`Admin server running on port ${PORT}`);
  console.log(`CORS enabled for Vite dev server`);
});
