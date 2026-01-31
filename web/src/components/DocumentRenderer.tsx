import type { Block, TextBlock, ListBlock, InlineElement } from '../types/document';
import type { ItemLookup } from '../types/catalog';

interface DocumentRendererProps {
  blocks: Block[];
  blockMap: Record<string, Block>;
  itemLookup?: ItemLookup;
}

interface InlineElementRendererProps {
  element: InlineElement;
  itemLookup?: ItemLookup;
}

function InlineElementRenderer({ element, itemLookup }: InlineElementRendererProps) {
  if (element.kind === 'text') {
    const style: React.CSSProperties = {
      fontWeight: element.bold ? 'bold' : 'normal',
      color: element.color || 'inherit',
    };
    return <span style={style}>{element.text.text}</span>;
  }

  if (element.kind === 'entry') {
    const { id, count } = element.entry;
    const item = itemLookup?.[id];
    const displayText = item ? item.name : `[${id}]`;
    const countText = count !== '0' ? ` x${count}` : '';

    return (
      <a
        href={`#/item/${id}`}
        className="text-blue-600 hover:text-blue-800 underline"
        data-entry-id={id}
      >
        {displayText}
        {countText}
      </a>
    );
  }

  return null;
}

interface TextBlockRendererProps {
  block: TextBlock;
  itemLookup?: ItemLookup;
}

function TextBlockRenderer({ block, itemLookup }: TextBlockRendererProps) {
  const alignClass =
    block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : '';

  return (
    <p className={`mb-2 ${alignClass}`}>
      {block.text.inlineElements.map((element, index) => (
        <InlineElementRenderer key={index} element={element} itemLookup={itemLookup} />
      ))}
    </p>
  );
}

interface ListBlockRendererProps {
  block: ListBlock;
  blockMap: Record<string, Block>;
  itemLookup?: ItemLookup;
}

function ListBlockRenderer({ block, blockMap, itemLookup }: ListBlockRendererProps) {
  const ListTag = block.list.type === 'ordered' ? 'ol' : 'ul';
  const listClass = block.list.type === 'ordered' ? 'list-decimal' : 'list-disc';

  // Handle both blockIds format (standard) and itemIds/itemMap format (alternative)
  const childIds = block.list.blockIds || (block.list as any).itemIds || [];
  const itemMap = (block.list as any).itemMap;

  return (
    <ListTag className={`${listClass} ml-6 mb-2`}>
      {childIds.map((childId: string) => {
        // For itemIds format, get the child block IDs from itemMap
        if (itemMap && itemMap[childId]) {
          const item = itemMap[childId];
          const childBlockIds = item.childIds || [];
          
          return (
            <li key={childId} className="mb-1">
              {childBlockIds.map((blockId: string) => {
                const childBlock = blockMap[blockId];
                if (!childBlock) return null;
                return (
                  <BlockRenderer key={blockId} block={childBlock} blockMap={blockMap} itemLookup={itemLookup} />
                );
              })}
            </li>
          );
        }

        // For blockIds format, render the block directly
        const childBlock = blockMap[childId];
        if (!childBlock) return null;

        return (
          <li key={childId} className="mb-1">
            <BlockRenderer block={childBlock} blockMap={blockMap} itemLookup={itemLookup} />
          </li>
        );
      })}
    </ListTag>
  );
}

interface BlockRendererProps {
  block: Block;
  blockMap: Record<string, Block>;
  itemLookup?: ItemLookup;
}

function BlockRenderer({ block, blockMap, itemLookup }: BlockRendererProps) {
  switch (block.kind) {
    case 'text':
      return <TextBlockRenderer block={block} itemLookup={itemLookup} />;
    case 'list':
      return <ListBlockRenderer block={block} blockMap={blockMap} itemLookup={itemLookup} />;
    case 'horizontalLine':
      return <hr className="my-4 border-gray-300" />;
    default:
      return null;
  }
}

export default function DocumentRenderer({ blocks, blockMap, itemLookup }: DocumentRendererProps) {
  return (
    <div className="prose max-w-none">
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} blockMap={blockMap} itemLookup={itemLookup} />
      ))}
    </div>
  );
}
