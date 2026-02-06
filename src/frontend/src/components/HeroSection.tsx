import { Sparkles, Upload } from 'lucide-react';
import { useMediaStore } from '../hooks/useMediaStore';
import { Button } from './ui/button';

interface HeroSectionProps {
  onOpenMediaManager?: () => void;
}

export default function HeroSection({ onOpenMediaManager }: HeroSectionProps) {
  const { heroBackgroundUrl } = useMediaStore();

  // Use uploaded background if available, otherwise fallback to placeholder
  const backgroundImage = heroBackgroundUrl ? `url(${heroBackgroundUrl})` : 'url(/hero-bg.jpg)';

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-rose-900/40 via-pink-900/30 to-rose-900/50" />
      </div>

      {/* Media Manager Button */}
      {onOpenMediaManager && (
        <div className="absolute top-4 right-4 z-20">
          <Button
            onClick={onOpenMediaManager}
            variant="outline"
            size="sm"
            className="bg-white/90 hover:bg-white text-rose-900 border-rose-300 shadow-lg"
            aria-label="Manage Hero background, Images, Videos, and Song"
          >
            <Upload className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Media</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-4 py-12 space-y-6">
        <div className="inline-flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-rose-300 animate-pulse" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">
          Happy Birthday<br />
          My Woman 🧿 🎀<br />
          Bangaaaraaa 🫂 🫀 ❤️
        </h1>

        <div className="space-y-3 text-white text-lg md:text-xl font-medium drop-shadow-md">
          <p className="leading-relaxed">
            Renu 🧿🎀👸🏻🫂<br />
            Bachha 🎀👸🏻🧿🌍<br />
            Idiotu ❤️🧿🫂👸🏻🌍🫀<br />
            Bangara 🤍👑🌍🥹💋🫂❤️‍🩹🍻🫶🏻<br />
            Everything 🧿🎀💟🤍😘<br />
            Kuttu 🐶👸🏻🧿🌍<br />
            Maa 🤌🏻🥺🫂
          </p>
        </div>

        <div className="pt-4 space-y-4 text-rose-100 text-base md:text-lg drop-shadow-md">
          <p className="font-semibold">
            You Are Mine 🧿 🎀<br />
            Today, My Tomorrow, My Forever 🛐🐶👑
          </p>
          <p className="font-semibold">
            I Love You Endlessly<br />
            Pajili Jaan Ammu Kuttu 🧿 🌹💕🧿🎀🐶👑
          </p>
          <p className="text-sm md:text-base leading-relaxed px-4">
            As Uh Are Completing Ur 19teen Age & U R Entering in 20s,<br />
            So By This Birthday U R 20s so,<br />
            Wishing You A Lovely Birthday<br />
            To My Life Partner 🥰 🫂 🫀 🎀 🧿 👸🏻
          </p>
        </div>

        <div className="pt-6 flex justify-center gap-2">
          <span className="text-3xl animate-bounce">💖</span>
          <span className="text-3xl animate-bounce delay-100">✨</span>
          <span className="text-3xl animate-bounce delay-200">💖</span>
        </div>
      </div>
    </section>
  );
}
