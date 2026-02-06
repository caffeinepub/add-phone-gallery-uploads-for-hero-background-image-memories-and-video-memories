import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useMediaStore } from '../hooks/useMediaStore';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { songUrl } = useMediaStore();

  // Use uploaded song if available, otherwise fallback to default
  const audioSrc = songUrl || '/song.mp3';

  useEffect(() => {
    // Attempt autoplay muted on mount (mobile-compatible)
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.3;
      audio.muted = true;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Unmute after successful autoplay
            setTimeout(() => {
              audio.muted = false;
            }, 100);
            setIsPlaying(true);
          })
          .catch(() => {
            // Autoplay blocked, user will need to click play
            setIsPlaying(false);
          });
      }
    }
  }, []);

  // Reload audio when song changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const wasPlaying = isPlaying;
      audio.load();
      if (wasPlaying) {
        audio.muted = false;
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  }, [audioSrc]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.muted = false;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={togglePlay}
        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
        <Volume2 className="w-4 h-4" />
      </button>

      <audio
        ref={audioRef}
        loop
        preload="auto"
      >
        <source src={audioSrc} type="audio/mpeg" />
      </audio>
    </div>
  );
}
