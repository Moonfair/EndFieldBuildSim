import { readFileSync } from 'fs';

const itemLookup = JSON.parse(readFileSync('./public/data/item_lookup.json', 'utf-8'));
console.log('Item 549:', itemLookup['549']);
console.log('Item 549 has recipes?', itemLookup['549'] ? 'yes' : 'no');
