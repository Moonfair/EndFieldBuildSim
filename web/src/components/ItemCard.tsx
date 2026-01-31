import { Link } from 'react-router-dom';
import type { CatalogItem } from '../types/catalog';
import ItemImage from './ItemImage';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item: CatalogItem;
  subType?: string;
}

export default function ItemCard({ item, subType }: ItemCardProps) {
  return (
    <Link to={`/item/${item.itemId}`} className="block">
      <div
        className="relative bg-white rounded-card shadow-card overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover border-2 border-transparent hover:border-primary p-4"
        data-testid={`item-card-${item.itemId}`}
      >
        {subType && (
          <span className={cn(
            "absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full text-white",
            subType === "设备" ? "bg-badge-device" : "bg-badge-item"
          )}>
            {subType}
          </span>
        )}
        
        <div className="w-24 h-24 mx-auto aspect-square">
          <ItemImage src={item.image} alt={item.name} className="w-full h-full" />
        </div>
        
        <h3 className="text-center text-sm mt-3 font-medium truncate">{item.name}</h3>
      </div>
    </Link>
  );
}
