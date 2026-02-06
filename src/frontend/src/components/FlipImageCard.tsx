import { useState } from 'react';
import type { ImageTransform } from '../hooks/useMediaDraft';

interface FlipImageCardProps {
  imageSrc: string;
  message: string;
  transform?: ImageTransform;
}

export default function FlipImageCard({ imageSrc, message, transform }: FlipImageCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleToggle = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      className="flip-card-container"
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? 'Showing message, tap to see image' : 'Showing image, tap to reveal message'}
    >
      <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
        {/* Front - Image */}
        <div className="flip-card-front">
          <div className="w-full h-full overflow-hidden">
            <img
              src={imageSrc}
              alt="Memory"
              className="w-full h-full object-cover"
              style={
                transform
                  ? {
                      transform: `scale(${transform.zoom}) translate(${transform.x / transform.zoom}px, ${transform.y / transform.zoom}px)`,
                      transformOrigin: 'center center',
                    }
                  : undefined
              }
              onError={(e) => {
                // Fallback for missing images
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23fecdd3" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23be123c"%3E💕%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-2 right-2 text-white text-xs bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
            Tap to reveal 💕
          </div>
        </div>

        {/* Back - Message */}
        <div className="flip-card-back">
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-center text-sm md:text-base leading-relaxed text-white">
              {message || 'A special memory just for you 💕'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
