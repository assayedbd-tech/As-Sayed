import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Expense, Batch, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, DollarSign, Calendar, Tag, FileText, Filter } from 'lucide-react';

interface ExpenseListProps {
  user: UserProfile;
}

export default function ExpenseList({ user }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'feed' | 'medicine' | 'equipment' | 'electricity' | 'other'>('other');
  const [batchId, setBatchId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [expData, batchData] = await Promise.all([
        api.getExpenses(),
        api.getBatches()
      ]);
      setExpenses(expData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setBatches(batchData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createExpense({
        amount: parseFloat(amount),
        category,
        batchId: batchId || undefined,
        date: new Date(date).toISOString(),
        description
      });
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategory('other');
    setBatchId('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
  };

  const categoryLabels: any = {
    feed: 'খাবার',
    medicine: 'ওষুধ',
    equipment: 'সরঞ্জাম',
    electricity: 'বিদ্যমান',
    other: 'অন্যান্য'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 uppercase">অন্যান্য খরচ</h1>
          <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">খামারের দৈনন্দিন অতিরিক্ত ব্যয়ের হিসাব</p>
        </div>
        {user.role === 'admin' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-red-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>খরচ যোগ করুন</span>
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl shadow-slate-200">
            <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-2">মোট বিবিধ ব্যয়</p>
            <p className="text-4xl font-black tracking-tighter">৳ {Math.round(expenses.reduce((acc, e) => acc + e.amount, 0)).toLocaleString()}</p>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-6 flex items-center gap-2">
              <Filter className="w-4 h-4" /> ক্যাটাগরি রিপোর্ট
            </h3>
            <div className="space-y-4">
              {['feed', 'medicine', 'equipment', 'electricity', 'other'].map(cat => {
                const total = expenses.filter(e => e.category === cat).reduce((acc, e) => acc + e.amount, 0);
                if (total === 0) return null;
                return (
                  <div key={cat} className="flex justify-between items-center text-sm">
                    <span className="font-bold text-stone-500">{categoryLabels[cat]}</span>
                    <span className="font-black text-slate-900">৳{Math.round(total)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white rounded-[3rem] border border-stone-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50">
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">তারিখ</th>
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">ক্যাটাগরি</th>
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">বিবরণ</th>
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">ব্যাচ (ঐচ্ছিক)</th>
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">পরিমাণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-8 py-6 font-bold text-slate-600 text-sm">{new Date(expense.date).toLocaleDateString('bn-BD')}</td>
                    <td className="px-8 py-6">
                      <span className="bg-stone-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-stone-500">
                        {categoryLabels[expense.category]}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-900 text-sm">{expense.description}</td>
                    <td className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                      {batches.find(b => b.id === expense.batchId)?.name || '-'}
                    </td>
                    <td className="px-8 py-6 font-black text-red-600 text-right text-lg">৳{Math.round(expense.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">কোনো খরচের রেকর্ড পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-xl w-full"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">খরচ যোগ করুন</h2>
                <button onClick={() => setShowAddModal(false)} className="p-3 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateExpense} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">পরিমাণ (টাকা)</label>
                    <input 
                      type="number" required placeholder="উদা: ৫০০" 
                      value={amount} onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-6 py-4 bg-stone-100 rounded-3xl font-bold focus:ring-2 focus:ring-red-500 outline-none border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">ক্যাটাগরি</label>
                    <select 
                      value={category} onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full px-6 py-4 bg-stone-100 rounded-3xl font-bold focus:ring-2 focus:ring-red-500 outline-none border-none appearance-none"
                    >
                      <option value="feed">খাবার</option>
                      <option value="medicine">ওষুধ</option>
                      <option value="equipment">সরঞ্জাম</option>
                      <option value="electricity">বিদ্যমান</option>
                      <option value="other">অন্যান্য</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">ব্যাচ (ঐচ্ছিক)</label>
                  <select 
                    value={batchId} onChange={(e) => setBatchId(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-100 rounded-3xl font-bold focus:ring-2 focus:ring-red-500 outline-none border-none appearance-none"
                  >
                    <option value="">কোনো নির্দিষ্ট ব্যাচ নেই</option>
                    {batches.filter(b => b.status === 'active').map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">তারিখ</label>
                  <input 
                    type="date" required 
                    value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-100 rounded-3xl font-bold focus:ring-2 focus:ring-red-500 outline-none border-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">বিবরণ</label>
                  <input 
                    type="text" required placeholder="উদা: বিদ্যুত বিল পরিশোধ" 
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-100 rounded-3xl font-bold focus:ring-2 focus:ring-red-500 outline-none border-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl uppercase tracking-widest text-sm shadow-xl shadow-slate-200 mt-4 active:scale-95 transition-all"
                >
                  খরচ সেভ করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
