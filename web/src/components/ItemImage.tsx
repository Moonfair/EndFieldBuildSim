import { useState } from 'react';
import { getImagePath } from '../utils/imageUrl';

interface ItemImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ItemImage({ src, alt, className = '' }: ItemImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error) {
    return (
      <div className={className}>
        <img src={getImagePath("/placeholder.png")} alt="加载失败" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-xs text-gray-400">加载中...</span>
        </div>
      )}
      <img
        src={getImagePath(src)}
        alt={alt}
        loading="lazy"
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}
