import { X } from 'lucide-react';
import { useTypingText } from '../hooks/useTypingText';

interface LoveLetterPopupProps {
  open: boolean;
  onClose: () => void;
}

const loveLetterText = `Hey ! Listen Kuttu 🐶 👸🏻 🧿 🌍 No Matter What , I'll be always with uh & I Will Never Ever Leave Ur Hand In Any Situation, I Promise Uh To Keep Always Happy And Smiling As U R My Bachha 🎀 👸🏻 🧿 And I Can Go At Extent For Uh And Ur Happiness 😘 😘 I Hope I Can Make You Feel As Valued And Loved As You Deserve. You're The Best Partner Anyone Could Ever Ask For. The Most Beautiful Girl In The World Genuinely And I Hope You Believe That Coz I Mean It With My Whole Heart And I Can't Wait To Marry You And Make Cute Little People With You.

You're Perfect For Me In Every Way, My Love 🐶🫀🌍 ,

Thank You For Taking The Risk🤌🏻 Of Loving 🤌🏻Me 🙇🏻🫂When It Wasn't Easy. You Stepped Into My World With Patience, Softness, And An Open Heart 😚. You Saw My Walls🥺, My Doubts🥺, My Quiet Fears🥺, And Still Chose To Stay🙇🏻. Your Love Feels Like Something Steady 🥰When My Mind Isn't🛐. It Reaches The Parts Of Me I Never Knew How To Explain🥺🤌🏻. I'm Grateful That You Chose Me, Even On The Days I Struggle To Choose Myself 🙇🏻`;

export default function LoveLetterPopup({ open, onClose }: LoveLetterPopupProps) {
  const { displayedText } = useTypingText(open ? loveLetterText : '', 20);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-4 border-rose-200/50 animate-in zoom-in duration-500">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-rose-400 to-pink-500 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            💌 My Love Letter To You
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="prose prose-rose max-w-none">
            <p className="text-rose-900 leading-relaxed whitespace-pre-wrap text-base md:text-lg">
              {displayedText}
              <span className="inline-block w-1 h-5 bg-rose-500 animate-pulse ml-1" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
