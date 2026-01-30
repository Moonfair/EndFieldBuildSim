export interface ItemBrief {
  cover: string;
  description?: { documentMap: Record<string, unknown> };
}

export interface ItemData {
  itemId: string;
  name?: string;
  brief?: ItemBrief;
  document?: { documentMap: Record<string, unknown> };
  mainType?: { name: string };
  subType?: { name: string };
}

export interface ItemResponse {
  code: number;
  message: string;
  data: { item: ItemData };
}
