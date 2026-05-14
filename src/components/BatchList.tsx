import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Batch, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Calendar, Hash, Tag, ChevronRight } from 'lucide-react';
import { nanoid } from 'nanoid';

interface BatchListProps {
  user: UserProfile;
  onSelectBatch: (id: string) => void;
}

export default function BatchList({ user, onSelectBatch }: BatchListProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [initialChicks, setInitialChicks] = useState('');
  const [costPerChick, setCostPerChick] = useState('');
  const [breed, setBreed] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await api.getBatches();
      setBatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBatch({
        name,
        initialChicks: parseInt(initialChicks),
        costPerChick: parseFloat(costPerChick),
        breed,
        startDate: new Date(startDate).toISOString(),
        status: 'active'
      });
      setShowAddModal(false);
      resetForm();
      loadBatches();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setName('');
    setInitialChicks('');
    setCostPerChick('');
    setBreed('');
    setStartDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 uppercase">ব্যাচ সমূহ</h1>
          <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">আপনার খামারের সব ব্যাচের তালিকা</p>
        </div>
        {user.role === 'admin' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>নতুন ব্যাচ যোগ করুন</span>
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {batches.map(batch => (
          <button
            key={batch.id}
            onClick={() => onSelectBatch(batch.id)}
            className="group flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-stone-200 text-left hover:shadow-2xl hover:shadow-slate-100 transition-all hover:border-emerald-200"
          >
            <div className="flex gap-6 items-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${batch.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                🐔
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-1">{batch.name}</h3>
                <div className="flex items-center gap-4 text-stone-400 font-bold text-[10px] uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(batch.startDate).toLocaleDateString('bn-BD')}</span>
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {batch.initialChicks} টি</span>
                  <span className={`px-2 py-0.5 rounded-full ${batch.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                    {batch.status === 'active' ? 'সচল' : 'বন্ধ'}
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-stone-300 group-hover:translate-x-2 transition-transform" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">নতুন ব্যাচ</h2>
                <button onClick={() => setShowAddModal(false)} className="p-3 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddBatch} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">ব্যাচের নাম</label>
                    <input 
                      type="text" required placeholder="উদা: লেয়ার ব্যাচ ০১" 
                      value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full px-6 py-4 bg-stone-100 rounded-3xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">জাত / ব্রিড</label>
                    <input 
                      type="text" required placeholder="উদা: বয়লার" 
                      value={breed} onChange={(e) => setBreed(e.target.value)}
                      className="w-full px-6 py-4 bg-stone-100 rounded-3xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">মুরগির সংখ্যা</label>
                    <input 
                      type="number" required placeholder="১০০০" 
                      value={initialChicks} onChange={(e) => setInitialChicks(e.target.value)}
                      className="w-full px-6 py-4 bg-stone-100 rounded-3xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">প্রতিটির দাম (টাকা)</label>
                    <input 
                      type="number" required placeholder="৫০" 
                      value={costPerChick} onChange={(e) => setCostPerChick(e.target.value)}
                      className="w-full px-6 py-4 bg-stone-100 rounded-3xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">শুরুর তারিখ</label>
                  <input 
                    type="date" required 
                    value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-100 rounded-3xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl uppercase tracking-widest text-sm shadow-xl shadow-slate-200 mt-4 active:scale-95 transition-all"
                >
                  ব্যাচ শুরু করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
