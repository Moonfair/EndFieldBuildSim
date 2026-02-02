#!/usr/bin/env python3
import json
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
data = json.load(open('item_details/174.json', encoding='utf-8'))

# Navigate to blockMap structure
doc_map = data['data']['item']['document']['documentMap']
first_doc_id = list(doc_map.keys())[0]
block_map = doc_map[first_doc_id]['blockMap']

print("="*60)
print("All blocks in harvester document:")
print("="*60)

# Find all blocks and look for recipe tables
for block_id, block_data in block_map.items():
    kind = block_data.get('kind')
    if kind == 'text':
        inline = block_data.get('text', {}).get('inlineElements', [])
        for elem in inline:
            if elem.get('kind') == 'text':
                text = elem['text']['text']
                if text in ['基础模式', '原料需求', '制作产物', '制作时间']:
                    print(f"\n[{block_id}] Text: '{text}'")
    elif kind == 'table':
        table = block_data['table']
        print(f"\n[{block_id}] Table:")
        print(f"  Rows: {table['rowIds']}")
        print(f"  Columns: {table['columnIds']}")