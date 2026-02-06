import { X } from 'lucide-react';

interface ProposalPopupProps {
  open: boolean;
  onClose: () => void;
}

export default function ProposalPopup({ open, onClose }: ProposalPopupProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 rounded-3xl shadow-2xl max-w-lg w-full border-4 border-rose-200/50 animate-in zoom-in duration-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-400 to-pink-500 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h3 className="text-xl font-bold text-white">
            My Promise To You 💍
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center space-y-8">
          {/* Animated Ring */}
          <div className="relative inline-block">
            <div className="ring-animation">
              💍
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-rose-200/30 animate-ping" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <p className="text-2xl md:text-3xl font-bold text-rose-900 leading-relaxed">
              I'm Forever Your's,<br />
              Always Your's<br />
              and Endlessly Yours
            </p>
            <p className="text-3xl">
              💯 🫂 🧿 🥺 🐶 🙇🏻 ❤️
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Forever & Always 💖
          </button>
        </div>
      </div>
    </div>
  );
}
