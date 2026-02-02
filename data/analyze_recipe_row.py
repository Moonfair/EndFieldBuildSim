import json, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
data = json.load(open('item_details/174.json', encoding='utf-8'))

doc_map = data['data']['item']['document']['documentMap']
table = doc_map['zuZtklWx']['blockMap']['sttxfX']
cell_map = table['table']['cellMap']
block_map = doc_map['zuZtklWx']['blockMap']

print('Row DxtS9H analysis:')
print('='*60)

for col in ['DDea9w', 'REgBH6', 'LoJ94M']:
    cell_id = f'DxtS9H_{col}'
    print(f'\n{cell_id}:')
    if cell_id in cell_map:
        cell = cell_map[cell_id]
        child_ids = cell.get('childIds', [])
        for child_id in child_ids:
            if child_id in block_map:
                child = block_map[child_id]
                kind = child.get('kind')
                if kind == 'text' and 'text' in child:
                    for elem in child['text']['inlineElements']:
                        if elem.get('kind') == 'text':
                            print(f'  Text: {elem["text"]["text"]}')
                        elif elem.get('kind') == 'entry':
                            entry = elem['entry']
                            print(f'  Entry: id={entry["id"]}, count={entry.get("count", "?")}')

print('\n\nAll rows summary:')
print('='*60)
row_ids = table['table']['rowIds']
col_ids = table['table']['columnIds']
for i, row_id in enumerate(row_ids):
    print(f'\nRow {i}: {row_id}')
    row_data = {}
    for col_id in col_ids:
        cell_id = f'{row_id}_{col_id}'
        if cell_id in cell_map:
            child_ids = cell_map[cell_id].get('childIds', [])
            if child_ids:
                child_id = child_ids[0]
                if child_id in block_map:
                    child = block_map[child_id]
                    if child.get('kind') == 'text' and 'text' in child:
                        for elem in child['text']['inlineElements']:
                            if elem.get('kind') == 'text':
                                row_data[col_id] = 'text:' + elem['text']['text']
                            elif elem.get('kind') == 'entry':
                                row_data[col_id] = f'entry:{elem["entry"]["id"]}'
                elif child.get('kind') == 'text' and 'text' in child:
                    for elem in child['text']['inlineElements']:
                        if elem.get('kind') == 'text':
                            row_data[col_id] = 'text:' + elem['text']['text']
    if row_data:
        print(f'  {row_data}')