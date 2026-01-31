import json
import os
from pathlib import Path

script_dir = Path(__file__).parent
data_dir = script_dir

synthesis_dir = data_dir / 'synthesis_tables'
device_production_dir = data_dir / 'device_production_tables'

synthesis_files = sorted([f.name for f in synthesis_dir.glob('*.json') if f.is_file()])
device_production_files = sorted([f.name for f in device_production_dir.glob('*.json') if f.is_file()])

with open(data_dir / 'synthesis_tables_list.json', 'w') as f:
    json.dump(synthesis_files, f, indent=2)

with open(data_dir / 'device_production_tables_list.json', 'w') as f:
    json.dump(device_production_files, f, indent=2)

print(f'Generated synthesis_tables_list.json with {len(synthesis_files)} files')
print(f'Generated device_production_tables_list.json with {len(device_production_files)} files')
