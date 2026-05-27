import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Save, LogOut } from 'lucide-react';
import { BirthdayPerson, Sender, defaultBirthdayPerson, defaultSenders } from '../types';

export default function AdminPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [person, setPerson] = useState<BirthdayPerson>(defaultBirthdayPerson);
  const [senders, setSenders] = useState<Sender[]>(defaultSenders);
  const [theme, setTheme] = useState<'classic' | 'retro'>('classic');

  useEffect(() => {
    if (localStorage.getItem('chaarYaarAdminAuth') === 'true') {
      setIsAuthenticated(true);
    }

    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        setPerson(data.person);
        setSenders(data.senders);
        setTheme(data.theme === 'retro' ? 'retro' : 'classic');
        localStorage.setItem('chaarYaarPerson', JSON.stringify(data.person));
        localStorage.setItem('chaarYaarSenders', JSON.stringify(data.senders));
        localStorage.setItem('chaarYaarTheme', data.theme);
      })
      .catch(() => {
        const savedPerson = localStorage.getItem('chaarYaarPerson');
        if (savedPerson) setPerson(JSON.parse(savedPerson));
        const savedSenders = localStorage.getItem('chaarYaarSenders');
        if (savedSenders) setSenders(JSON.parse(savedSenders));
        const savedTheme = localStorage.getItem('chaarYaarTheme');
        if (savedTheme === 'retro' || savedTheme === 'classic') setTheme(savedTheme);
      });
  }, [isOpen]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'mag85158' && password === 'magadmin') {
      setIsAuthenticated(true);
      setError('');
      localStorage.setItem('chaarYaarAdminAuth', 'true');
    } else {
      setError('System Access Denied. Invalid credentials.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    localStorage.removeItem('chaarYaarAdminAuth');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person, senders, theme }),
      });
    } catch {
      // fall through to local update even if server fails
    }
    localStorage.setItem('chaarYaarPerson', JSON.stringify(person));
    localStorage.setItem('chaarYaarSenders', JSON.stringify(senders));
    localStorage.setItem('chaarYaarTheme', theme);
    window.dispatchEvent(new Event('friendsUpdated'));
    window.dispatchEvent(new Event('themeUpdated'));
    setSaving(false);
    onClose();
  };

  const updateSender = (id: string, field: keyof Sender, value: string) => {
    setSenders(senders.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 pointer-events-auto"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-4xl glass-panel neon-border flex flex-col max-h-[90vh] rounded-3xl"
          >
            <div className="flex justify-between items-center p-5 border-b border-white/10 bg-slate-900/40 rounded-t-3xl">
              <h2 className="text-xl font-bold flex items-center gap-3 text-white tracking-wide">
                <Lock className="w-5 h-5 text-cyan-400" />
                Admin Protocol Terminal
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                 <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto">
              {!isAuthenticated ? (
                <form onSubmit={handleLogin} className="space-y-5 max-w-sm mx-auto my-12 bg-slate-900/50 p-8 rounded-xl border border-slate-800">
                  <div className="text-center space-y-2 mb-6">
                    <Lock className="w-10 h-10 text-indigo-500/50 mx-auto" />
                    <p className="text-slate-400 text-sm">Please authenticate to continue</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono tracking-widest text-slate-400 uppercase">Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-md px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="Enter admin ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono tracking-widest text-slate-400 uppercase">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-md px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  {error && (
                    <div className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 p-3 rounded font-mono">
                      {error}
                    </div>
                  )}
                  <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-md transition-colors shadow-lg shadow-cyan-500/20 mt-6 !mt-8">
                    Authenticate
                  </button>
                </form>
              ) : (
                <div className="space-y-10">
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 drop-shadow flex-wrap gap-4">
                    <p className="text-cyan-100/80 text-sm font-medium">Configure deployed parameters below. Changes are saved globally for all visitors.</p>
                    <div className="flex items-center gap-4">
                      <select 
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as 'classic' | 'retro')}
                        className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="classic">Theme: Classic Cyan</option>
                        <option value="retro">Theme: Retro Green</option>
                      </select>
                      <button onClick={handleLogout} className="text-sm font-bold text-rose-400 hover:text-rose-300 flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 rounded-lg transition-colors border border-rose-500/20 whitespace-nowrap">
                        <LogOut className="w-4 h-4" /> Lock Terminal
                      </button>
                    </div>
                  </div>
                  
                  {/* Spotlight Person Configuration */}
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-fuchsia-500" />
                      Targeted Birthday Person
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/30 p-6 rounded-xl border border-slate-800/60">
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Name</label>
                        <input 
                          type="text"
                          value={person.name}
                          onChange={(e) => setPerson({...person, name: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Date Highlight</label>
                        <input 
                          type="text"
                          value={person.birthDate}
                          onChange={(e) => setPerson({...person, birthDate: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                          placeholder="e.g. March 14th"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Main Roast / Birthday Message</label>
                        <textarea 
                          value={person.roastMessage}
                          onChange={(e) => setPerson({...person, roastMessage: e.target.value})}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                          placeholder="Type a funny roast message..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Senders Configuration */}
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      The Senders (Chaar Yaar)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {senders.map((sender) => (
                        <div key={sender.id} className="bg-slate-900/30 p-5 rounded-xl border border-slate-800/60 space-y-4">
                          <h4 className="font-semibold text-indigo-300/80 text-sm tracking-wide">
                            Sender #{sender.id}
                            {sender.special === 'CS' && <span className="ml-2 text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">CS</span>}
                          </h4>
                          <div className="space-y-2">
                            <label className="text-xs text-slate-500">Name</label>
                            <input 
                              type="text"
                              value={sender.name}
                              onChange={(e) => updateSender(sender.id, 'name', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-slate-500">Card Theme</label>
                            <select
                              value={sender.special}
                              onChange={(e) => updateSender(sender.id, 'special', e.target.value as 'CS' | 'None')}
                              className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            >
                              <option value="None">Normal Theme</option>
                              <option value="CS">Hacker Terminal Theme</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-slate-500">{sender.special === 'CS' ? 'Terminal Output Message' : 'Message'}</label>
                            <textarea 
                              value={sender.message}
                              onChange={(e) => updateSender(sender.id, 'message', e.target.value)}
                              rows={sender.special === 'CS' ? 3 : 2}
                              className={`w-full bg-slate-950 border border-slate-700/80 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed ${sender.special === 'CS' ? 'font-mono text-green-400' : ''}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Footer Actions */}
                  <div className="flex justify-end pt-6 border-t border-slate-800/80 sticky bottom-0 bg-[#0b1120] pb-2 z-10">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white px-8 py-3 rounded-lg transition-colors shadow-[0_0_20px_rgba(5,150,105,0.2)] hover:shadow-[0_0_25px_rgba(5,150,105,0.4)] font-bold tracking-wide"
                    >
                      <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Deploy Saved Data'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
