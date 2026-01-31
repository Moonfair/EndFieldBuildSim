#!/usr/bin/env python3
import json
import os

os.chdir('/Users/moonfair/Projects/EndFieldBuildSim/data')

print("=== 检查 synthesis_tables/204.json ===\n")

with open('synthesis_tables/204.json', 'r') as f:
    synthesis = json.load(f)

print("表格信息:")
print(f"  行数: {synthesis['tables'][0]['rows']}")
print(f"  列数: {synthesis['tables'][0]['columns']}")

print("\n配方:")
for i, row in enumerate(synthesis['tables'][0]['data'], start=1):
    for col_idx, cells in enumerate(row):
        if col_idx == 2:  # 合成产物列
            for cell in cells:
                if cell['type'] == 'entry':
                    print(f"  第{i}行产物: {cell['id']} (count={cell['count']})")

print("=== 检查 recipe_database ===\n")

with open('recipe_database.json', 'r') as f:
    db = json.load(f)

harvester_recipes = db['byDevice'].get('174', [])
print(f"种植机 (174) 配方数: {len(harvester_recipes)}")

# 检查荞花种子作为产物的配方
seed_as_product = db['asProducts'].get('204', [])
print(f"荞花种子 (204) 作为产物: {len(seed_as_product)}} 个配方")

for recipe_id in seed_as_product:
    recipe = db['recipes'][recipe_id]
    if '荞花' in recipe['deviceName']:
        devices = [m['name'] for m in recipe['materials']]
        products = [p['name'] for p in recipe['products']]
        print(f"  - {recipe['deviceName']}: {' + '.join(devices) if devices else '(无)'} → {', '.join(products)}")

print(f"\n=== device_production_tables/174.json ===")
path = 'device_production_tables/173.json'
if os.path.exists(path):
    with open(path, 'r') as f:
        device_173 = json.load(f)
    print(f"✗ 仍然存在（应该已删除）: {len(device_173['recipes'])} 个配方")
else:
    print("✓ 已正确删除")