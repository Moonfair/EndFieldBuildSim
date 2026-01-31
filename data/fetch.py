import json
import os
from playwright.sync_api import sync_playwright


def save_json(data, filepath: str):
    """保存JSON数据到文件"""
    # 创建父目录
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # 保存JSON文件
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def fetch_catalog(type_sub_id: int) -> list:
    """获取指定类型的物品目录"""
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        try:
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            page = context.new_page()
            
            catalog_data = []
            
            def handle_response(response):
                # 拦截catalog API响应
                if 'wiki/item/catalog' in response.url and 'typeMainId=1' in response.url:
                    try:
                        json_data = response.json()
                        if json_data.get('code') == 0 and 'data' in json_data:
                            # 提取catalog数据
                            catalog = json_data['data'].get('catalog', [])
                            for main_type in catalog:
                                for sub_type in main_type.get('typeSub', []):
                                    # 只提取匹配的typeSubId
                                    if sub_type.get('id') == str(type_sub_id):
                                        for item in sub_type.get('items', []):
                                            catalog_data.append({
                                                'itemId': item.get('itemId', ''),
                                                'name': item.get('name', ''),
                                                'image': item.get('brief', {}).get('cover', '')
                                            })
                    except Exception as e:
                        pass
            
            page.on('response', handle_response)
            
            # 访问页面触发API调用
            page.goto('https://wiki.skland.com/', wait_until='networkidle', timeout=30000)
            
            return catalog_data
        finally:
            browser.close()


def main():
    """主函数：执行完整的数据收集流程"""
    import time
    
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
            
            # 1. 获取设备目录 (typeSubId=5)
            print("正在获取设备目录 (typeSubId=5)...")
            devices = []
            
            def handle_catalog_response(response):
                if 'wiki/item/catalog' in response.url and 'typeMainId=1' in response.url:
                    try:
                        json_data = response.json()
                        if json_data.get('code') == 0 and 'data' in json_data:
                            catalog = json_data['data'].get('catalog', [])
                            for main_type in catalog:
                                for sub_type in main_type.get('typeSub', []):
                                    if sub_type.get('id') == '5':
                                        for item in sub_type.get('items', []):
                                            devices.append({
                                                'itemId': item.get('itemId', ''),
                                                'name': item.get('name', ''),
                                                'image': item.get('brief', {}).get('cover', '')
                                            })
                    except:
                        pass
            
            page.on('response', handle_catalog_response)
            page.goto('https://wiki.skland.com/', wait_until='networkidle', timeout=30000)
            page.remove_listener('response', handle_catalog_response)
            
            save_json(devices, 'data/type5_devices.json')
            print(f"已提取 {len(devices)} 个设备")
            
            # 2. 获取物品目录 (typeSubId=6)
            print("正在获取物品目录 (typeSubId=6)...")
            items = []
            
            def handle_items_response(response):
                if 'wiki/item/catalog' in response.url and 'typeMainId=1' in response.url:
                    try:
                        json_data = response.json()
                        if json_data.get('code') == 0 and 'data' in json_data:
                            catalog = json_data['data'].get('catalog', [])
                            for main_type in catalog:
                                for sub_type in main_type.get('typeSub', []):
                                    if sub_type.get('id') == '6':
                                        for item in sub_type.get('items', []):
                                            items.append({
                                                'itemId': item.get('itemId', ''),
                                                'name': item.get('name', ''),
                                                'image': item.get('brief', {}).get('cover', '')
                                            })
                    except:
                        pass
            
            page.on('response', handle_items_response)
            page.goto('https://wiki.skland.com/', wait_until='networkidle', timeout=30000)
            page.remove_listener('response', handle_items_response)
            
            save_json(items, 'data/type6_items.json')
            print(f"已提取 {len(items)} 个物品")
            
            # 3. 获取所有物品的详细信息
            output_dir = 'data/item_details'
            os.makedirs(output_dir, exist_ok=True)
            
            all_item_ids = [d['itemId'] for d in devices] + [i['itemId'] for i in items]
            total = len(all_item_ids)
            
            print(f"\n目录数据收集完成！")
            print(f"- 设备: {len(devices)} 个 (保存至 data/type5_devices.json)")
            print(f"- 物品: {len(items)} 个 (保存至 data/type6_items.json)")
            print(f"- 详情目录已创建: {output_dir}/")
            
            print(f"\n【重要说明】物品详情API限制:")
            print(f"  /wiki/item/info 端点需要动态签名认证，无法通过浏览器自动化直接获取。")
            print(f"  建议使用以下方法获取详情数据：")
            print(f"  1. 打开浏览器开发者工具 (F12) -> Network标签")
            print(f"  2. 访问 https://wiki.skland.com/item/[任意ID]")
            print(f"  3. 查找 /wiki/item/catalog 请求，复制请求头中的:")
            print(f"     - timestamp")
            print(f"     - sign")
            print(f"     - dId")
            print(f"  4. 使用 fetch_details_with_auth.sh 脚本(需手动创建):")
            print(f"")
            print(f"     #!/bin/bash")
            print(f"     # 从浏览器复制的认证头")
            print(f"     TIMESTAMP='你的timestamp'")
            print(f"     SIGN='你的sign'")
            print(f"     DID='你的dId'")
            print(f"")
            print(f"     for ID in $(cat data/type5_devices.json data/type6_items.json | jq -r '.[].itemId'); do")
            print(f"       curl 'https://zonai.skland.com/web/v1/wiki/item/info?id='$ID \\")
            print(f"         -H \"timestamp: $TIMESTAMP\" \\")
            print(f"         -H \"sign: $SIGN\" \\")
            print(f"         -H \"dId: $DID\" \\")
            print(f"         -H 'vName: 1.0.0' \\")
            print(f"         -H 'platform: 3' \\")
            print(f"         -o data/item_details/$ID.json")
            print(f"       sleep 0.2")
            print(f"     done")
            print(f"")
            print(f"  注意: 认证头会过期，需要定期从浏览器重新获取。")
        
        finally:
            browser.close()


if __name__ == '__main__':
    main()