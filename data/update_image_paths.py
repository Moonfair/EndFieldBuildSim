#!/usr/bin/env python3
import json
import os
from pathlib import Path


def update_json_paths():
    print("=== 更新JSON文件中的图片路径 ===\n")
    
    base_dir = Path('web/public/data')
    
    print("1. 更新 item_lookup.json...")
    lookup_path = base_dir / 'item_lookup.json'
    if lookup_path.exists():
        with open(lookup_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        updated = 0
        for item_id, item in data.items():
            if 'image' in item:
                old_url = item['image']
                if old_url.startswith('http'):
                    ext = Path(old_url).suffix or '.png'
                    new_path = f"/images/items/{item_id}{ext}"
                    item['image'] = new_path
                    updated += 1
        
        with open(lookup_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"   ✓ 更新了 {updated} 个物品的图片路径")
    else:
        print(f"   ✗ 文件不存在: {lookup_path}")
    
    print("\n2. 更新 item_details/*.json...")
    details_dir = base_dir / 'item_details'
    if details_dir.exists():
        files = list(details_dir.glob('*.json'))
        updated_files = 0
        
        for file_path in files:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            changed = False
            
            if 'data' in data and 'item' in data['data']:
                item = data['data']['item']
                item_id = item.get('itemId', '')
                
                if 'brief' in item and 'cover' in item['brief']:
                    old_url = item['brief']['cover']
                    if old_url.startswith('http'):
                        ext = Path(old_url).suffix or '.png'
                        new_path = f"/images/items/{item_id}{ext}"
                        item['brief']['cover'] = new_path
                        changed = True
            
            if changed:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                updated_files += 1
        
        print(f"   ✓ 更新了 {updated_files}/{len(files)} 个详情文件")
    else:
        print(f"   ✗ 目录不存在: {details_dir}")
    
    print("\n" + "="*50)
    print("更新完成！")
    print("="*50)


if __name__ == '__main__':
    update_json_paths()
