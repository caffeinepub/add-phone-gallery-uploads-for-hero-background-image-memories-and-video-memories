import { Heart, Sparkles } from 'lucide-react';

interface SurpriseSectionProps {
  onOpenLoveLetter: () => void;
  onOpenProposal: () => void;
}

export default function SurpriseSection({ onOpenLoveLetter, onOpenProposal }: SurpriseSectionProps) {
  return (
    <section className="relative py-16 px-4 bg-gradient-to-b from-rose-50 via-pink-100 to-rose-100">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold text-rose-900 mb-4">
          Special Surprises For You 🎁 💕
        </h2>

        <div className="space-y-4">
          {/* Love Letter Button */}
          <button
            onClick={onOpenLoveLetter}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-3xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Heart className="w-6 h-6 fill-white" />
            Read My Love Letter 💌
          </button>

          {/* Proposal Button */}
          <button
            onClick={onOpenProposal}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-3xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Sparkles className="w-6 h-6" />
            A Special Promise 💍
          </button>
        </div>
      </div>
    </section>
  );
}
