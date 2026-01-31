#!/usr/bin/env python3
import json
import os
import sys


def extract_cell_content(inline_elements):
    result = []
    
    for elem in inline_elements:
        if elem.get('kind') == 'text' and 'text' in elem:
            text_content = elem['text'].get('text', '')
            if text_content:
                result.append({'type': 'text', 'text': text_content})
        
        elif elem.get('kind') == 'entry' and 'entry' in elem:
            entry = elem['entry']
            result.append({
                'type': 'entry',
                'id': entry.get('id', ''),
                'count': entry.get('count', '0')
            })
    
    return result


def extract_synthesis_table(item_data):
    document = item_data.get('document', {})
    document_map = document.get('documentMap', {})
    
    tables = []
    
    for doc_id, doc in document_map.items():
        if 'blockMap' not in doc:
            continue
        
        block_map = doc['blockMap']
        
        has_synthesis_device = False
        for block_id, block in block_map.items():
            if block.get('kind') == 'text' and 'text' in block:
                inline_elements = block['text'].get('inlineElements', [])
                for elem in inline_elements:
                    if elem.get('kind') == 'text' and 'text' in elem:
                        if '合成设备' in elem['text'].get('text', ''):
                            has_synthesis_device = True
                            break
            if has_synthesis_device:
                break
        
        if not has_synthesis_device:
            continue
        
        table_block = None
        for block_id, block in block_map.items():
            if block.get('kind') == 'table':
                table_block = block
                break
        
        if not table_block or 'table' not in table_block:
            continue
        
        table_data = table_block['table']
        row_ids = table_data.get('rowIds', [])
        column_ids = table_data.get('columnIds', [])
        
        table_result = {
            'rows': len(row_ids),
            'columns': len(column_ids),
            'headers': [],
            'data': []
        }
        
        for row_idx, row_id in enumerate(row_ids):
            row_data = []
            
            for col_idx, col_id in enumerate(column_ids):
                cell_parent_id = f"{row_id}_{col_id}"
                
                cell_content = []
                for block_id, block in block_map.items():
                    if block.get('parentId') == cell_parent_id:
                        if 'text' in block:
                            inline_elements = block['text'].get('inlineElements', [])
                            cell_content = extract_cell_content(inline_elements)
                        break
                
                row_data.append(cell_content)
            
            if row_idx == 0:
                table_result['headers'] = row_data
            else:
                table_result['data'].append(row_data)
        
        tables.append(table_result)
    
    return tables


def process_item_file(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if data.get('code') != 0:
        return None
    
    item = data.get('data', {}).get('item', {})
    item_id = item.get('itemId', 'unknown')
    
    tables = extract_synthesis_table(item)
    
    if not tables:
        return None
    
    result = {
        'itemId': item_id,
        'name': item.get('name', ''),
        'tables': tables
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    return result


def process_all_items(input_dir='data/item_details', output_dir='data/synthesis_tables'):
    os.makedirs(output_dir, exist_ok=True)
    
    if not os.path.exists(input_dir):
        print(f"错误: 目录不存在: {input_dir}")
        return
    
    files = [f for f in os.listdir(input_dir) if f.endswith('.json')]
    
    if not files:
        print(f"警告: {input_dir} 目录中没有找到JSON文件")
        return
    
    print(f"开始处理 {len(files)} 个物品详情文件...")
    
    success_count = 0
    no_table_count = 0
    
    for idx, filename in enumerate(files, 1):
        input_file = os.path.join(input_dir, filename)
        output_file = os.path.join(output_dir, filename)
        
        try:
            result = process_item_file(input_file, output_file)
            
            if result:
                success_count += 1
                print(f"[{idx}/{len(files)}] {filename} ✓")
            else:
                no_table_count += 1
                if os.path.exists(output_file):
                    os.remove(output_file)
        
        except Exception as e:
            print(f"[{idx}/{len(files)}] {filename} ✗ ({str(e)})")
    
    print(f"\n完成！")
    print(f"- 成功提取: {success_count} 个")
    print(f"- 无合成表格: {no_table_count} 个")
    print(f"- 保存至: {output_dir}/")


if __name__ == '__main__':
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else input_file.replace('.json', '_table.json')
        
        result = process_item_file(input_file, output_file)
        if result:
            print(f"成功提取表格: {output_file}")
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print("未找到合成设备表格")
    else:
        process_all_items()
