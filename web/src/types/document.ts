export interface InlineText {
  kind: 'text';
  text: { text: string };
  bold?: boolean;
  color?: string;
}

export interface InlineEntry {
  kind: 'entry';
  entry: { id: string; showType: string; count: string };
}

export type InlineElement = InlineText | InlineEntry;

export interface TextBlock {
  id: string;
  kind: 'text';
  text: { inlineElements: InlineElement[]; kind: string };
  align?: string;
}

export interface ListBlock {
  id: string;
  kind: 'list';
  list: { type: string; blockIds: string[] };
}

export interface HorizontalLineBlock {
  id: string;
  kind: 'horizontalLine';
}

export type Block = TextBlock | ListBlock | HorizontalLineBlock;
