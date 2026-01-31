#!/usr/bin/env python3
"""检查种植机配方是否存在荞花种子→荞花的配方"""
import json

with open('recipe_database.json', 'r') as f:
    db = json.load(f)

print("=== 种植机 (174) 配方列表 ===")
harvester_recipes = db['byDevice'].get('174', [])
print(f"总配方数: {len(harvester_recipes)}\n")

# 打印所有配方
for i, recipe_id in enumerate(harvester_recipes, 1):
    recipe = db['recipes'][recipe_id]
    mats = recipe['materials']
    prods = recipe['products']
    
    mats_str = ', '.join([f"{m['name']}x{m['count']}" for m in mats])
    prods_str = ', '.join([f"{p['name']}x{p['count']}" for p in prods])
    
    print(f"{i}. {mats_str} → {prods_str}")

print("\n=== 检查荞花种子 (204) 作为原料的配方 ===")
seed_material_recipes = db['asMaterials'].get('204', [])
print(f"作为原料参与: {len(seed_material_recipes)} 个配方\n")

for i, recipe_id in enumerate(seed_material_recipes, 1):
    recipe = db['recipes'][recipe_id]
    device = recipe['deviceName']
    prods = [f"{p['name']}x{p['count']}" for p in recipe['products']]
    print(f"{i}. {device}: {' '.join(prods)}")

print("\n=== 检查荞花 (31) 作为产物的配方 ===")
buckwheat_product_recipes = db['asProducts'].get('31', [])
print(f"作为产物: {len(buckwheat_product_recipes)} 个配方\n")

for i, recipe_id in enumerate(buckwheat_product_recipes, 1):
    recipe = db['recipes'][recipe_id]
    device = recipe['deviceName']
    mats = [f"{m['name']}x{m['count']}" for m in recipe['materials']]
    print(f"{i}. {device}: {', '.join(mats) if mats else '(无)'} → 荞花x1")

print("\n=== 预期情况 ===")
print("应存在配方: 种植机 (174) + 荞花种子 (204) × 1) → 荞花 (31) × 1")
print("应显示在: 荞花种子 (204) 的'作为原料的配方'区域")
print("或: 荞花种子 (204) 详情页的'作为产物的配方'区域")