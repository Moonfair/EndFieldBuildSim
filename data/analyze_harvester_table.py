#!/usr/bin/env python3
"""
Analyze harvester's recipe table structure from item_details/174.json
"""

import json
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
data = json.load(open('item_details/174.json', encoding='utf-8'))

# Navigate to blockMap structure
doc_map = data['data']['item']['document']['documentMap']
# Get first document entry (there should be only one)
first_doc_id = list(doc_map.keys())[0]
document_info = doc_map[first_doc_id]
block_map = document_info['blockMap']

print("="*60)
print("Harvester (种植机) Recipe Table Analysis")
print("="*60)

# Find the "基础模式" table
for block_id, block_data in block_map.items():
    if block_data.get('kind') == 'table' and '基础模式' in str(block_data.get('id', '')):
        table = block_data['table']
        print(f"\nTable ID: {block_id}")

        print(f"Row IDs: {table['rowIds']}")
        print(f"Column IDs: {table['columnIds']}")

        # Analyze cells
        print("\nCell Analysis:")
        for row_id in table['rowIds']:
            for col_id in table['columnIds']:
                cell_id = f"{row_id}_{col_id}"
                if cell_id in block_map:
                    cell_data = block_map[cell_id]
                    child_ids = cell_data.get('childIds', [])
                    print(f"\n{cell_id}:")
                    # Get first child
                    for child_id in child_ids:
                        if child_id in block_map:
                            child = block_map[child_id]
                            if child.get('kind') == 'text':
                                inline = child.get('text', {}).get('inlineElements', [])
                                for elem in inline:
                                    if elem.get('kind') == 'text':
                                        print(f"  Text: {elem['text']['text']}")
                                    elif elem.get('kind') == 'entry':
                                        entry = elem['entry']
                                        print(f"  Entry: id={entry['id']}, count={entry.get('count', '?')}")
    print("\n\n" + "="*60)
    print("Finding all recipe rows...")
    print("="*60)