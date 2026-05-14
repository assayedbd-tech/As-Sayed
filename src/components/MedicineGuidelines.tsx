import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { MedicineGuideline, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, ShieldCheck, Clock, FileText, X } from 'lucide-react';

interface MedicineGuidelinesProps {
  user: UserProfile;
}

export default function MedicineGuidelines({ user }: MedicineGuidelinesProps) {
  const [guidelines, setGuidelines] = useState<MedicineGuideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getMedicineGuidelines();
      setGuidelines(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMedicineGuideline({ title, description });
      setTitle('');
      setDescription('');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই গাইডলাইনটি ডিলিট করতে চান?')) return;
    try {
      await api.deleteMedicineGuideline(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">ওষুধের গাইডলাইন</h1>
          <p className="text-stone-500 font-bold uppercase tracking-widest text-xs mt-2">কর্মচারীদের জন্য প্রয়োজনীয় ওষুধের তালিকা ও ব্যবহারবিধি</p>
        </div>
        {user.role === 'admin' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-200 active:scale-95 transition-all w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>নতুন গাইডলাইন</span>
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white h-48 rounded-[3rem] animate-pulse border border-stone-100" />
          ))
        ) : guidelines.length > 0 ? (
          guidelines.map((guideline) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={guideline.id} 
              className="bg-white p-8 rounded-[3rem] border border-stone-200 shadow-sm hover:shadow-xl hover:shadow-stone-200/40 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  {user.role === 'admin' && (
                    <button 
                      onClick={() => handleDelete(guideline.id)}
                      className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{guideline.title}</h3>
                  <div className="mt-4 text-stone-500 font-medium leading-relaxed whitespace-pre-wrap">
                    {guideline.description}
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-100 flex items-center gap-2 text-stone-400 font-bold uppercase tracking-widest text-[10px]">
                <Clock className="w-3 h-3" />
                <span>আপডেট: {new Date(guideline.updatedAt).toLocaleDateString('bn-BD')}</span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-300">
              <FileText className="w-10 h-10" />
            </div>
            <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">কোনো ওষুধের গাইডলাইন পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-xl w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">নতুন গাইডলাইন</h2>
                <button onClick={() => setShowAddModal(false)} className="p-3 bg-stone-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">ওষুধের নাম</label>
                  <input 
                    type="text" required placeholder="উদা: প্যারাসিটামল" 
                    value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-50 rounded-3xl font-bold border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">ব্যবহারবিধি ও বিবরণ</label>
                  <textarea 
                    rows={5} required placeholder="কখন এবং কিভাবে দিতে হবে বিস্তারিত লিখুন..." 
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-50 rounded-3xl font-bold border-none focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl uppercase tracking-widest text-sm shadow-xl mt-4 active:scale-95 transition-all"
                >
                  গাইডলাইন সেভ করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
