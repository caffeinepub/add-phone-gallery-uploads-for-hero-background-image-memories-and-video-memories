import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { videoMemoryData } from '../config/videoMemory';
import { useMediaStore } from '../hooks/useMediaStore';
import { Button } from './ui/button';
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
          {videoMemoryData.map((item) => {
            // Use uploaded video if available, otherwise fallback to placeholder
            const videoSrc = videoUrls.get(item.id) || item.videoSrc;
            
            return (
              <div
                key={item.id}
                className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-rose-100"
              >
                <video
                  src={videoSrc}
                  loop
                  muted={isMuted}
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for missing videos
                    const target = e.target as HTMLVideoElement;
                    target.poster = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="711"%3E%3Crect fill="%23fecdd3" width="400" height="711"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="48" fill="%23be123c"%3E🎥%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
