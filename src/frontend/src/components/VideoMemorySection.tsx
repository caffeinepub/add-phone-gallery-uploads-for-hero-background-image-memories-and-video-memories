import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Video } from 'lucide-react';
import { useMediaStore } from '../hooks/useMediaStore';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

export default function VideoMemorySection() {
  const { videoUrls } = useMediaStore();
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('videosMuted');
    return saved !== null ? saved === 'true' : true; // Default to muted for mobile autoplay
  });

  useEffect(() => {
    localStorage.setItem('videosMuted', String(isMuted));
  }, [isMuted]);

  return (
    <section className="relative py-12 px-4 bg-gradient-to-b from-pink-50 to-rose-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-rose-900">
            Our Video Memories 🎥 💕
          </h2>
          
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-rose-200">
            <Label htmlFor="video-sound" className="text-sm font-medium text-rose-900 cursor-pointer flex items-center gap-2">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">Sound</span>
            </Label>
            <Switch
              id="video-sound"
              checked={!isMuted}
              onCheckedChange={(checked) => setIsMuted(!checked)}
            />
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => i + 1).map((slotIndex) => {
            const videoUrl = videoUrls.get(slotIndex);
            
            if (!videoUrl) {
              // Empty state for missing slot
              return (
                <div
                  key={slotIndex}
                  className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-rose-100 border-2 border-rose-200 flex items-center justify-center"
                >
                  <div className="text-center text-rose-300">
                    <Video className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">No video uploaded for slot {slotIndex}</p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={slotIndex}
                className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-rose-100"
              >
                <video
                  src={videoUrl}
                  loop
                  muted={isMuted}
                  playsInline
                  controls
                  preload="auto"
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
