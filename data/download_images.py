#!/usr/bin/env python3
"""
下载所有物品图片到本地

功能：
- 从 item_lookup.json 读取所有图片URL
- 并发下载到 web/public/images/items/
- 支持断点续传
- 显示进度条
- 验证图片有效性
"""

import json
import os
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse
import time

try:
    import requests
except ImportError:
    print("错误: 需要安装 requests 库")
    print("运行: pip install requests")
    sys.exit(1)


def download_image(url: str, filepath: str, max_retries: int = 3) -> tuple[bool, str]:
    if os.path.exists(filepath):
        return (True, f"已存在，跳过")
    
    for attempt in range(max_retries):
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
            
            with requests.get(url, stream=True, headers=headers, timeout=30) as resp:
                resp.raise_for_status()
                
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                
                with open(filepath, 'wb') as f:
                    for chunk in resp.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                if os.path.getsize(filepath) == 0:
                    os.remove(filepath)
                    return (False, "下载的文件大小为0")
                
                return (True, "下载成功")
                
        except requests.exceptions.HTTPError as e:
            if e.response.status_code in [404, 403]:
                return (False, f"HTTP {e.response.status_code}")
            if attempt < max_retries - 1:
                time.sleep(1)
                continue
            return (False, f"HTTP错误: {e.response.status_code}")
            
        except requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            return (False, "超时")
            
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(1)
                continue
            return (False, f"异常: {str(e)}")
    
    return (False, "达到最大重试次数")


def get_extension(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path
    ext = os.path.splitext(path)[1]
    return ext if ext else '.png'


def load_items():
    lookup_path = 'data/item_lookup.json'
    
    if not os.path.exists(lookup_path):
        print(f"错误: 未找到 {lookup_path}")
        print("请先运行数据收集脚本")
        sys.exit(1)
    
    with open(lookup_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def main():
    print("=== 下载物品图片 ===\n")
    
    items = load_items()
    total = len(items)
    print(f"找到 {total} 个物品\n")
    
    output_dir = Path('web/public/images/items')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    tasks = []
    for item_id, item in items.items():
        url = item.get('image', '')
        if not url:
            continue
        
        ext = get_extension(url)
        filepath = output_dir / f"{item_id}{ext}"
        tasks.append((item_id, url, str(filepath), item['name']))
    
    print(f"准备下载 {len(tasks)} 张图片")
    print(f"目标目录: {output_dir}\n")
    
    results = {
        'success': 0,
        'skipped': 0,
        'failed': 0,
        'errors': []
    }
    
    max_workers = 10
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(download_image, url, filepath): (item_id, name, url)
            for item_id, url, filepath, name in tasks
        }
        
        completed = 0
        for future in as_completed(futures):
            completed += 1
            item_id, name, url = futures[future]
            
            try:
                success, message = future.result()
                
                status = '✓' if success else '✗'
                print(f"[{completed}/{len(tasks)}] {status} {item_id} - {name}: {message}")
                
                if success:
                    if "跳过" in message:
                        results['skipped'] += 1
                    else:
                        results['success'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append({
                        'itemId': item_id,
                        'name': name,
                        'url': url,
                        'error': message
                    })
                    
            except Exception as e:
                print(f"[{completed}/{len(tasks)}] ✗ {item_id} - {name}: 异常 {str(e)}")
                results['failed'] += 1
    
    print("\n" + "="*50)
    print(f"下载完成:")
    print(f"  成功: {results['success']}")
    print(f"  跳过: {results['skipped']}")
    print(f"  失败: {results['failed']}")
    print("="*50)
    
    if results['errors']:
        print("\n失败的下载:")
        for err in results['errors'][:10]:
            print(f"  - {err['itemId']} ({err['name']}): {err['error']}")
        if len(results['errors']) > 10:
            print(f"  ... 还有 {len(results['errors']) - 10} 个错误")
        
        error_log = 'data/download_errors.json'
        with open(error_log, 'w', encoding='utf-8') as f:
            json.dump(results['errors'], f, ensure_ascii=False, indent=2)
        print(f"\n完整错误日志: {error_log}")
    
    if results['failed'] > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
