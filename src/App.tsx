import { useState, useEffect, useCallback } from 'react';
import TrollSequence from './components/TrollSequence';
import MainBirthdayScreen from './components/MainBirthdayScreen';
import AdminPanel from './components/AdminPanel';

// A singleton audio instance to ensure seamless playback across component unmounts/remounts
export const globalAudio = new Audio('/troll.mp3');
globalAudio.loop = false;
globalAudio.preload = 'auto';

globalAudio.addEventListener('error', () => {
  // Fallback if local file fails (e.g. 0 bytes or not found)
  if (globalAudio.src.endsWith('troll.mp3')) {
    globalAudio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    globalAudio.play().catch(() => {});
  }
});

export default function App() {
  const [showMain, setShowMain] = useState(() => window.location.pathname === '/admin');
  const [adminOpen, setAdminOpen] = useState(() => window.location.pathname === '/admin');
  const [adminTaps, setAdminTaps] = useState(0);

  const playAudio = useCallback((forceRestart = false, timestamp = 0) => {
    if (forceRestart) {
      globalAudio.currentTime = timestamp;
    }
    if (globalAudio.paused) {
      globalAudio.volume = 1.0;
      globalAudio.play().catch(e => console.log('Audio error:', e));
    } else if (forceRestart) {
      globalAudio.currentTime = timestamp;
    }
  }, []);

  useEffect(() => {
    const checkAdminRoute = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setShowMain(true);
        setAdminOpen(true);
      }
    };
    
    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    
    // Initialize theme — fetch from API, fall back to localStorage
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        if (data.theme === 'retro') {
          document.documentElement.setAttribute('data-theme', 'retro');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem('chaarYaarTheme', data.theme);
      })
      .catch(() => {
        const savedTheme = localStorage.getItem('chaarYaarTheme');
        if (savedTheme === 'retro') {
          document.documentElement.setAttribute('data-theme', 'retro');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      });
    
    const handleStorage = () => {
      const theme = localStorage.getItem('chaarYaarTheme');
      if (theme === 'retro') {
        document.documentElement.setAttribute('data-theme', 'retro');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('themeUpdated', handleStorage);
    
    return () => {
      window.removeEventListener('popstate', checkAdminRoute);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('themeUpdated', handleStorage);
    };
  }, []);

  const handleFooterTap = () => {
    const newTaps = adminTaps + 1;
    setAdminTaps(newTaps);
    if (newTaps >= 5) {
      setAdminOpen(true);
      setAdminTaps(0);
    }
  };

  return (
    <div className="min-h-screen aurora-bg font-sans text-slate-100 overflow-x-hidden relative selection:bg-cyan-500/30">
      {!showMain ? (
        <TrollSequence onComplete={() => setShowMain(true)} onPlayAudio={playAudio} />
      ) : (
        <>
          <MainBirthdayScreen adminOpen={adminOpen} onPlayAudio={playAudio} />
          
          {/* Subtle Admin Footer Link - Requires 5 Taps */}
          <div className="fixed bottom-0 right-2 p-4 z-40 pointer-events-auto">
             <button 
                onClick={handleFooterTap}
                className="px-4 py-3 opacity-0 cursor-default"
                title="Admin Access"
                aria-label="Admin Access"
             >
                <div className="w-1 h-1 bg-transparent" />
             </button>
          </div>
          
          <AdminPanel isOpen={adminOpen} onClose={() => setAdminOpen(false)} />
        </>
      )}
    </div>
  );
}
