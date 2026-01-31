import type { ManufacturingRecipe, RecipeLookup } from '../types/manufacturing';
import type { SynthesisTable } from '../types/synthesis';
import type { DeviceProductionTable } from '../types/device';
import type { ItemLookup } from '../types/catalog';

let cachedRecipeLookup: RecipeLookup | null = null;

function parseManufacturingTime(timeStr: string | undefined): number {
  if (!timeStr) return 2;
  const match = timeStr.match(/^(\d+(?:\.\d+)?)(s|m)?$/);
  if (!match) return 2;
  const value = parseFloat(match[1]);
  const unit = match[2];
  if (unit === 'm') return value * 60;
  return value;
}

function normalizeDeviceText(text: string): string {
  const normalized = text
    .replace(/[（）()]/g, '_')
    .replace(/\s+/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || 'unknown';
}

export async function loadRecipeLookup(itemLookup?: ItemLookup): Promise<RecipeLookup> {
  if (cachedRecipeLookup) {
    return cachedRecipeLookup;
  }

  const byItem = new Map<string, ManufacturingRecipe[]>();
  const byDevice = new Map<string, ManufacturingRecipe[]>();

  const [synthesisList, deviceProductionList, deviceTextMap] = await Promise.all([
    fetchSynthesisTables(),
    fetchDeviceProductionTables(),
    fetchDeviceTextMap(),
  ]);

  const deviceTimeMap = new Map<string, number>();
  const deviceNameMap = new Map<string, string>();
  for (const deviceTable of deviceProductionList) {
    deviceNameMap.set(deviceTable.deviceId, deviceTable.deviceName);
    for (const recipe of deviceTable.recipes) {
      for (const product of recipe.products) {
        const time = parseManufacturingTime(recipe.manufacturingTime);
        deviceTimeMap.set(`${deviceTable.deviceId}-${product.id}`, time);
      }
    }
  }

  for (const synthesisTable of synthesisList) {
    for (const tableData of synthesisTable.tables) {
      for (const row of tableData.data) {
        if (!row || row.length < 3) continue;
        if (!row[0] || row[0].length === 0) continue;
        
        const deviceCells = row[0] || [];
        const deviceCell = deviceCells.find(
          (cell) => cell.type === 'entry' || (cell.type === 'text' && cell.text.trim() !== '')
        );
        if (!deviceCell) continue;

        const materialCells = row[1] || [];
        const productCells = row[2] || [];

        if (materialCells.length === 0 || productCells.length === 0) continue;

        let deviceId: string;
        let deviceName: string;

        if (deviceCell.type === 'entry') {
          deviceId = deviceCell.id;
          deviceName = deviceNameMap.get(deviceId) || synthesisTable.name;
        } else {
          const deviceText = deviceCell.text.trim();
          const normalizedText = normalizeDeviceText(deviceText);
          deviceId = deviceTextMap[deviceText] || `text_${normalizedText}`;
          deviceName = deviceText || synthesisTable.name;
        }

        const materials = materialCells
          .filter((cell) => cell.type === 'entry' && cell.count !== '0')
          .map((cell) => ({
            id: (cell as any).id,
            name: itemLookup?.[(cell as any).id]?.name || '',
            count: parseInt((cell as any).count),
          }));

        const products = productCells
          .filter((cell) => cell.type === 'entry' && cell.count !== '0')
          .map((cell) => ({
            id: (cell as any).id,
            name: itemLookup?.[(cell as any).id]?.name || '',
            count: parseInt((cell as any).count),
          }));

        for (const product of products) {
          const manufacturingTime = deviceTimeMap.get(`${deviceId}-${product.id}`) || 2;

          const recipe: ManufacturingRecipe = {
            deviceId,
            deviceName,
            materials,
            products: [product],
            manufacturingTime,
          };

          if (!byItem.has(product.id)) {
            byItem.set(product.id, []);
          }
          byItem.get(product.id)!.push(recipe);

          if (!byDevice.has(deviceId)) {
            byDevice.set(deviceId, []);
          }
          byDevice.get(deviceId)!.push(recipe);
        }
      }
    }
  }

  cachedRecipeLookup = { byItem, byDevice };
  return cachedRecipeLookup;
}

async function fetchSynthesisTables(): Promise<SynthesisTable[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/synthesis_tables_list.json`);
  if (!response.ok) return [];

  const fileNames = await response.json();

  const tables = await Promise.all(
    fileNames.map(async (fileName: string) => {
      const itemResponse = await fetch(
        `${import.meta.env.BASE_URL}data/synthesis_tables/${fileName}`
      );
      if (itemResponse.ok) {
        return itemResponse.json();
      }
      return null;
    })
  );

  return tables.filter((t) => t !== null);
}

async function fetchDeviceProductionTables(): Promise<DeviceProductionTable[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/device_production_tables_list.json`);
  if (!response.ok) return [];

  const fileNames = await response.json();

  const tables = await Promise.all(
    fileNames.map(async (fileName: string) => {
      const deviceResponse = await fetch(
        `${import.meta.env.BASE_URL}data/device_production_tables/${fileName}`
      );
      if (deviceResponse.ok) {
        return deviceResponse.json();
      }
      return null;
    })
  );

  return tables.filter((t) => t !== null);
}

async function fetchDeviceTextMap(): Promise<Record<string, string>> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/overrides/device_text_map.json`);
  if (!response.ok) return {};

  return response.json();
}
