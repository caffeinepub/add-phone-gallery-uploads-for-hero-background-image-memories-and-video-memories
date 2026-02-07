import { useState } from 'react';
import { Heart } from 'lucide-react';

interface LockScreenProps {
  onUnlock: (password: string) => boolean;
}

const loginEmojis = ['🐶', '🧿', '🎀', '🫂', '❤️', '🌹', '🛐', '🌍'];

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onUnlock(password);
    
    if (!success) {
      setError('Incorrect password. Try again! 💕');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-rose-100 via-pink-50 to-rose-50">
      {/* Floating blinking emojis */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {loginEmojis.map((emoji, index) => (
          <div
            key={index}
            className="login-emoji"
            style={{
              left: `${(index * 12.5) + 5}%`,
              animationDelay: `${index * 0.3}s`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-rose-200/50 ${isShaking ? 'animate-shake' : ''}`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full mb-4 shadow-lg">
              <Heart className="w-10 h-10 text-white fill-white animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-rose-900 mb-2">
              Welcome 🧿 🎀
            </h1>
            <p className="text-rose-700 text-sm">
              Enter the password to unlock our world 🌍 💕
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-2xl border-2 border-rose-200 focus:border-rose-400 focus:outline-none text-center text-lg tracking-wider bg-white/50 backdrop-blur-sm transition-all"
                autoFocus
              />
              {error && (
                <p className="text-rose-600 text-sm mt-2 text-center animate-pulse">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
            >
              Unlock 💖
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-rose-400 flex items-center justify-center gap-1">
              <span className="animate-pulse">🐶</span>
              <span className="animate-pulse delay-100">🧿</span>
              <span className="animate-pulse delay-200">🎀</span>
              <span className="animate-pulse delay-300">👸🏻</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
