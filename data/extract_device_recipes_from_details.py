#!/usr/bin/env python3
"""
Extract device production recipes directly from item_details files.

Handles transposed table structures where headers are rows, not columns.
"""
import json
import os
from typing import List, Dict, Any


def load_item_lookup() -> Dict[str, str]:
    lookup = {}
    with open('type5_devices.json', 'r', encoding='utf-8') as f:
        devices = json.load(f)
        for device in devices:
            lookup[device['itemId']] = device['name']
    
    with open('type6_items.json', 'r', encoding='utf-8') as f:
        items = json.load(f)
        for item in items:
            lookup[item['itemId']] = item['name']
    
    return lookup


def find_production_table(document) -> List[Dict[str, Any]]:
    """Find production tables with either row-header or column-header format."""
    document_map = document.get('documentMap', {})
    tables = []
    
    for doc_id, doc in document_map.items():
        if 'blockMap' not in doc:
            continue
        
        block_map = doc['blockMap']
        
        for block_id, block in block_map.items():
            if block.get('kind') != 'table' or 'table' not in block:
                continue
            
            table = block['table']
            row_ids = table.get('rowIds', [])
            column_ids = table.get('columnIds', [])
            cell_map = table.get('cellMap', {})
            
            if len(row_ids) < 2 or len(column_ids) < 2:
                continue
            
            # Detect table format
            first_row_header = get_cell_text(cell_map, block_map, row_ids[0], column_ids[0])
            table_format = detect_format(row_ids, column_ids, cell_map, block_map)
            
            if table_format == 'row_header':
                # Row-header format (种植机): Row 0=section, Row 1=headers, Rows 2+=data
                if not first_row_header or '模式' not in first_row_header:
                    continue
                
                headers = {}
                for col_idx, col_id in enumerate(column_ids):
                    header_text = get_cell_text(cell_map, block_map, row_ids[1], col_id)
                    headers[col_id] = header_text
                
                if not headers:
                    continue
                
                recipes = []
                for row_id in row_ids[2:]:
                    recipe = extract_recipe_row(row_id, column_ids, headers, cell_map, block_map)
                    if recipe and recipe['materials'] and recipe['products']:
                        recipes.append(recipe)
                
                if recipes:
                    tables.append({
                        'tableId': block_id,
                        'mode': first_row_header,
                        'headers': headers,
                        'recipes': recipes,
                        'format': 'row_header'
                    })
            
            elif table_format == 'column_header':
                # Column-header format (精炼炉): Row 0=headers, Rows 1+=data
                headers = {}
                for col_idx, col_id in enumerate(column_ids):
                    header_text = get_cell_text(cell_map, block_map, row_ids[0], col_id)
                    headers[col_id] = header_text
                
                if not headers or not any(h for h in headers.values() if h and '产物' in h):
                    continue
                
                recipes = []
                for row_id in row_ids[1:]:
                    recipe = extract_recipe_row(row_id, column_ids, {i: h for i, h in headers.items() if h}, cell_map, block_map)
                    if recipe and recipe['materials'] and recipe['products']:
                        recipes.append(recipe)
                
                if recipes:
                    tables.append({
                        'tableId': block_id,
                        'mode': None,
                        'headers': headers,
                        'recipes': recipes,
                        'format': 'column_header'
                    })
    
    return tables


def detect_format(row_ids: List[str], column_ids: List[str], cell_map, block_map) -> str:
    """Detect if table uses row-header or column-header format."""
    first_row_first_cell = get_cell_text(cell_map, block_map, row_ids[0], column_ids[0])
    
    if first_row_first_cell and '模式' in first_row_first_cell:
        return 'row_header'
    
    # Check if first row has any column-like header (原料, 产物, 时间)
    has_column_headers = False
    for col_id in column_ids:
        text = get_cell_text(cell_map, block_map, row_ids[0], col_id)
        if text and any(h in text for h in ['原料', '产物', '产物', '产品', '时间']):
            has_column_headers = True
            break
    
    if has_column_headers:
        return 'column_header'
    
    return 'unknown'


def get_cell_text(cell_map, block_map, row_id, col_id):
    """Get text content from a cell."""
    cell_id = f'{row_id}_{col_id}'
    if cell_id not in cell_map:
        return None
    
    child_ids = cell_map[cell_id].get('childIds', [])
    if not child_ids:
        return None
    
    for child_id in child_ids:
        if child_id in block_map:
            child = block_map[child_id]
            if child.get('kind') == 'text' and 'text' in child:
                for elem in child['text']['inlineElements']:
                    if elem.get('kind') == 'text' and 'text' in elem['text']:
                        return elem['text']['text']
    
    return None


def extract_recipe_row(row_id, column_ids, headers, cell_map, block_map) -> Dict[str, Any]:
    """Extract recipe data from a row."""
    materials = []
    products = []
    manufacturing_time = None

    # Map column IDs to header types
    col_to_type = {}
    for col_id, header in headers.items():
        if '原料' in header or '需求' in header:
            col_to_type[col_id] = 'material'
        elif '产物' in header or '产品' in header:
            col_to_type[col_id] = 'product'
        elif '时间' in header or '时长' in header:
            col_to_type[col_id] = 'time'

    # Extract data from each column
    for col_idx, col_id in enumerate(column_ids):
        cell_type = col_to_type.get(col_id)
        if not cell_type:
            continue

        cell_id = f'{row_id}_{col_id}'
        if cell_id not in cell_map:
            continue

        child_ids = cell_map[cell_id].get('childIds', [])
        for child_id in child_ids:
            if child_id not in block_map:
                continue

            child = block_map[child_id]
            if child.get('kind') == 'text' and 'text' in child:
                for elem in child['text']['inlineElements']:
                    elem_kind = elem.get('kind')
                    if elem_kind == 'entry':
                        entry = elem['entry']
                        item_id = entry.get('id', '')
                        count = entry.get('count', '1')

                        if cell_type == 'material':
                            materials.append({'id': item_id, 'count': count})
                        elif cell_type == 'product':
                            products.append({'id': item_id, 'count': count})
                    elif elem_kind == 'text' and cell_type == 'time':
                        # Extract manufacturing time (e.g., "2s" -> 2)
                        time_str = elem['text']['text'].strip()
                        if time_str.endswith('s'):
                            try:
                                manufacturing_time = int(time_str[:-1])
                            except ValueError:
                                pass

    return {
        'materials': materials,
        'products': products,
        'manufacturingTime': manufacturing_time
    }


if __name__ == '__main__':
    print("Extracting device recipes from item_details...")
    print("="*60)
    
    item_lookup = load_item_lookup()
    details_dir = 'item_details'
    
    all_recipes = {}
    
    for filename in sorted(os.listdir(details_dir)):
        if not filename.endswith('.json'):
            continue
        
        item_id = filename.replace('.json', '')
        filepath = os.path.join(details_dir, filename)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            document = data['data']['item']['document']
            tables = find_production_table(document)
            
            if tables:
                device_name = item_lookup.get(item_id, f"Unknown ({item_id})")
                print(f"\n{device_name} ({item_id}):")
                
                device_recipes = []
                for table in tables:
                    for recipe in table['recipes']:
                        materials_text = ', '.join([
                            f"{item_lookup.get(m['id'], m['id'])}×{m['count']}"
                            for m in recipe['materials']
                        ])
                        products_text = ', '.join([
                            f"{item_lookup.get(p['id'], p['id'])}×{p['count']}"
                            for p in recipe['products']
                        ])
                        print(f"  {materials_text} → {products_text}")
                        device_recipes.append(recipe)
                
                if device_recipes:
                    all_recipes[item_id] = device_recipes
        
        except Exception as e:
            print(f"  Error processing {filename}: {e}")

    # Save recipes to device_production_tables
    output_dir = 'device_production_tables'
    os.makedirs(output_dir, exist_ok=True)

    for device_id, recipes in all_recipes.items():
        device_name = item_lookup.get(device_id, f"Unknown ({device_id})")
        output_path = os.path.join(output_dir, f'{device_id}.json')

        output = {
            'deviceId': device_id,
            'deviceName': device_name,
            'recipeCount': len(recipes),
            'recipes': recipes
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)

        print(f"  Saved {len(recipes)} recipes")

    print(f"\n{'='*60}")
    print(f"✅ Saved recipes for {len(all_recipes)} devices")
    print("="*60)
