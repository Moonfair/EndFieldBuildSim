import type { SynthesisTable as SynthesisTableType, TableCell } from '../types/synthesis';
import type { ItemLookup } from '../types/catalog';
import ItemImage from './ItemImage';

interface SynthesisTableProps {
  table: SynthesisTableType;
  itemLookup?: ItemLookup;
}

interface TableCellRendererProps {
  cells: TableCell[];
  itemLookup?: ItemLookup;
  columnIndex: number;
}

function TableCellRenderer({ cells, itemLookup, columnIndex }: TableCellRendererProps) {
  if (cells.length === 0) {
    return <td className="border border-gray-300 p-2 text-center text-gray-400">-</td>;
  }

  return (
    <td className="border border-gray-300 p-2">
      <div className="flex flex-col gap-2">
        {cells.map((cell, index) => {
          if (cell.type === 'text') {
            return (
              <div key={index} className="text-sm">
                {cell.text}
              </div>
            );
          }

          if (cell.type === 'entry') {
            const item = itemLookup?.[cell.id];
            const countText = cell.count !== '0' ? `x${cell.count}` : '';
            const isDeviceColumn = columnIndex === 0;
            const linkPath = isDeviceColumn ? `/device/${cell.id}` : `/item/${cell.id}`;

            return (
              <a
                key={index}
                href={`#${linkPath}`}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 transition-colors"
                data-entry-id={cell.id}
              >
                {item && (
                  <>
                    <ItemImage src={item.image} alt={item.name} className="w-8 h-8 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      {countText && <div className="text-xs text-gray-500">{countText}</div>}
                    </div>
                  </>
                )}
                {!item && (
                  <div className="text-sm text-gray-400">
                    [{cell.id}] {countText}
                  </div>
                )}
              </a>
            );
          }

          return null;
        })}
      </div>
    </td>
  );
}

export default function SynthesisTable({ table, itemLookup }: SynthesisTableProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">{table.name} - 合成设备</h3>
      
      {table.tables.map((tableData, tableIndex) => (
        <div key={tableIndex} className="overflow-x-auto mb-6">
          <table className="min-w-full border-collapse border border-gray-300 bg-white">
            <thead className="bg-gray-100">
              <tr>
                {tableData.headers.map((headerCells, colIndex) => (
                  <th key={colIndex} className="border border-gray-300 p-3 text-left font-semibold">
                    {headerCells.map((cell, cellIndex) => {
                      if (cell.type === 'text') {
                        return <div key={cellIndex}>{cell.text}</div>;
                      }
                      return null;
                    })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {row.map((cells, colIndex) => (
                    <TableCellRenderer key={colIndex} cells={cells} itemLookup={itemLookup} columnIndex={colIndex} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
