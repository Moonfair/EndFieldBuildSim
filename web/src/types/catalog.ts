export interface CatalogItem {
  itemId: string;
  name: string;
  image: string;
  type: 'device' | 'item';
  subTypeID?: string;
  subTypeName?: string;
}

export interface ItemLookup {
  [itemId: string]: CatalogItem;
}
