import { Image } from 'lucide-react';
import FlipImageCard from './FlipImageCard';
import { romanticMessages } from '../config/romanticMessages';
import { useMediaStore } from '../hooks/useMediaStore';

export default function ImageMemorySection() {
  const { imageUrls, imageOrder, imageTransforms } = useMediaStore();

  return (
    <section className="relative py-12 px-4 bg-gradient-to-b from-rose-50 to-pink-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-rose-900 mb-8">
          Our Beautiful Memories 🧿 🎀 💕
        </h2>
        <p className="text-center text-rose-700 mb-8">
          Tap any photo to reveal a special message 💖
        </p>

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imageOrder.map((slotId) => {
            const imageUrl = imageUrls.get(slotId);
            const transform = imageTransforms.get(slotId);
            const message = romanticMessages[(slotId - 1) % romanticMessages.length];

            if (!imageUrl) {
              // Empty state for missing slot
              return (
                <div
                  key={slotId}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-rose-100 border-2 border-rose-200 flex items-center justify-center"
                >
                  <div className="text-center text-rose-300">
                    <Image className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">No image uploaded</p>
                  </div>
                </div>
              );
            }

            return (
              <FlipImageCard
                key={slotId}
                imageSrc={imageUrl}
                message={message}
                transform={transform}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
