#!/usr/bin/env python3
"""
Extract manufacturing time from device item_details and add to device_production_tables.

Devices have manufacturing time tables with structure:
- Column 0: 原料需求 (Materials Required)
- Column 1: 制作产物 (Products Created)
- Column 2: 消耗时长 (Manufacturing Time)
"""

import json
import os
from typing import Dict, List, Any, Optional


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


def extract_cell_content(block_map: Dict, cell_data: Dict, item_lookup: Dict) -> List[Dict]:
    child_ids = cell_data.get('childIds', [])
    contents = []
    
    for child_id in child_ids:
        child_block = block_map.get(child_id, {})
        
        if 'text' in child_block:
            text_data = child_block['text']
            inline_elems = text_data.get('inlineElements', [])
            for elem in inline_elems:
                if elem.get('kind') == 'text':
                    text = elem.get('text', {}).get('text', '').strip()
                    if text:
                        contents.append({'type': 'text', 'text': text})
                elif elem.get('kind') == 'entry':
                    entry = elem.get('entry', {})
                    item_id = entry.get('id', '')
                    count = entry.get('count', '0')
                    if item_id:
                        item_name = item_lookup.get(item_id, f'Unknown({item_id})')
                        contents.append({
                            'type': 'entry',
                            'id': item_id,
                            'name': item_name,
                            'count': count
                        })
    
    return contents


def extract_manufacturing_time_from_device(device_id: str, item_lookup: Dict) -> Optional[Dict[str, str]]:
    """
    Extract manufacturing time table from device item_details file.
    
    Returns:
        Dict mapping recipe_key -> manufacturing_time, or None if no time data
        recipe_key format: "materials_ids|products_ids" (sorted, joined by comma)
    """
    detail_path = f'item_details/{device_id}.json'
    if not os.path.exists(detail_path):
        return None
    
    with open(detail_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    doc_map = data.get('data', {}).get('item', {}).get('document', {}).get('documentMap', {})
    
    time_mapping = {}
    
    for doc_id, doc in doc_map.items():
        block_map = doc.get('blockMap', {})
        
        for block_id, block in block_map.items():
            if block.get('kind') != 'table':
                continue
            
            table_data = block.get('table', {})
            column_ids = table_data.get('columnIds', [])
            row_ids = table_data.get('rowIds', [])
            cell_map = table_data.get('cellMap', {})
            
            if len(column_ids) < 3 or len(row_ids) < 2:
                continue
            
            header_row_id = row_ids[0]
            header_cell_id = f'{header_row_id}_{column_ids[2]}'
            header_cell = cell_map.get(header_cell_id, {})
            header_content = extract_cell_content(block_map, header_cell, item_lookup)
            
            is_time_table = any(
                c.get('type') == 'text' and '消耗时长' in c.get('text', '')
                for c in header_content
            )
            
            if not is_time_table:
                continue
            
            for row_id in row_ids[1:]:
                col0_cell_id = f'{row_id}_{column_ids[0]}'
                col1_cell_id = f'{row_id}_{column_ids[1]}'
                col2_cell_id = f'{row_id}_{column_ids[2]}'
                
                col0_cell = cell_map.get(col0_cell_id, {})
                col1_cell = cell_map.get(col1_cell_id, {})
                col2_cell = cell_map.get(col2_cell_id, {})
                
                materials = extract_cell_content(block_map, col0_cell, item_lookup)
                products = extract_cell_content(block_map, col1_cell, item_lookup)
                time_content = extract_cell_content(block_map, col2_cell, item_lookup)
                
                time_value = None
                for content in time_content:
                    if content.get('type') == 'text':
                        time_value = content.get('text', '').strip()
                        break
                
                if not time_value:
                    continue
                
                material_ids = sorted([m['id'] for m in materials if m.get('type') == 'entry'])
                product_ids = sorted([p['id'] for p in products if p.get('type') == 'entry'])
                
                recipe_key = f"{','.join(material_ids)}|{','.join(product_ids)}"
                time_mapping[recipe_key] = time_value
    
    return time_mapping if time_mapping else None


def add_manufacturing_time_to_device_tables(item_lookup: Dict):
    device_tables_dir = 'device_production_tables'
    
    if not os.path.exists(device_tables_dir):
        print(f"错误: {device_tables_dir} 目录不存在")
        print("请先运行 extract_device_productions.py")
        return 0, 0
    
    updated_count = 0
    total_recipes_updated = 0
    
    for filename in os.listdir(device_tables_dir):
        if not filename.endswith('.json'):
            continue
        
        device_id = filename.replace('.json', '')
        filepath = os.path.join(device_tables_dir, filename)
        
        with open(filepath, 'r', encoding='utf-8') as f:
            device_table = json.load(f)
        
        time_mapping = extract_manufacturing_time_from_device(device_id, item_lookup)
        
        if not time_mapping:
            print(f"⚠ 设备 {device_id} ({device_table['deviceName']}): 未找到制造时间数据")
            continue
        
        recipes_with_time = 0
        for recipe in device_table['recipes']:
            material_ids = sorted([m['id'] for m in recipe['materials']])
            product_ids = sorted([p['id'] for p in recipe['products']])
            recipe_key = f"{','.join(material_ids)}|{','.join(product_ids)}"
            
            if recipe_key in time_mapping:
                recipe['manufacturingTime'] = time_mapping[recipe_key]
                recipes_with_time += 1
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(device_table, f, ensure_ascii=False, indent=2)
        
        print(f"✓ 设备 {device_id} ({device_table['deviceName']}): {recipes_with_time}/{len(device_table['recipes'])} 个配方添加了制造时间")
        updated_count += 1
        total_recipes_updated += recipes_with_time
    
    return updated_count, total_recipes_updated


if __name__ == '__main__':
    print("开始提取设备制造时间...")
    print("="*60)
    
    print("\n[1/2] 加载物品名称索引...")
    item_lookup = load_item_lookup()
    print(f"      加载了 {len(item_lookup)} 个物品名称")
    
    print("\n[2/2] 为设备生产表格添加制造时间...")
    updated_count, total_recipes = add_manufacturing_time_to_device_tables(item_lookup)
    
    print("\n" + "="*60)
    print(f"✅ 完成！更新了 {updated_count} 个设备，共 {total_recipes} 个配方添加了制造时间")
    print("="*60)
