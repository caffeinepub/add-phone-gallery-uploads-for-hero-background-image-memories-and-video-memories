import FlipImageCard from './FlipImageCard';
import { imageMemoryData } from '../config/imageMemory';
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
            const item = imageMemoryData.find((d) => d.id === slotId);
            if (!item) return null;

            // Use uploaded image if available, otherwise fallback to placeholder
            const imageSrc = imageUrls.get(item.id) || item.imageSrc;
            const transform = imageTransforms.get(item.id);

            return (
              <FlipImageCard
                key={item.id}
                imageSrc={imageSrc}
                message={item.message}
                transform={transform}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
