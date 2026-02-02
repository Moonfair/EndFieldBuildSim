#!/usr/bin/env python3
"""
Extract recipe database from synthesis tables and device production tables.

Creates a unified recipe database with:
- Deduplicated recipes (same device + materials + products)
- Index by item as materials/products
- Index by device
"""

import json
import os
from collections import defaultdict
from typing import Dict, List, Any


def load_item_lookup() -> Dict[str, str]:
    """Load item lookup from item_lookup.json."""
    with open('item_lookup.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    # item_lookup.json is a dict of item_id -> item_info
    return {item_id: info['name'] for item_id, info in data.items()}


def load_device_text_map() -> Dict[str, str]:
    """Load device text map from overrides/device_text_map.json."""
    path = os.path.join('overrides', 'device_text_map.json')
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def load_real_device_ids() -> set:
    with open('type5_devices.json', 'r', encoding='utf-8') as f:
        devices = json.load(f)
    return set(d['itemId'] for d in devices)


def parse_synthesis_tables(synthesis_dir: str, item_lookup: Dict[str, str],
                          device_text_map: Dict[str, str]) -> Dict[str, Dict]:
    """
    Parse synthesis tables and extract recipes.

    Returns: dict of recipe_id -> recipe_data
    """
    recipes = {}

    if not os.path.exists(synthesis_dir):
        print(f"警告: {synthesis_dir} 目录不存在")
        return recipes

    for filename in os.listdir(synthesis_dir):
        if not filename.endswith('.json'):
            continue

        filepath = os.path.join(synthesis_dir, filename)

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        item_id = data['itemId']

        for table in data.get('tables', []):
            headers = table.get('headers', [])

            device_col_idx = None
            materials_col_idx = None
            products_col_idx = None

            # 动态列解析逻辑 (复用 extract_device_productions.py)
            for idx, header_cells in enumerate(headers):
                for cell in header_cells:
                    if cell.get('type') == 'text':
                        text = cell.get('text', '')
                        if '合成设备' in text and device_col_idx is None:
                            device_col_idx = idx
                        elif '原料需求' in text and materials_col_idx is None:
                            materials_col_idx = idx
                        elif '合成产物' in text and products_col_idx is None:
                            products_col_idx = idx

            if device_col_idx is None or materials_col_idx is None or products_col_idx is None:
                continue

            for row in table.get('data', []):
                if len(row) <= max(device_col_idx, materials_col_idx, products_col_idx):
                    continue

                device_cell = row[device_col_idx]
                materials_cell = row[materials_col_idx]
                products_cell = row[products_col_idx]

                for device_item in device_cell:
                    device_type = device_item.get('type')

                    # Skip category header rows (count=0 indicates section/categorization)
                    if device_type == 'entry' and device_item.get('count', '1') == '0':
                        continue

                    if device_type == 'entry':
                        device_id = device_item['id']
                    elif device_type == 'text':
                        device_text = device_item.get('text', '').strip()
                        # 使用 device_text_map 进行映射
                        device_id = device_text_map.get(device_text, f"text_{device_text}")
                    else:
                        continue

                    # 提取原料
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

                    # 提取产物
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

                    if not materials or not products:
                        continue

                    # 创建配方指纹用于去重
                    recipe_key = f"{device_id}|{','.join(sorted(material_ids))}|{','.join(sorted(product_ids))}"
                    recipe_id = f"recipe_{len(recipes)}"

                    recipe_data = {
                        'deviceId': device_id,
                        'deviceName': item_lookup.get(device_id, device_id),
                        'materials': materials,
                        'products': products,
                        'source': 'synthesis_tables'
                    }

                    # 如果已存在相同配方，保留信息更全的
                    if recipe_key in recipes:
                        existing = recipes[recipe_key]
                        # 比较信息完整性（有 manufacturingTime 的优先）
                        if 'manufacturingTime' in existing and 'manufacturingTime' not in recipe_data:
                            continue
                        elif 'manufacturingTime' not in existing and 'manufacturingTime' in recipe_data:
                            recipes[recipe_key] = recipe_data
                    else:
                        recipes[recipe_key] = recipe_data

    return recipes


def parse_device_production_tables(device_prod_dir: str, item_lookup: Dict[str, str],
                                  device_text_map: Dict[str, str],
                                  existing_recipes: Dict[str, Dict],
                                  real_device_ids: set = set()) -> Dict[str, Dict]:
    """
    Parse device production tables and merge with existing recipes.

    Returns: updated dict of recipe_id -> recipe_data
    """
    if not os.path.exists(device_prod_dir):
        print(f"警告: {device_prod_dir} 目录不存在")
        return existing_recipes

    if real_device_ids is None:
        real_device_ids = set()

    for filename in os.listdir(device_prod_dir):
        if not filename.endswith('.json'):
            continue

        filepath = os.path.join(device_prod_dir, filename)

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        device_id = data['deviceId']

        if device_id.isdigit() and real_device_ids and device_id not in real_device_ids:
            continue

        device_id = data['deviceId']
        device_name = data.get('deviceName', item_lookup.get(device_id, device_id))

        for recipe in data.get('recipes', []):
            # 提取原料并添加名称
            materials = []
            material_ids = []
            for mat in recipe.get('materials', []):
                mat_id = mat.get('id', '')
                mat_name = item_lookup.get(mat_id, f"Unknown({mat_id})")
                mat_count = mat.get('count', '1')
                materials.append({
                    'id': mat_id,
                    'name': mat_name,
                    'count': mat_count
                })
                material_ids.append(f"{mat_id}:{mat_count}")

            # 提取产物并添加名称
            products = []
            product_ids = []
            for prod in recipe.get('products', []):
                prod_id = prod.get('id', '')
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

            # 创建配方指纹用于去重
            recipe_key = f"{device_id}|{','.join(sorted(material_ids))}|{','.join(sorted(product_ids))}"

            recipe_data = {
                'deviceId': device_id,
                'deviceName': device_name,
                'materials': materials,
                'products': products,
                'source': 'device_production_tables'
            }

            # Preserve manufacturing time if available
            if 'manufacturingTime' in recipe:
                recipe_data['manufacturingTime'] = recipe['manufacturingTime']

            # 如果已存在相同配方，保留信息更全的
            if recipe_key in existing_recipes:
                existing = existing_recipes[recipe_key]
                # device_production_tables 的数据更完整，优先使用
                if existing['source'] == 'synthesis_tables':
                    existing_recipes[recipe_key] = recipe_data
                else:
                    # 同源，保持原有的
                    pass
            else:
                existing_recipes[recipe_key] = recipe_data

    return existing_recipes


def build_recipe_database(recipes_dict: Dict[str, Dict]) -> Dict[str, Any]:
    """
    Build the final recipe database structure.

    Returns: dict with recipes, asMaterials, asProducts, byDevice
    """
    # 重新生成 recipe_id（使用数字序号）
    recipe_id_map = {}
    recipes_list = []

    for idx, recipe_data in enumerate(recipes_dict.values()):
        recipe_id = f"recipe_{idx}"
        recipe_id_map[id(recipe_data)] = recipe_id
        recipe_data['id'] = recipe_id
        recipes_list.append(recipe_data)

    # 按物品索引
    as_materials = defaultdict(list)
    as_products = defaultdict(list)

    for recipe_data in recipes_list:
        recipe_id = recipe_data['id']

        # 作为原料的物品
        for mat in recipe_data.get('materials', []):
            as_materials[mat['id']].append(recipe_id)

        # 作为产物的物品
        for prod in recipe_data.get('products', []):
            as_products[prod['id']].append(recipe_id)

    # 按设备索引
    by_device = defaultdict(list)

    for recipe_data in recipes_list:
        recipe_id = recipe_data['id']
        by_device[recipe_data['deviceId']].append(recipe_id)

    # 转换为普通 dict
    return {
        'recipes': {r['id']: r for r in recipes_list},
        'asMaterials': dict(as_materials),
        'asProducts': dict(as_products),
        'byDevice': dict(by_device)
    }


def save_recipe_database(db: Dict[str, Any], output_path: str):
    """Save recipe database to JSON file."""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)


def verify_recipe_database(db: Dict[str, Any]) -> bool:
    """
    验证配方数据库是否包含必要的配方。

    Returns: True if verification passed
    """
    # 检查采种机(173)的荞花种子配方
    device_173_recipes = db['byDevice'].get('173', [])
    buckwheat_seed_recipes = []

    for recipe_id in device_173_recipes:
        recipe = db['recipes'][recipe_id]
        for prod in recipe.get('products', []):
            if prod['id'] == '204':  # 荞花种子
                buckwheat_seed_recipes.append(recipe_id)

    # 检查是否有配方：荞花 × 1 → 荞花种子 × 2
    target_found = False
    for recipe_id in buckwheat_seed_recipes:
        recipe = db['recipes'][recipe_id]
        materials = recipe.get('materials', [])
        products = recipe.get('products', [])

        if (len(materials) == 1 and
            materials[0]['id'] == '31' and materials[0]['count'] == '1' and  # 荞花
            len(products) == 1 and
            products[0]['id'] == '204' and products[0]['count'] == '2'):  # 荞花种子
            target_found = True
            break

    print("\n" + "="*60)
    print("配方数据库验证")
    print("="*60)
    print(f"总配方数: {len(db['recipes'])}")
    print(f"作为原料涉及物品数: {len(db['asMaterials'])}")
    print(f"作为产物涉及物品数: {len(db['asProducts'])}")
    print(f"涉及设备数: {len(db['byDevice'])}")
    print(f"采种机(173)配方数: {len(device_173_recipes)}")
    print(f"荞花种子配方数: {len(buckwheat_seed_recipes)}")

    if target_found:
        print("✅ 验证通过：找到荞花 × 1 → 荞花种子 × 2 配方")
    else:
        print("❌ 验证失败：未找到荞花 × 1 → 荞花种子 × 2 配方")

    print("="*60)

    return target_found


def main():
    print("开始提取配方库...")
    print("="*60)

    print("\n[1/5] 加载物品名称索引...")
    item_lookup = load_item_lookup()
    print(f"      加载了 {len(item_lookup)} 个物品名称")

    print("\n[2/5] 加载设备文本映射...")
    device_text_map = load_device_text_map()
    print(f"      加载了 {len(device_text_map)} 个文本设备映射")

    print("\n[3/5] 解析合成表格...")
    recipes = parse_synthesis_tables('synthesis_tables', item_lookup, device_text_map)
    print(f"      从合成表格提取了 {len(recipes)} 个配方")

    print("\n[4/5] 加载设备ID列表...")
    real_device_ids = load_real_device_ids()
    print(f"      真实设备数: {len(real_device_ids)}")

    print("\n[4/6] 解析设备生产表格...")
    recipes = parse_device_production_tables('device_production_tables', item_lookup,
                                            device_text_map, recipes, real_device_ids)
    print(f"      合并后总配方数: {len(recipes)}")

    print("\n[6/6] 构建配方数据库...")
    db = build_recipe_database(recipes)

    print("\n保存配方数据库...")
    save_recipe_database(db, 'recipe_database.json')
    print("✓ 已保存到 recipe_database.json")

    web_output_path = os.path.join('..', 'web', 'public', 'data', 'recipe_database.json')
    if os.path.exists(os.path.dirname(web_output_path)):
        save_recipe_database(db, web_output_path)
        print(f"✓ 已同步到 {web_output_path}")

    # 验证配方数据库
    verify_recipe_database(db)

    print("\n" + "="*60)
    print("✅ 完成！配方库已生成")
    print("="*60)


if __name__ == '__main__':
    main()
