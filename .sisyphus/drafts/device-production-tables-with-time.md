# Draft: Device Production Tables with Manufacturing Time

## Requirements (confirmed)

- **Add device detail pages**: Create new route `/device/:id` for device pages
- **Display production tables**: Show what items each device can produce
- **Include manufacturing time column**: Tables MUST have "制造需要时间" (manufacturing time) column
- **Conditional rendering**: Don't show table if device has no production data

## CRITICAL DISCOVERY: Two Separate Table Types

The source data has **TWO different table structures** that are NOT the same:

| Type | Keyword | Columns | Items | Status |
|------|---------|---------|-------|--------|
| **Synthesis Device Table** | 合成设备 | [Device][Materials][Products] | 79 items | ✅ Extracted |
| **Manufacturing Time Table** | 消耗时长 | [Materials][Products][Time] | 18 items | ❌ NOT Extracted |

**ZERO items have BOTH types** - they're in SEPARATE documents within device item_details files.

### Current Data Loss Mechanism
```
item_details/752.json
  → extract_synthesis_tables.py
  → [Search for "合成设备"]
  → NOT FOUND (has "消耗时长" instead)
  → [Skip entire document]
  → Manufacturing time data LOST ❌
```

## Technical Discoveries

### Data Sources

1. **Device Production Tables Location**: `data/device_production_tables/*.json` (14 devices)
2. **Source Data with Time**: `data/item_details/{deviceId}.json` - DEVICE files (not item files) contain time data
3. **Web Public Data Location**: `web/public/data/` (no device_production_tables yet)

### Where Time Data Exists

**CRITICAL FINDING**: Time data ("消耗时长") exists in DEVICE detail pages, NOT in item synthesis tables:

- Device 53 (精炼炉) has tables with time values like "2s"
- Location: `item_details/{deviceId}.json → data.item.document.documentMap[{docId}].blockMap[{blockId}]`
- Time appears as text cells: `{"kind": "text", "text": {"text": "2s"}}`

**Device Table Structure** (53.json has 2 tables):
1. First table at blockIds[2]: GJmaYW (columnIds: UAHBQV, m3Onvo, MwWWgq)
2. Second table at blockIds[5]: hXWen4 (columnIds: HL3ugH, zCVF7g, Jr0K4V)

### Current Data Structure Issues

**synthesis_tables.json** - 3 columns only:
- Column 0: 合成设备 (Device)
- Column 1: 原料需求 (Materials)
- Column 2: 合成产物 (Products)
- **NO TIME COLUMN** - lost during extraction

**device_production_tables.json** - No time field:
```json
{
  "deviceId": "53",
  "deviceName": "精炼炉",
  "recipeCount": 36,
  "recipes": [
    {
      "materials": [{"id": "379", "name": "荞花粉末", "count": "1"}],
      "products": [{"id": "195", "name": "碳粉末", "count": "1"}]
    }
  ]
}
```

### Proposed Solution

**Approach A**: Extract time from DEVICE item_details (where it actually exists)
- Device files have production tables with time
- Parse the device's document tables to get time values
- Match recipes to their time values

**Approach B**: Modify synthesis_tables extraction to include 4th column
- This won't work because synthesis tables don't have time column
- Time only exists in device document tables

### React App Patterns

**Existing Patterns**:
- HashRouter for GitHub Pages
- Parallel Promise.all() data loading
- Conditional rendering for optional data
- TypeScript discriminated unions

**New Files Needed**:
- `web/src/pages/DeviceDetailPage.tsx` - Device detail page
- `web/src/components/DeviceProductionTable.tsx` - Production table component
- `web/src/types/device.ts` - TypeScript types

**Data Loading Pattern** (from DetailPage.tsx):
```typescript
Promise.all([
  fetch(`/data/device_production_tables/${id}.json`)
    .then(res => (res.ok ? res.json() : null))
    .catch(() => null),
  fetch(`/data/item_details/${id}.json`).then(res => res.json()),
  fetch('/data/item_lookup.json').then(res => res.json()),
])
```

## KEY FINDING (Critical)

**Manufacturing time is in DEVICE item_details, NOT in item synthesis tables!**

- 18 device files contain "消耗时长" column (column ID: MwWWgq)
- These are the same 14 devices that have production tables + some extras
- Time format: `"2s"`, `"3s"`, `"10s"`, `"40s"` (always `{number}s`)

**JSON Path to Time Value:**
```
data['data']['item']['document']['documentMap'][DOC_ID]
  ['blockMap'][TABLE_BLOCK_ID]['table']['cellMap'][CELL_ID]['childIds'][0]
  → CHILD_BLOCK_ID
  
data['data']['item']['document']['documentMap'][DOC_ID]
  ['blockMap'][CHILD_BLOCK_ID]['text']['inlineElements'][0]['text']['text']
  = TIME_VALUE (e.g., "3s")
```

**Device Table Structure (from DEVICE files):**
| Column ID | Header | Purpose |
|-----------|--------|---------|
| UAHBQV | 原料需求 | Required materials |
| m3Onvo | 制作产物 | Products created |
| MwWWgq | 消耗时长 | Manufacturing time |

**Implication**: Need a NEW extraction script that:
1. Reads DEVICE item_details files (not items)
2. Parses device production tables with time column
3. Outputs device_production_tables with manufacturingTime field

## Open Questions

1. **Where to get time for items?** - Items like 193 (紫晶纤维) have synthesis tables but NO time column
   - Time for each recipe exists in the DEVICE that produces it
   - Must cross-reference device tables to get time

2. **Data flow options:**
   - **Option A**: Extract time from device files → add to device_production_tables
   - **Option B**: Also add time to synthesis_tables (requires joining with device data)

## Scope Boundaries

### INCLUDE
- Extract manufacturing time and add to device_production_tables
- Create DeviceDetailPage with production table
- Create DeviceProductionTable component
- Add route `/device/:id`
- Copy device tables to web/public/data/

### EXCLUDE
- Device search page (nice to have, not required)
- Device links in synthesis tables (nice to have)
- Statistics display

## Test Strategy Decision

- **Infrastructure exists**: Need to check
- **User wants tests**: TBD - ask user
- **QA approach**: TBD
