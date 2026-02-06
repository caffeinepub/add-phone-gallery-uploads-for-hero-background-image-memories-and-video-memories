import { useState, useEffect } from 'react';
import LockScreen from './components/LockScreen';
import IntroPopup from './components/IntroPopup';
import HeroSection from './components/HeroSection';
import ImageMemorySection from './components/ImageMemorySection';
import VideoMemorySection from './components/VideoMemorySection';
import SurpriseSection from './components/SurpriseSection';
import MusicPlayer from './components/MusicPlayer';
import FloatingHearts from './components/FloatingHearts';
import RosePetals from './components/RosePetals';
import LoveLetterPopup from './components/LoveLetterPopup';
import ProposalPopup from './components/ProposalPopup';
import MediaManager from './components/MediaManager';
import { useSessionGate } from './hooks/useSessionGate';
import { MediaStoreProvider } from './context/MediaStoreContext';

function App() {
  const { isUnlocked, attemptUnlock } = useSessionGate();
  const [showIntro, setShowIntro] = useState(false);
  const [showLoveLetter, setShowLoveLetter] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [showMediaManager, setShowMediaManager] = useState(false);

  useEffect(() => {
    if (isUnlocked) {
      setShowIntro(true);
    }
  }, [isUnlocked]);

  const handleIntroClose = () => {
    setShowIntro(false);
  };

  if (!isUnlocked) {
    return <LockScreen onUnlock={attemptUnlock} />;
  }

  return (
    <MediaStoreProvider>
      <div className="relative min-h-screen bg-background overflow-x-hidden">
        {/* Ambient animations */}
        <FloatingHearts />
        <RosePetals />

        {/* Intro popup */}
        <IntroPopup open={showIntro} onClose={handleIntroClose} />

        {/* Main content - only shown after intro is dismissed */}
        {!showIntro && (
          <main className="relative z-10">
            <HeroSection onOpenMediaManager={() => setShowMediaManager(true)} />
            <ImageMemorySection />
            <VideoMemorySection />
            <SurpriseSection 
              onOpenLoveLetter={() => setShowLoveLetter(true)}
              onOpenProposal={() => setShowProposal(true)}
            />
            
            {/* Footer */}
            <footer className="py-8 px-4 text-center text-sm text-muted-foreground/80">
              <p className="flex items-center justify-center gap-2 flex-wrap">
                © 2026. Built with <span className="text-rose-500 animate-pulse">❤️</span> using{' '}
                <a 
                  href="https://caffeine.ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-rose-400 hover:text-rose-300 transition-colors underline"
                >
                  caffeine.ai
                </a>
              </p>
            </footer>
          </main>
        )}

        {/* Background music player */}
        <MusicPlayer />

        {/* Popups */}
        <LoveLetterPopup open={showLoveLetter} onClose={() => setShowLoveLetter(false)} />
        <ProposalPopup open={showProposal} onClose={() => setShowProposal(false)} />
        <MediaManager open={showMediaManager} onClose={() => setShowMediaManager(false)} />
      </div>
    </MediaStoreProvider>
  );
}

export default App;
