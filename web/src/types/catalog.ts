export interface CatalogItem {
  itemId: string;
  name: string;
  image: string;
}

export interface ItemLookup {
  [itemId: string]: CatalogItem;
}
