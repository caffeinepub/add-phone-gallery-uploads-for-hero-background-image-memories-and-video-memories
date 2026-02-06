import { Sparkles } from 'lucide-react';

interface IntroPopupProps {
  open: boolean;
  onClose: () => void;
}

export default function IntroPopup({ open, onClose }: IntroPopupProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 rounded-3xl shadow-2xl p-8 max-w-sm w-full border-4 border-rose-200/50 animate-in zoom-in duration-500">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full shadow-lg animate-bounce">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-rose-900 leading-relaxed">
            Enter Our World 🌍 💕<br />
            Of Our Happiness
          </h2>

          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-rose-400 via-pink-500 to-rose-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Kuttu 🧿 🎀 🐶
          </button>
        </div>
      </div>
    </div>
  );
}
