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
      aria-pressed={isFlipped}
    >
      <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
        {/* Front - Image */}
        <div className="flip-card-front">
          <div className="flip-card-image-container">
            <img
              src={imageSrc}
              alt="Memory"
              className="flip-card-image"
              loading="eager"
              style={
                transform
                  ? {
                      transform: `scale(${transform.zoom}) translate(${transform.x / transform.zoom}px, ${transform.y / transform.zoom}px)`,
                      transformOrigin: 'center center',
                    }
                  : undefined
              }
            />
          </div>
          <div className="flip-card-overlay" />
          <div className="flip-card-hint">
            Tap to reveal 💕
          </div>
        </div>

        {/* Back - Message */}
        <div className="flip-card-back">
          <div className="flip-card-message-container">
            <p className={`flip-card-message ${isFlipped ? 'fade-in' : ''}`}>
              {message || 'A special memory just for you 💕'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
