import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { UserProfile, SalaryPayment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Users, DollarSign, Plus, Calendar, History, ArrowLeft, Save, X, CheckCheck, AlertCircle } from 'lucide-react';

interface WorkerManagementProps {
  user: UserProfile;
}

export default function WorkerManagement({ user }: WorkerManagementProps) {
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<UserProfile | null>(null);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showEditSalary, setShowEditSalary] = useState(false);
  const [showAddWorker, setShowAddWorker] = useState(false);

  // Form states
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [month, setMonth] = useState(new Date().toLocaleString('bn-BD', { month: 'long' }));
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [newMonthlySalary, setNewMonthlySalary] = useState('');
  
  // New worker form states
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerPassword, setNewWorkerPassword] = useState('');
  const [newWorkerSalary, setNewWorkerSalary] = useState('');

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await api.getWorkers();
      setWorkers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async (workerId: string) => {
    try {
      const data = await api.getSalaryPayments(workerId);
      setPayments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user.role === 'admin') {
      loadWorkers();
    } else {
      setSelectedWorker(user);
      loadPayments(user.id);
      setLoading(false);
    }
  }, [user]);

  const handleWorkerClick = (worker: UserProfile) => {
    if (user.role !== 'admin') return;
    setSelectedWorker(worker);
    loadPayments(worker.id);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    try {
      await api.createSalaryPayment({
        workerId: selectedWorker.id,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        month,
        year: parseInt(year),
        description
      });
      setAmount('');
      setDescription('');
      setShowAddPayment(false);
      loadPayments(selectedWorker.id);
    } catch (err) {
      alert('ভুল হয়েছে');
    }
  };

  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    try {
      await api.updateWorkerSalary(selectedWorker.id, parseFloat(newMonthlySalary));
      setSelectedWorker({ ...selectedWorker, monthlySalary: parseFloat(newMonthlySalary) });
      setShowEditSalary(false);
      loadWorkers();
    } catch (err) {
      alert('ভুল হয়েছে');
    }
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createWorker({
        name: newWorkerName,
        phoneNumber: newWorkerPhone,
        password: newWorkerPassword,
        monthlySalary: parseFloat(newWorkerSalary) || 0
      });
      setShowAddWorker(false);
      setNewWorkerName('');
      setNewWorkerPhone('');
      setNewWorkerPassword('');
      setNewWorkerSalary('');
      loadWorkers();
    } catch (err: any) {
      console.error("Add worker failed:", err);
      let errorMsg = 'চেক করুন';
      try {
        const parsed = JSON.parse(err.message);
        errorMsg = parsed.error || errorMsg;
      } catch (e) {
        errorMsg = err.message || errorMsg;
      }
      alert('ভুল হয়েছে: ' + errorMsg);
    }
  };

  const calculateStats = (worker: UserProfile, payments: SalaryPayment[]) => {
    const currentMonthName = new Date().toLocaleString('bn-BD', { month: 'long' });
    const currentYear = new Date().getFullYear();
    
    const monthPayments = payments.filter(p => p.month === currentMonthName && p.year === currentYear);
    const totalPaidThisMonth = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const monthlySalary = worker.monthlySalary || 0;
    const due = Math.max(0, monthlySalary - totalPaidThisMonth);

    return { totalPaidThisMonth, due };
  };

  if (selectedWorker) {
    const { totalPaidThisMonth, due } = calculateStats(selectedWorker, payments);
    
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-4xl mx-auto space-y-8 pb-20"
      >
        <header className="flex items-center gap-6">
          <button onClick={() => setSelectedWorker(null)} className="p-4 bg-white rounded-full border border-stone-200 shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900">{selectedWorker.name}</h1>
            <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">{selectedWorker.phoneNumber}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="মাসিক বেতন" value={`৳${selectedWorker.monthlySalary || 0}`} icon={DollarSign} color="blue" />
          <StatCard label="এই মাসে দিয়েছেন" value={`৳${totalPaidThisMonth}`} icon={CheckCheck} color="emerald" />
          <StatCard label="বকেয়া (পাওনা)" value={`৳${due}`} icon={AlertCircle} color="red" />
        </div>

        {user.role === 'admin' && (
          <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-stone-200">
            <div className="space-y-1">
              <h3 className="font-black text-slate-900">বেতন সেটআপ</h3>
              <p className="text-xs text-stone-500 font-bold">কর্মীটির মাসিক বেতন নির্ধারণ করুন</p>
            </div>
            <button 
              onClick={() => {
                setNewMonthlySalary((selectedWorker.monthlySalary || 0).toString());
                setShowEditSalary(true);
              }}
              className="px-6 py-3 bg-stone-100 rounded-full font-black text-xs uppercase"
            >
              এডিট করুন
            </button>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">পেমেন্ট হিস্ট্রি</h2>
            {user.role === 'admin' && (
              <button 
                onClick={() => setShowAddPayment(true)}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px]"
              >
                <Plus className="w-4 h-4" />
                <span>টাকা যোগ করুন</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {payments.length > 0 ? (
              payments.map(payment => (
                <div key={payment.id} className="bg-white p-6 rounded-3xl border border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-stone-50 rounded-2xl">
                      <Calendar className="w-5 h-5 text-stone-400" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{payment.month}, {payment.year}</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase">{new Date(payment.date).toLocaleDateString('bn-BD')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-600">৳{payment.amount}</p>
                    {payment.description && <p className="text-[10px] text-stone-400 font-medium">{payment.description}</p>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-stone-100">
                <History className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">কোন পেমেন্ট পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        </div>

        <Modal isOpen={showEditSalary} onClose={() => setShowEditSalary(false)} title="মাসিক বেতন আপডেট">
           <form onSubmit={handleUpdateSalary} className="space-y-6">
             <div className="space-y-2">
               <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">নতুন বেতন</label>
               <input 
                 type="number" required value={newMonthlySalary} onChange={e => setNewMonthlySalary(e.target.value)}
                 className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none outline-none" 
               />
             </div>
             <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs">সেভ করুন</button>
           </form>
        </Modal>

        <Modal isOpen={showAddPayment} onClose={() => setShowAddPayment(false)} title="বেতন প্রদান করুন">
           <form onSubmit={handleAddPayment} className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">মাস</label>
                  <select value={month} onChange={e => setMonth(e.target.value)} className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none">
                    {['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">বছর</label>
                  <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none" />
                </div>
             </div>
             <div className="space-y-2">
               <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">টাকার পরিমাণ</label>
               <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none" />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">বিবরণ (ঐচ্ছিক)</label>
               <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="উদা: অগ্রিম বেতন" className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none" />
             </div>
             <button type="submit" className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs">পেমেন্ট কনফার্ম করুন</button>
           </form>
        </Modal>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">কর্মচারীর তালিকা ও বেতন</h1>
          <p className="text-stone-500 font-bold uppercase tracking-widest text-xs mt-2">আপনার খামারের সকল কর্মচারীদের তালিকা ও বেতন ব্যবস্থাপনা</p>
        </div>
        {user.role === 'admin' && (
          <button 
            onClick={() => setShowAddWorker(true)}
            className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>নতুন কর্মচারী যোগ করুন</span>
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white h-48 rounded-[3rem] animate-pulse border border-stone-100" />
          ))
        ) : workers.length > 0 ? (
          workers.map((worker) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={worker.id} 
              onClick={() => handleWorkerClick(worker)}
              className="bg-white p-8 rounded-[3rem] border border-stone-200 shadow-sm hover:shadow-xl hover:shadow-stone-200/40 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{worker.name}</h3>
                    <p className="text-xs text-stone-400 font-bold uppercase mt-1">{worker.phoneNumber}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-stone-50 p-4 rounded-2xl">
                  <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">মাসিক বেতন</p>
                  <p className="text-lg font-black text-slate-900">৳{worker.monthlySalary || 0}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">রেজিস্ট্রেশন</p>
                  <p className="text-sm font-bold text-emerald-800">{new Date(worker.createdAt).toLocaleDateString('bn-BD')}</p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-300">
              <Users className="w-10 h-10" />
            </div>
            <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">কোনো কর্মচারী পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      <Modal isOpen={showAddWorker} onClose={() => setShowAddWorker(false)} title="নতুন কর্মচারী যোগ করুন">
        <form onSubmit={handleAddWorker} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">কর্মচারীর নাম</label>
            <input 
              type="text" required value={newWorkerName} onChange={e => setNewWorkerName(e.target.value)} 
              placeholder="উদা: মিতা হোসেন"
              className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none outline-none text-slate-900" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">মোবাইল নাম্বার</label>
            <input 
              type="tel" required value={newWorkerPhone} onChange={e => setNewWorkerPhone(e.target.value)} 
              placeholder="+880..."
              className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none outline-none text-slate-900" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">পাসওয়ার্ড</label>
            <input 
              type="text" required value={newWorkerPassword} onChange={e => setNewWorkerPassword(e.target.value)} 
              placeholder="বড় হাতের অক্ষর ও সংখ্যা"
              className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none outline-none text-slate-900" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">মাসিক বেতন (টাকা)</label>
            <input 
              type="number" required value={newWorkerSalary} onChange={e => setNewWorkerSalary(e.target.value)} 
              placeholder="১২০০০"
              className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none outline-none text-slate-900" 
            />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs">অ্যাড করুন</button>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };
  return (
    <div className={`p-8 rounded-[3rem] border-2 shadow-sm ${colors[color]} space-y-4`}>
       <div className="flex items-center justify-between">
         <Icon className="w-6 h-6 opacity-40" />
         <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
       </div>
       <p className="text-3xl font-black tracking-tighter">{value}</p>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{title}</h2>
              <button onClick={onClose} className="p-3 bg-stone-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

