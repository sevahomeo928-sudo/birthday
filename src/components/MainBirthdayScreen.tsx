import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import TiltCard from './TiltCard';
import PolaroidPile from './PolaroidPile';
import ConfettiCanvas from './ConfettiCanvas';
import MouseTrail from './MouseTrail';
import { BirthdayPerson, Sender, PolaroidImage, defaultBirthdayPerson, defaultSenders, defaultPolaroids } from '../types';

interface MainBirthdayScreenProps {
  adminOpen: boolean;
  onPlayAudio: (forceRestart?: boolean, timestamp?: number) => void;
}

const MainBirthdayScreen = ({ adminOpen, onPlayAudio }: MainBirthdayScreenProps) => {
  const [person, setPerson] = useState<BirthdayPerson>(defaultBirthdayPerson);
  const [senders, setSenders] = useState<Sender[]>(defaultSenders);
  const [polaroids, setPolaroids] = useState<PolaroidImage[]>(defaultPolaroids);
  const [displayedSenders, setDisplayedSenders] = useState<Sender[]>([]);
  const [theme, setTheme] = useState('classic');
  const [cameraActive, setCameraActive] = useState(true);
  const [counterValue, setCounterValue] = useState(0);

  // Load initial data from localStorage
  useEffect(() => {
    const loadData = () => {
      const savedPerson = localStorage.getItem('chaarYaarPerson');
      if (savedPerson) {
        const parsed = JSON.parse(savedPerson);
        setPerson(parsed);
      }

      const savedSenders = localStorage.getItem('chaarYaarSenders');
      if (savedSenders) {
        const parsed = JSON.parse(savedSenders);
        setSenders(parsed);
        setDisplayedSenders(parsed);
      }

      const savedTheme = localStorage.getItem('chaarYaarTheme');
      if (savedTheme) {
        setTheme(savedTheme);
      }

      const savedPolaroids = localStorage.getItem('chaarYaarPolaroids');
      if (savedPolaroids) {
        const parsed = JSON.parse(savedPolaroids);
        setPolaroids(parsed);
      }
    };

    loadData();
  }, []);

  // Listen for admin updates
  useEffect(() => {
    const handleAdminUpdate = () => {
      const savedPerson = localStorage.getItem('chaarYaarPerson');
      if (savedPerson) setPerson(JSON.parse(savedPerson));

      const savedSenders = localStorage.getItem('chaarYaarSenders');
      if (savedSenders) {
        const parsed = JSON.parse(savedSenders);
        setSenders(parsed);
        setDisplayedSenders(parsed);
      }

      const savedTheme = localStorage.getItem('chaarYaarTheme');
      if (savedTheme) setTheme(savedTheme);

      const savedPolaroids = localStorage.getItem('chaarYaarPolaroids');
      if (savedPolaroids) setPolaroids(JSON.parse(savedPolaroids));
    };

    window.addEventListener('friendsUpdated', handleAdminUpdate);
    window.addEventListener('themeUpdated', handleAdminUpdate);
    window.addEventListener('polaroidsUpdated', handleAdminUpdate);

    return () => {
      window.removeEventListener('friendsUpdated', handleAdminUpdate);
      window.removeEventListener('themeUpdated', handleAdminUpdate);
      window.removeEventListener('polaroidsUpdated', handleAdminUpdate);
    };
  }, []);

  return (
    <div className="min-h-screen aurora-bg font-sans text-slate-100 overflow-x-hidden relative selection:bg-cyan-500/30" data-theme={theme === 'retro' ? 'retro' : undefined}>
      <MouseTrail />
      <ConfettiCanvas />
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 space-y-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6 pt-8"
        >
          <motion.h1
            className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-br from-cyan-200 via-fuchsia-200 to-cyan-200 drop-shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
          >
            Happy Birthday
          </motion.h1>
          <motion.h2
            className="text-3xl md:text-5xl font-bold text-cyan-300/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {person.name}!
          </motion.h2>
          <motion.p
            className="text-base md:text-lg text-slate-300/60 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {person.birthDate}
          </motion.p>
          <motion.p
            className="text-sm md:text-base text-slate-400/80 italic max-w-3xl mx-auto leading-relaxed mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            {person.roastMessage}
          </motion.p>
        </motion.div>

        {/* Sender Cards */}
        <div className="space-y-6">
          <motion.h3
            className="text-2xl md:text-3xl font-bold text-center text-indigo-300/80 flex items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-400" />
            Messages from Chaar Yaar
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedSenders.map((sender, idx) => (
              <motion.div
                key={sender.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + idx * 0.1, duration: 0.6 }}
              >
                <TiltCard sender={sender} onPlayAudio={onPlayAudio} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Polaroid Pile */}
        {polaroids && polaroids.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          >
            <PolaroidPile images={polaroids} />
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          className="text-center pt-8 border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.6 }}
        >
          <p className="text-slate-400/60 text-sm">Created with 💜 by the Chaar Yaar</p>
        </motion.div>
      </div>
    </div>
  );
};

export default MainBirthdayScreen;