#!/usr/bin/env python3
"""
Extract device production tables through reverse indexing.

Reads synthesis tables and creates device production tables showing
what items each device can produce.
"""

import json
import os
from collections import defaultdict
from typing import Dict, List, Any


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


def build_device_productions(item_lookup: Dict[str, str]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Build device production mapping through reverse indexing.
    
    Returns:
        Dict mapping device_id -> list of production recipes
    """
    device_productions = defaultdict(list)
    device_recipe_keys = defaultdict(set)  # Track unique recipes per device
    
    synthesis_dir = 'synthesis_tables'
    if not os.path.exists(synthesis_dir):
        print(f"错误: {synthesis_dir} 目录不存在")
        return {}
    
    for filename in os.listdir(synthesis_dir):
        if not filename.endswith('.json'):
            continue
        
        filepath = os.path.join(synthesis_dir, filename)
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        item_id = data['itemId']
        item_name = data['name']
        
        for table in data.get('tables', []):
            for row in table.get('data', []):
                if len(row) < 3:
                    continue
                
                # Column 0: 合成设备 (device)
                # Column 1: 原料需求 (materials)
                # Column 2: 合成产物 (products)
                device_cell = row[0]
                materials_cell = row[1]
                products_cell = row[2]
                
                for device_item in device_cell:
                    if device_item.get('type') != 'entry':
                        continue
                    
                    device_id = device_item['id']
                    
                    materials = []
                    material_ids = []
                    for mat in materials_cell:
                        if mat.get('type') == 'entry':
                            mat_id = mat['id']
                            mat_name = item_lookup.get(mat_id, f"Unknown({mat_id})")
                            mat_count = mat.get('count', '1')
                            materials.append({
                                'id': mat_id,
                                'name': mat_name,
                                'count': mat_count
                            })
                            material_ids.append(f"{mat_id}:{mat_count}")
                    
                    products = []
                    product_ids = []
                    if products_cell:
                        for prod in products_cell:
                            if prod.get('type') == 'entry':
                                prod_id = prod['id']
                                prod_name = item_lookup.get(prod_id, f"Unknown({prod_id})")
                                prod_count = prod.get('count', '1')
                                products.append({
                                    'id': prod_id,
                                    'name': prod_name,
                                    'count': prod_count
                                })
                                product_ids.append(f"{prod_id}:{prod_count}")
                    
                    if not products:
                        continue
                    
                    # Create recipe fingerprint for deduplication
                    recipe_key = f"{','.join(sorted(material_ids))}|{','.join(sorted(product_ids))}"
                    
                    # Skip if this exact recipe already exists for this device
                    if recipe_key in device_recipe_keys[device_id]:
                        continue
                    
                    device_recipe_keys[device_id].add(recipe_key)
                    device_productions[device_id].append({
                        'materials': materials,
                        'products': products
                    })
    
    return dict(device_productions)


def save_device_production_tables(device_productions: Dict[str, List[Dict[str, Any]]], 
                                   item_lookup: Dict[str, str]):
    output_dir = 'device_production_tables'
    os.makedirs(output_dir, exist_ok=True)
    
    for device_id, recipes in device_productions.items():
        device_name = item_lookup.get(device_id, f"Unknown Device ({device_id})")
        
        output = {
            'deviceId': device_id,
            'deviceName': device_name,
            'recipeCount': len(recipes),
            'recipes': recipes
        }
        
        output_path = os.path.join(output_dir, f'{device_id}.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"✓ 设备 {device_id} ({device_name}): {len(recipes)} 个配方")


def print_statistics(device_productions: Dict[str, List[Dict[str, Any]]], 
                     item_lookup: Dict[str, str]):
    print("\n" + "="*60)
    print("设备生产表格统计")
    print("="*60)
    print(f"\n发现生产设备数量: {len(device_productions)}")
    print(f"总配方数量: {sum(len(recipes) for recipes in device_productions.values())}")
    
    sorted_devices = sorted(device_productions.items(), 
                          key=lambda x: len(x[1]), 
                          reverse=True)
    
    print("\n生产能力排名（Top 10）:")
    print("-" * 60)
    for idx, (device_id, recipes) in enumerate(sorted_devices[:10], 1):
        device_name = item_lookup.get(device_id, f"Unknown({device_id})")
        print(f"{idx:2d}. {device_name:20s} (ID:{device_id:4s}) - {len(recipes):3d} 个配方")


if __name__ == '__main__':
    print("开始提取设备生产表格...")
    print("="*60)
    
    print("\n[1/3] 加载物品名称索引...")
    item_lookup = load_item_lookup()
    print(f"      加载了 {len(item_lookup)} 个物品名称")
    
    print("\n[2/3] 通过反向索引构建设备生产关系...")
    device_productions = build_device_productions(item_lookup)
    
    print("\n[3/3] 保存设备生产表格...")
    save_device_production_tables(device_productions, item_lookup)
    
    print_statistics(device_productions, item_lookup)
    
    print("\n" + "="*60)
    print("✅ 完成！设备生产表格已保存到 device_production_tables/ 目录")
    print("="*60)
