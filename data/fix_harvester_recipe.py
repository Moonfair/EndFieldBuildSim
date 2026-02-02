#!/usr/bin/env python3
"""
Fix harvester recipe by manually adding the missing buckwheat recipe.
"""

import json

print("=== 修复种植机荞花配方 ===\n")

# Load current device_production_tables/174.json
if not f'device_production_tables/174.json'.exists():
    print("警告: device_production_tables/174.json 不存在")
    
    # Create it
    recipe_data = {
        'deviceId': '174',
        'deviceName': '种植机',
        'recipeCount': 1,
        'recipes': [{
            'materials': [],
            'products': [{'id': '31', 'name': '荞花', 'count': '1'}]
        }]
    }
else:
    with open('device_production_tables/174.json') as f:
        recipe_data = json.load(f)
    
    print(f"当前配方数: {recipe_data['recipeCount']}")
    
    # Add or update the buckwheat recipe
    # The recipe should be: 荞花种子(1) -> 荞花(1)
    buckwheat_recipe = {
        'materials': [{'id': '204', 'name': '荞花种子', 'count': '1'}],
        'products': [{'id': '31', 'name': '荞花', 'count': '1'}]
    }
    
    # Check if this recipe already exists
    exists = False
    for recipe in recipe_data['recipes']:
        m_ids = [m['id'] for m in recipe.get('materials', [])]
        p_ids = [p['id'] for p in recipe.get('products', [])]
        
        if '204' in m_ids and '31' in p_ids:
            exists = True
            break
    
    if not exists:
        # Insert after the first recipe to keep position
        recipe_data['recipes'].insert(0, buckwheat_recipe)
        recipe_data['recipeCount'] = len(recipe_data['recipes'])
        print("✓ 添加荞花种子配方")
    else:
        print("○ 荞花种子配方已存在")

# Save updated data
with open('device_production_tables/174.json', 'w', encoding='utf-8') as f:
    json.dump(recipe_data, f, ensure_ascii=False, indent=2)

print(f"\n保存完成，当前配方数: {recipe_data['recipeCount']}")
 SCRIPT
python3 fix_harvester_recipe.py