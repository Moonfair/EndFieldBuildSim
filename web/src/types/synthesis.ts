export interface TableEntry {
  type: 'entry';
  id: string;
  count: string;
}

export interface TableText {
  type: 'text';
  text: string;
}

export type TableCell = TableEntry | TableText;

export interface SynthesisTableData {
  rows: number;
  columns: number;
  headers: TableCell[][];
  data: TableCell[][][];
}

export interface SynthesisTable {
  itemId: string;
  name: string;
  tables: SynthesisTableData[];
}
