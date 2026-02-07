import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Music } from 'lucide-react';
import { useMediaStore } from '../hooks/useMediaStore';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { songUrl } = useMediaStore();

  // Detect file type from URL or default to audio/mpeg
  const getAudioType = (url: string): string => {
    if (url.endsWith('.wav') || url.includes('audio/wav')) {
      return 'audio/wav';
    }
    if (url.endsWith('.mp3') || url.includes('audio/mpeg')) {
      return 'audio/mpeg';
    }
    // For blob URLs, try to infer or default to mpeg
    return 'audio/mpeg';
  };

  useEffect(() => {
    // Attempt autoplay muted on mount (mobile-compatible)
    const audio = audioRef.current;
    if (audio && songUrl) {
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
            // Autoplay blocked, silently fail
            setIsPlaying(false);
          });
      }
    }
  }, [songUrl]);

  // Reload audio when song changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && songUrl) {
      const wasPlaying = isPlaying;
      audio.load();
      if (wasPlaying) {
        audio.muted = false;
        audio.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            setIsPlaying(false);
          });
      }
    }
  }, [songUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !songUrl) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.muted = false;
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // Silently handle error
        });
    }
  };

  // If no song uploaded, show disabled state
  if (!songUrl) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-100 text-rose-400 rounded-full shadow-lg border-2 border-rose-200">
          <Music className="w-5 h-5" />
          <span className="text-xs font-medium">No song uploaded</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
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
        controls
        className="music-player-audio"
      >
        <source src={songUrl} type={getAudioType(songUrl)} />
      </audio>
    </div>
  );
}
