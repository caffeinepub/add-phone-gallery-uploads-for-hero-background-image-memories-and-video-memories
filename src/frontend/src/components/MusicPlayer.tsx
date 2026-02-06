import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useMediaStore } from '../hooks/useMediaStore';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTapPrompt, setShowTapPrompt] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { songUrl } = useMediaStore();

  // Use uploaded song if available, otherwise fallback to default
  const audioSrc = songUrl || '/song.mp3';

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
            setShowTapPrompt(false);
          })
          .catch(() => {
            // Autoplay blocked, show tap prompt
            setIsPlaying(false);
            setShowTapPrompt(true);
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
        audio.play()
          .then(() => {
            setIsPlaying(true);
            setShowTapPrompt(false);
          })
          .catch(() => {
            setIsPlaying(false);
            setShowTapPrompt(true);
          });
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
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setShowTapPrompt(false);
        })
        .catch(() => {
          setShowTapPrompt(true);
        });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showTapPrompt && !isPlaying && (
        <div className="absolute bottom-full right-0 mb-2 bg-rose-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap animate-bounce">
          Tap to start music 🎵
        </div>
      )}
      
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
        <source src={audioSrc} type={getAudioType(audioSrc)} />
      </audio>
    </div>
  );
}
