#!/usr/bin/env python3
import json
from pathlib import Path
from typing import Dict, Any


def load_item_lookup_with_subtype() -> Dict[str, Any]:
    item_lookup = {}

    details_dir = Path('data/item_details')
    if not details_dir.exists():
        print(f"错误: item_details 目录不存在: {details_dir}")
        return {}

    print(f"开始扫描 item_details 目录: {details_dir}")

    count = 0
    for detail_file in sorted(details_dir.glob('*.json')):
        item_id = detail_file.stem

        try:
            with open(detail_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if data.get('code') != 0:
                print(f"  跳过 {item_id}: code != 0")
                continue

            item = data.get('data', {}).get('item', {})
            if not item:
                print(f"  跳过 {item_id}: 无 item 数据")
                continue

            item_name = item.get('name', '')
            item_id_real = item.get('itemId', '')
            sub_type = item.get('subType', {})
            sub_type_id = sub_type.get('id', '')
            sub_type_name = sub_type.get('name', '')

            image_url = ''
            brief = item.get('brief', {})
            if brief:
                image_url = brief.get('cover', '')

            if not item_name or not item_id_real:
                print(f"  跳过 {item_id}: 缺少必要字段")
                continue

            item_lookup[item_id_real] = {
                'itemId': item_id_real,
                'name': item_name,
                'image': image_url,
                'subTypeID': sub_type_id,
                'subTypeName': sub_type_name
            }

            count += 1

        except Exception as e:
            print(f"  错误处理 {item_id}: {e}")

    print(f"成功加载 {count} 个物品")
    return item_lookup


def save_item_lookup(item_lookup: Dict[str, Any], output_path: Path):
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(item_lookup, f, ensure_ascii=False, indent=2)

    print(f"已保存到: {output_path}")


def print_statistics(item_lookup: Dict[str, Any]):
    total = len(item_lookup)
    devices = sum(1 for item in item_lookup.values() if item.get('subTypeID') == '5')
    items = sum(1 for item in item_lookup.values() if item.get('subTypeID') == '6')
    others = total - devices - items

    print("\n" + "="*60)
    print("item_lookup.json 统计")
    print("="*60)
    print(f"总计: {total}")
    print(f"设备 (subType.id=5): {devices}")
    print(f"物品 (subType.id=6): {items}")
    print(f"其他: {others}")
    print("="*60)


def main():
    print("=== 更新 item_lookup.json with subType 信息 ===\n")

    item_lookup = load_item_lookup_with_subtype()

    if not item_lookup:
        print("没有加载到任何物品数据")
        return

    output_path = Path('web/public/data/item_lookup.json')
    save_item_lookup(item_lookup, output_path)

    dist_path = Path('web/dist/data/item_lookup.json')
    if dist_path.parent.exists():
        save_item_lookup(item_lookup, dist_path)

    print_statistics(item_lookup)

    print("\n✅ 完成！")


if __name__ == '__main__':
    main()