export interface CatalogItem {
  itemId: string;
  name: string;
  image: string;
  subTypeID: string;
  subTypeName: string;
}

export interface ItemLookup {
  [itemId: string]: CatalogItem;
}
