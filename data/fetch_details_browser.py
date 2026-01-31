#!/usr/bin/env python3
import json
import os
import time
from playwright.sync_api import sync_playwright


def load_item_ids() -> list:
    all_item_ids = []
    
    if os.path.exists('data/type5_devices.json'):
        with open('data/type5_devices.json', 'r', encoding='utf-8') as f:
            devices = json.load(f)
            all_item_ids.extend([d['itemId'] for d in devices])
    
    if os.path.exists('data/type6_items.json'):
        with open('data/type6_items.json', 'r', encoding='utf-8') as f:
            items = json.load(f)
            all_item_ids.extend([i['itemId'] for i in items])
    
    return all_item_ids


def fetch_item_detail_via_page(page, item_id: str, output_dir: str, verbose: bool = False) -> bool:
    output_file = os.path.join(output_dir, f"{item_id}.json")
    
    if os.path.exists(output_file):
        return False
    
    url = f"https://wiki.skland.com/endfield/detail?mainTypeId=1&subTypeId=6&gameEntryId={item_id}"
    
    try:
        if verbose:
            print(f"  Navigating to: {url}")
        
        with page.expect_response(
            lambda r: '/wiki/item/info' in r.url and r.status == 200,
            timeout=30000
        ) as response_info:
            page.goto(url, wait_until='domcontentloaded', timeout=30000)
        
        response = response_info.value
        data = response.json()
        
        if data.get('code') == 0:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        else:
            if verbose:
                print(f"  ✗ API error: code={data.get('code')}, message={data.get('message')}")
            return False
            
    except Exception as e:
        if verbose:
            print(f"  ✗ Exception: {str(e)}")
        return False


def main():
    import sys
    
    print("正在加载物品列表...")
    item_ids = load_item_ids()
    
    if not item_ids:
        print("错误: 未找到物品列表文件")
        print("请先运行: python3 data/fetch.py")
        return
    
    test_limit = None
    verbose = False
    if len(sys.argv) > 1:
        if '--test' in sys.argv:
            test_limit = 3
            item_ids = item_ids[:test_limit]
            print(f"测试模式: 只获取前 {test_limit} 个物品\n")
        if '--verbose' in sys.argv or '-v' in sys.argv:
            verbose = True
            print(f"详细模式: 显示调试信息\n")
    
    total = len(item_ids)
    print(f"找到 {total} 个物品\n")
    
    output_dir = 'data/item_details'
    os.makedirs(output_dir, exist_ok=True)
    
    success_count = 0
    skip_count = 0
    fail_count = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080}
        )
        
        try:
            page = context.new_page()
            
            print(f"开始批量获取...\n")
            
            for idx, item_id in enumerate(item_ids, 1):
                output_file = os.path.join(output_dir, f"{item_id}.json")
                
                if os.path.exists(output_file):
                    skip_count += 1
                    print(f"[{idx}/{total}] {item_id} ⊘ (已存在)")
                    continue
                
                result = fetch_item_detail_via_page(page, item_id, output_dir, verbose)
                
                if result:
                    success_count += 1
                    print(f"[{idx}/{total}] {item_id} ✓")
                else:
                    fail_count += 1
                    print(f"[{idx}/{total}] {item_id} ✗")
                    
                    if fail_count >= 3 and success_count == 0:
                        print("\n连续3次失败，停止执行")
                        print("建议：检查网络连接或使用 --verbose 查看详细错误")
                        break
                
                time.sleep(0.2)
            
            page.close()
            
            print(f"\n完成！")
            print(f"- 成功: {success_count} 个")
            print(f"- 跳过: {skip_count} 个")
            print(f"- 失败: {fail_count} 个")
            print(f"- 保存至: {output_dir}/")
        
        finally:
            browser.close()


if __name__ == '__main__':
    main()
