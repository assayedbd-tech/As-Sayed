import { useEffect, useState } from 'react';
import { api, setAuthToken } from './lib/api';
import { UserProfile } from './types';
import { LayoutDashboard, LogOut, Bird, DollarSign, Package, PlusCircle, Phone, Lock, User, Store, Menu, X, Pill, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Dashboard from './components/Dashboard';
import BatchList from './components/BatchList';
import DailyLogForm from './components/DailyLogForm';
import BatchDetail from './components/BatchDetail';
import ExpenseList from './components/ExpenseList';
import MedicineGuidelines from './components/MedicineGuidelines';
import WorkerManagement from './components/WorkerManagement';
import UserApprovals from './components/UserApprovals';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'batches' | 'add-log' | 'batch-detail' | 'medicine' | 'workers' | 'approvals'>('dashboard');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'night'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'night') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auth States
  const [isRegistering, setIsRegistering] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [farmName, setFarmName] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const profile = await api.getMe();
        if (profile) setUser(profile);
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { user, token } = await api.login({ phoneNumber, password });
      setAuthToken(token);
      setUser(user);
    } catch (err: any) {
      console.error("Login failed:", err);
      const msg = JSON.parse(err.message);
      setError(msg.error || "লগইন ব্যর্থ হয়েছে। নাম্বার বা পাসওয়ার্ড চেক করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { user, token } = await api.register({ phoneNumber, password, name, farmName });
      setAuthToken(token);
      setUser(user);
    } catch (err: any) {
      console.error("Registration failed:", err);
      const msg = JSON.parse(err.message);
      setError(msg.error || "রেজিস্ট্রেশন ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setPhoneNumber('');
    setPassword('');
    setView('dashboard');
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-stone-200"
        >
          <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-600/20">
            <Bird className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter uppercase">এস পোল্টি</h1>
          <p className="text-slate-500 mb-8 font-bold text-sm">
            {isRegistering ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'আপনার অ্যাকাউন্টে লগইন করুন'}
          </p>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold mb-6 text-left border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input 
                    type="text"
                    required
                    placeholder="আপনার নাম"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-stone-100 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all border-none"
                  />
                </div>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input 
                    type="text"
                    placeholder="খামারের নাম (ঐচ্ছিক)"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-stone-100 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all border-none"
                  />
                </div>
              </>
            )}
            
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input 
                type="tel"
                required
                placeholder="মোবাইল নাম্বার (+880...)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-stone-100 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all border-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input 
                type="password"
                required
                placeholder="পাসওয়ার্ড"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-stone-100 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all border-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-black py-5 px-6 rounded-3xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-slate-200 uppercase tracking-widest text-sm"
            >
              {loading ? 'প্রসেস হচ্ছে...' : (isRegistering ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন')}
            </button>
          </form>

          <button 
            disabled={loading}
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="mt-8 text-stone-400 font-bold text-xs uppercase tracking-widest hover:text-emerald-600 transition-colors"
          >
            {isRegistering ? 'আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন' : 'অ্যাকাউন্ট নেই? রেজিস্ট্রেশন করুন'}
          </button>

          <div className="mt-8 pt-8 border-t border-stone-100">
            <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Phone className="w-3 h-3" /> প্রয়োজনে যোগাযোগ করুন
            </p>
            <p className="text-sm font-black text-slate-900 tracking-wider">
              +8801819251747
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const navigateToBatch = (id: string) => {
    setSelectedBatchId(id);
    setView('batch-detail');
  };

  return (
    <div className={`min-h-screen ${theme === 'night' ? 'dark bg-slate-950 text-white' : 'bg-stone-50 text-slate-900'} pb-24 md:pb-0 md:pl-72 transition-colors duration-300`}>
      <aside className={`hidden md:flex fixed left-0 top-0 bottom-0 w-72 ${theme === 'night' ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'} border-r flex-col p-8 z-50`}>
        <div className="flex items-center gap-4 mb-14">
          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <Bird className="w-7 h-7 text-white" />
          </div>
          <span className={`font-black text-2xl tracking-tighter uppercase italic ${theme === 'night' ? 'text-white' : 'text-slate-900'}`}>এস পোল্টি</span>
        </div>

        <nav className="flex-1 space-y-3">
          <NavItem active={view === 'dashboard'} icon={LayoutDashboard} label="এস পোল্টি ড্যাশবোর্ড" onClick={() => setView('dashboard')} />
          <NavItem active={view === 'batches'} icon={Package} label="ব্যাচ সমূহ" onClick={() => setView('batches')} />
          <NavItem active={view === 'add-log'} icon={PlusCircle} label="দৈনিক এন্ট্রি" onClick={() => setView('add-log')} />
          <NavItem active={view === 'medicine'} icon={Pill} label="ওষুধের গাইডলাইন" onClick={() => setView('medicine')} />
          {user.role === 'admin' ? (
            <>
              <NavItem active={view === 'workers'} icon={User} label="কর্মচারী ও বেতন" onClick={() => setView('workers')} />
              <NavItem active={view === 'approvals'} icon={ShieldCheck} label="ইউজার অনুমোদন" onClick={() => setView('approvals')} />
            </>
          ) : (
            <>
              <NavItem active={view === 'workers'} icon={User} label="আমার বেতন" onClick={() => setView('workers')} />
            </>
          )}
        </nav>

        <div className="pt-8 border-t border-stone-100 dark:border-slate-800">
          <div className="mb-6 grid grid-cols-2 gap-2 bg-stone-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button 
              onClick={() => setTheme('light')}
              className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-400'}`}
            >
              লাইট মোড
            </button>
            <button 
              onClick={() => setTheme('night')}
              className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'night' ? 'bg-slate-700 text-white shadow-sm' : 'text-stone-400'}`}
            >
              নাইট মোড
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 mb-6 bg-stone-100 dark:bg-slate-800 rounded-[2rem]">
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black border-2 border-white shadow-sm">
              {(user.name || 'U').charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-black text-sm truncate">{user.name}</p>
              <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest">{user.role === 'admin' ? 'এডমিন' : 'কর্মচারী'}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-4 px-6 py-4 text-stone-400 hover:text-slate-900 hover:bg-stone-50 rounded-2xl transition-all font-black uppercase tracking-widest text-xs">
            <LogOut className="w-5 h-5" />
            <span>লগ আউট</span>
          </button>
          
          <div className="mt-4 px-6 text-center">
            <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">এডমিন কন্টাক্ট</p>
            <p className="text-[11px] text-slate-800 font-bold tracking-tight">assayedbd@gmail.com</p>
            <p className="text-[11px] text-slate-800 font-bold tracking-tight">+8801819251747</p>
          </div>
        </div>
      </aside>

      <main className="p-6 md:p-12 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && <Dashboard key="dashboard" user={user} onSelectBatch={navigateToBatch} />}
          {view === 'batches' && <BatchList key="batches" user={user} onSelectBatch={navigateToBatch} />}
          {view === 'add-log' && <DailyLogForm key="add-log" user={user} onBack={() => setView('dashboard')} />}
          {view === 'batch-detail' && selectedBatchId && (
            <BatchDetail key="batch-detail" batchId={selectedBatchId} user={user} onBack={() => setView('batches')} />
          )}
          {view === 'medicine' && <MedicineGuidelines user={user} />}
          {view === 'workers' && <WorkerManagement user={user} />}
          {view === 'approvals' && <UserApprovals />}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[150] md:hidden"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`${theme === 'night' ? 'bg-slate-900 border-r border-slate-800' : 'bg-white shadow-2xl'} w-[80%] h-full p-8 flex flex-col`}
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <Bird className="w-8 h-8 text-emerald-600" />
                  <span className={`font-black text-xl tracking-tighter uppercase italic ${theme === 'night' ? 'text-white' : 'text-slate-900'}`}>এস পোল্টি</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className={`p-2 ${theme === 'night' ? 'bg-slate-800 text-white' : 'bg-stone-100'} rounded-full`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                <div className="mb-6 grid grid-cols-2 gap-2 bg-stone-100 dark:bg-slate-800 p-1 rounded-2xl">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-emerald-600'}`}
                  >
                    লাইট মোড
                  </button>
                  <button 
                    onClick={() => setTheme('night')}
                    className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'night' ? 'bg-slate-700 text-white shadow-sm' : 'text-stone-400'}`}
                  >
                    নাইট মোড
                  </button>
                </div>
                <NavItem 
                  active={view === 'dashboard'} 
                  icon={LayoutDashboard} 
                  label="এস পোল্টি ড্যাশবোর্ড" 
                  onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }} 
                />
                <NavItem 
                  active={view === 'batches'} 
                  icon={Package} 
                  label="ব্যাচ সমূহ" 
                  onClick={() => { setView('batches'); setIsMobileMenuOpen(false); }} 
                />
                <NavItem 
                  active={view === 'add-log'} 
                  icon={PlusCircle} 
                  label="দৈনিক এন্ট্রি" 
                  onClick={() => { setView('add-log'); setIsMobileMenuOpen(false); }} 
                />
                <NavItem 
                  active={view === 'medicine'} 
                  icon={Pill} 
                  label="ওষুধের গাইডলাইন" 
                  onClick={() => { setView('medicine'); setIsMobileMenuOpen(false); }} 
                />
                <NavItem 
                  active={view === 'workers'} 
                  icon={User} 
                  label={user.role === 'admin' ? "কর্মচারী ও বেতন" : "আমার বেতন"} 
                  onClick={() => { setView('workers'); setIsMobileMenuOpen(false); }} 
                />
                {user.role === 'admin' && (
                  <NavItem 
                    active={view === 'approvals'} 
                    icon={ShieldCheck} 
                    label="ইউজার অনুমোদন" 
                    onClick={() => { setView('approvals'); setIsMobileMenuOpen(false); }} 
                  />
                )}
              </nav>

              <div className="pt-8 border-t border-stone-100">
                <div className="flex items-center gap-4 p-4 mb-6 bg-stone-50 rounded-3xl">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-xs">
                    {(user.name || 'U').charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-black text-xs truncate">{user.name}</p>
                    <p className="text-[8px] text-stone-500 font-black uppercase tracking-widest">{user.role === 'admin' ? 'এডমিন' : 'কর্মচারী'}</p>
                  </div>
                </div>
                <button onClick={logout} className="w-full flex items-center gap-4 px-6 py-4 text-stone-400 hover:text-slate-900 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px]">
                  <LogOut className="w-4 h-4" />
                  <span>লগ আউট</span>
                </button>

                <div className="mt-4 px-6 text-center">
                  <p className="text-[8px] text-stone-400 font-black uppercase tracking-widest mb-1">এডমিন কন্টাক্ট</p>
                  <p className="text-[10px] text-slate-800 font-bold tracking-tight">assayedbd@gmail.com</p>
                  <p className="text-[10px] text-slate-800 font-bold tracking-tight">+8801819251747</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className={`md:hidden fixed bottom-0 left-0 right-0 ${theme === 'night' ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'} border-t flex justify-around items-end p-2 z-[100] pb-6`}>
        <MobileNavItem active={view === 'dashboard'} icon={LayoutDashboard} label="হোম" onClick={() => setView('dashboard')} theme={theme} />
        <MobileNavItem active={isMobileMenuOpen} icon={Menu} label="মেনু" onClick={() => setIsMobileMenuOpen(true)} theme={theme} />
        <PlusButton onClick={() => setView('add-log')} />
        <MobileNavItem active={view === 'batches'} icon={Package} label="ব্যাচ" onClick={() => setView('batches')} theme={theme} />
        <MobileNavItem active={false} icon={LogOut} label="আউট" onClick={logout} theme={theme} />
      </nav>
    </div>
  );
}

function NavItem({ active, icon: Icon, label, onClick, theme }: { active: boolean, icon: any, label: string, onClick: () => void, theme?: 'light' | 'night' }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-xs ${
        active 
          ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xl shadow-slate-200 dark:shadow-emerald-900/20' 
          : 'text-stone-400 hover:text-slate-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}

function MobileNavItem({ active, icon: Icon, label, onClick, theme }: { active: boolean, icon: any, label: string, onClick: () => void, theme?: 'light' | 'night' }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${active ? 'text-emerald-600 dark:text-emerald-500 bg-stone-100 dark:bg-slate-800' : 'text-stone-400'}`}>
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function PlusButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative -top-8 w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center shadow-2xl text-white border-4 border-stone-50 active:scale-95 transition-transform">
      <PlusCircle className="w-8 h-8" />
    </button>
  );
}
