# EndFieldBuildSim - Data Collection Summary

**Collection Date**: 2026-01-30  
**Status**: Complete ✅

## Related Documentation

- **[README.md](../README.md)** - Main project guide and data collection workflow
- **[AGENTS.md](../AGENTS.md)** - Developer guide and code style
- **[WEB_APP_COMPLETION.md](../WEB_APP_COMPLETION.md)** - Web app completion status
- **[data/DEVICE_PRODUCTION_REPORT.md](DEVICE_PRODUCTION_REPORT.md)** - Device production statistics (Chinese)

---

## Data Collection Results

### Step 1: Item Catalog ✅
**Source**: https://zonai.skland.com/web/v1/wiki/item/catalog  
**Method**: Playwright API interception (`fetch.py`)

| File | Count | Description |
|------|-------|-------------|
| `type5_devices.json` | 65 | Devices (设备) - itemId, name, image |
| `type6_items.json` | 189 | Items (物品) - itemId, name, image |
| **Total** | **254** | All game items/devices |

### Step 2: Item Details ✅
**Source**: https://zonai.skland.com/web/v1/wiki/item/info  
**Method**: Playwright browser automation (`fetch_details_browser.py`)  
**Success Rate**: 100% (254/254)

| Directory | Files | Avg Size | Description |
|-----------|-------|----------|-------------|
| `item_details/` | 254 | 38.5 KB | Complete item info with descriptions, attributes, crafting data |

**Note**: Uses automated browser authentication - no manual token extraction required.

### Step 3: Synthesis Tables ✅
**Source**: Extracted from item_details  
**Method**: JSON parsing (`extract_synthesis_tables.py`)

| Directory | Files | Total Items | Description |
|-----------|-------|-------------|-------------|
| `synthesis_tables/` | 79 | 254 | Items with "合成设备" (synthesis device) tables |

**Distribution**:
- Items with synthesis tables: 79 (31.1%)
- Items without synthesis tables: 175 (68.9%)

---

## Data Structure

### Catalog Files (type5/type6)
```json
[
  {
    "itemId": "752",
    "name": "高级电路",
    "image": "https://..."
  }
]
```

### Item Details (item_details/*.json)
```json
{
  "code": 0,
  "message": "OK",
  "timestamp": "...",
  "data": {
    "itemId": "752",
    "name": "高级电路",
    "document": [...],  // Rich text blocks
    "attributes": [...],
    "tags": [...]
  }
}
```

### Synthesis Tables (synthesis_tables/*.json)
```json
{
  "itemId": "193",
  "name": "紫晶纤维",
  "tables": [
    {
      "rows": 7,
      "columns": 3,
      "headers": [["合成设备"], ["原料需求"], ["合成产物"]],
      "data": [
        [
          [{"type": "entry", "id": "53", "count": "0"}],
          [{"type": "entry", "id": "49", "count": "1"}],
          []
        ]
      ]
    }
  ]
}
```

**Simplified Structure**:
- `text` blocks → `{"type": "text", "text": "..."}`
- `entry` blocks → `{"type": "entry", "id": "...", "count": "..."}`
- Empty cells → `[]`

---

## File Inventory

```
data/
├── DATA_SUMMARY.md              # This file
├── README.md                    # User guide
├── fetch.py                     # Step 1 script (catalog)
├── fetch_details_browser.py     # Step 2 script (details) ✅ PRIMARY
├── fetch_all_details.sh         # Step 2 backup (manual auth)
├── extract_synthesis_tables.py  # Step 3 script (tables)
├── type5_devices.json           # 65 devices
├── type6_items.json             # 189 items
├── item_details/                # 254 item detail JSONs
│   ├── 379.json
│   ├── 380.json
│   └── ... (252 more)
└── synthesis_tables/            # 79 synthesis table JSONs
    ├── 193.json
    ├── 194.json
    └── ... (77 more)
```

---

## Collection Workflow

```bash
# Step 1: Get catalog (automated)
python data/fetch.py

# Step 2: Get details (automated, 100% success)
python3 data/fetch_details_browser.py

# Step 3: Extract tables (automated)
python3 data/extract_synthesis_tables.py
```

**No manual intervention required** - all scripts handle authentication automatically.

---

## Data Quality

### Validation Checks ✅

- [x] All 254 items have detail files
- [x] All detail JSONs have `code: 0` (success)
- [x] All detail files contain complete data structure
- [x] Synthesis tables correctly extracted from 79 items
- [x] No parsing errors during extraction
- [x] File sizes within expected range (38.5 KB avg)

### Known Characteristics

- **Authentication**: Browser auto-handles token refresh (first 401 → auto-retry → 200)
- **Response time**: ~2-3s per item (includes page load + API call)
- **Stability**: 100% success rate over 254 items
- **Data format**: Consistent JSON structure across all items

---

## Next Steps (Optional)

### Data Processing Ideas

1. **Build Database Schema**:
   - Parse all attributes into structured format
   - Create relationships between items
   - Index by tags and categories

2. **Analyze Synthesis Chains**:
   - Map ingredient dependencies
   - Calculate resource costs
   - Generate crafting trees

3. **Extract Additional Tables**:
   - Modify `extract_synthesis_tables.py` to capture other table types
   - Parse attribute tables, effect tables, etc.

4. **Create Search Index**:
   - Full-text search on item names/descriptions
   - Filter by tags and categories
   - Query synthesis relationships

5. **Generate Wiki Pages**:
   - Convert JSON to markdown
   - Create HTML templates
   - Build static site

### Maintenance

- **Re-fetch data**: Run all 3 scripts sequentially when game updates
- **Incremental updates**: Check timestamps, only fetch changed items
- **Validation**: Add automated tests for data structure consistency

---

## Technical Notes

### Why Playwright Works (fetch_details_browser.py)

**Problem**: API requires per-request cryptographic signatures  
**Solution**: Use browser page that triggers API automatically

```
URL: https://wiki.skland.com/endfield/detail?mainTypeId=1&subTypeId=6&gameEntryId={itemId}
     ↓
Browser visits page
     ↓
Page calls: /wiki/item/info?id={itemId}
     ↓
First attempt: 401 (token expired)
     ↓
Browser auto-refreshes token
     ↓
Second attempt: 200 (success) ← WE INTERCEPT THIS
```

**Key Discovery**: User found the URL pattern that triggers automatic auth.

### Why Bash Script is Backup Only

- Requires manual token extraction from browser DevTools
- Tokens expire in 30-60 seconds
- Must re-extract headers for each run
- Playwright method is fully automated and more reliable

---

## Credits

**Data Source**: Zonai API (https://zonai.skland.com)  
**Game**: Endfield (明日方舟：终末地)  
**Project**: EndFieldBuildSim  
**Last Updated**: 2026-01-30

---

**Collection Status**: ALL STEPS COMPLETE ✅
