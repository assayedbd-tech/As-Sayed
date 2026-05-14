import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Batch, DailyLog, Sale, UserProfile, Expense, FeedRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, TrendingDown, TrendingUp, Package, X, Plus, Trash2, CheckCircle2, Droplets, Camera, FileText, Pencil } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import ImageUpload from './ImageUpload';

interface BatchDetailProps {
  batchId: string;
  user: UserProfile;
  onBack: () => void;
}

export default function BatchDetail({ batchId, user, onBack }: BatchDetailProps) {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Edit states
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editingFeed, setEditingFeed] = useState<FeedRecord | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);

  // Sale form states
  const [quantity, setQuantity] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');

  // Feed form states
  const [bagCount, setBagCount] = useState('');
  const [slipImageUrl, setSlipImageUrl] = useState('');

  // Expense form states
  const [expenseCategory, setExpenseCategory] = useState<'feed' | 'medicine' | 'equipment' | 'electricity' | 'other'>('other');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseImageUrl, setExpenseImageUrl] = useState('');

  // Log form states
  const [mortalityCount, setMortalityCount] = useState('');
  const [mortalityReason, setMortalityReason] = useState('');
  const [medicineDetails, setMedicineDetails] = useState('');
  const [feedUsedKg, setFeedUsedKg] = useState('');
  const [mortalityImageUrl, setMortalityImageUrl] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchData, logsData, salesData, expensesData, feedData] = await Promise.all([
        api.getBatch(batchId),
        api.getBatchLogs(batchId),
        api.getBatchSales(batchId),
        api.getBatchExpenses(batchId),
        api.getBatchFeed(batchId)
      ]);
      setBatch(batchData);
      setLogs(logsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setSales(salesData);
      setExpenses(expensesData);
      setFeedRecords(feedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [batchId]);

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    const weight = parseFloat(weightKg);
    const price = parseFloat(pricePerKg);
    const total = weight * price;

    try {
      if (editingSale) {
        await api.updateSale(editingSale.id, {
          quantity: qty,
          weightKg: weight,
          pricePerKg: price,
          totalAmount: total,
          receiptImageUrl
        });
      } else {
        await api.createSale({
          batchId,
          date: new Date().toISOString(),
          quantity: qty,
          weightKg: weight,
          pricePerKg: price,
          totalAmount: total,
          receiptImageUrl
        });
      }
      setShowSaleModal(false);
      setEditingSale(null);
      resetSaleForm();
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(bagCount);
    const pricePerBag = 3400; // Fixed price as requested
    const total = count * pricePerBag;

    try {
      if (editingFeed) {
        await api.updateFeedRecord(editingFeed.id, {
          bagCount: count,
          pricePerBag,
          totalAmount: total,
          slipImageUrl
        });
      } else {
        await api.createFeedRecord({
          batchId,
          date: new Date().toISOString(),
          bagCount: count,
          pricePerBag,
          totalAmount: total,
          slipImageUrl
        });
      }
      setShowFeedModal(false);
      setEditingFeed(null);
      setBagCount('');
      setSlipImageUrl('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, {
          category: expenseCategory,
          amount: parseFloat(expenseAmount),
          description: expenseDescription,
          imageUrl: expenseImageUrl
        });
      } else {
        await api.createExpense({
          batchId,
          category: expenseCategory,
          amount: parseFloat(expenseAmount),
          date: new Date().toISOString(),
          description: expenseDescription,
          imageUrl: expenseImageUrl
        });
      }
      setShowExpenseModal(false);
      setEditingExpense(null);
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseImageUrl('');
      setExpenseCategory('other');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLog) {
        await api.updateLog(editingLog.id, {
          mortalityCount: parseInt(mortalityCount),
          mortalityReason,
          medicineDetails,
          feedUsedKg: parseFloat(feedUsedKg),
          mortalityImageUrl
        });
      } else {
        await api.createLog({
          batchId,
          date: new Date().toISOString(),
          mortalityCount: parseInt(mortalityCount),
          mortalityReason,
          medicineDetails,
          feedUsedKg: parseFloat(feedUsedKg),
          workerId: user.id,
          workerName: user.name,
          mortalityImageUrl
        });
      }
      setShowLogModal(false);
      setEditingLog(null);
      resetLogForm();
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseBatch = async () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ব্যাচটি বন্ধ করতে চান?')) return;
    try {
      await api.updateBatchStatus(batchId, 'closed');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetSaleForm = () => {
    setQuantity('');
    setWeightKg('');
    setPricePerKg('');
    setReceiptImageUrl('');
  };

  const resetLogForm = () => {
    setMortalityCount('');
    setMortalityReason('');
    setMedicineDetails('');
    setFeedUsedKg('');
    setMortalityImageUrl('');
  };

  const resetExpenseForm = () => {
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseCategory('other');
    setExpenseImageUrl('');
  };

  const openEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setQuantity(sale.quantity.toString());
    setWeightKg(sale.weightKg.toString());
    setPricePerKg(sale.pricePerKg.toString());
    setReceiptImageUrl(sale.receiptImageUrl || '');
    setShowSaleModal(true);
  };

  const openEditFeed = (record: FeedRecord) => {
    setEditingFeed(record);
    setBagCount(record.bagCount.toString());
    setSlipImageUrl(record.slipImageUrl || '');
    setShowFeedModal(true);
  };

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseAmount(expense.amount.toString());
    setExpenseDescription(expense.description);
    setExpenseCategory(expense.category as any);
    setExpenseImageUrl(expense.imageUrl || '');
    setShowExpenseModal(true);
  };

  const openEditLog = (log: DailyLog) => {
    setEditingLog(log);
    setMortalityCount(log.mortalityCount.toString());
    setMortalityReason(log.mortalityReason || '');
    setMedicineDetails(log.medicineDetails || '');
    setFeedUsedKg((log.feedUsedKg || 0).toString());
    setMortalityImageUrl(log.mortalityImageUrl || '');
    setShowLogModal(true);
  };

  if (loading) return <div>Load...</div>;
  if (!batch) return <div>ব্যাচ পাওয়া যায়নি</div>;

  const totalMortality = logs.reduce((acc, log) => acc + log.mortalityCount, 0);
  const currentBirds = batch.initialChicks - totalMortality;
  const totalSalesAmount = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalFeedCost = feedRecords.reduce((acc, f) => acc + f.totalAmount, 0);
  const totalExpensesAmount = expenses.reduce((acc, e) => acc + e.amount, 0) + (batch.initialChicks * batch.costPerChick) + totalFeedCost;
  const totalFeedBags = feedRecords.reduce((acc, f) => acc + f.bagCount, 0);

  const mortalityChartData = logs.map(l => ({
    date: new Date(l.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
    mortality: l.mortalityCount
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 bg-white dark:bg-slate-900 rounded-full border border-stone-200 dark:border-slate-800 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
          </button>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-1 uppercase font-bangla">{batch.name}</h1>
            <p className="text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 font-bangla">
              <span className={`w-2 h-2 rounded-full ${batch.status === 'active' ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`}></span>
              {batch.status === 'active' ? 'চলমান ব্যাচ' : 'বন্ধ ব্যাচ'} | {batch.breed}
            </p>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          {batch.status === 'active' && user.role === 'admin' && (
            <>
              <button 
                onClick={() => { setEditingExpense(null); resetExpenseForm(); setShowExpenseModal(true); }}
                className="flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-red-600/20 active:scale-95 transition-all font-bangla"
              >
                <Plus className="w-5 h-5" />
                <span>খরচ যোগ করুন</span>
              </button>
              <button 
                onClick={() => { setEditingFeed(null); setBagCount(''); setSlipImageUrl(''); setShowFeedModal(true); }}
                className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
              >
                <Droplets className="w-5 h-5" />
                <span>খাদ্য যোগ করুন</span>
              </button>
              <button 
                onClick={() => { setEditingSale(null); resetSaleForm(); setShowSaleModal(true); }}
                className="flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <TrendingUp className="w-5 h-5" />
                <span>বিক্রি যোগ করুন</span>
              </button>
              <button 
                onClick={handleCloseBatch}
                className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>ব্যাচ ক্লোজ করুন</span>
              </button>
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MiniStat label="বর্তমান মুরগি" value={currentBirds} icon={Package} color="emerald" />
        <MiniStat label="মোট মৃত্যু" value={totalMortality} icon={TrendingDown} color="red" />
        <MiniStat label="মোট খাবার (বস্তা)" value={totalFeedBags} icon={Droplets} color="blue" />
        <MiniStat label="মোট ব্যয় (টাকা)" value={Math.round(totalExpensesAmount).toLocaleString()} icon={FileText} color="stone" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-stone-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-xl font-black mb-8 uppercase tracking-tight text-red-600 font-bangla">মৃত্যুহার গ্রাফ</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mortalityChartData}>
                  <defs>
                    <linearGradient id="colorMortality" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" strokeOpacity={0.1} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', backgroundColor: 'var(--tw-prose-invert-bg, #ffffff)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                    itemStyle={{ color: '#ef4444' }}
                  />
                  <Area type="monotone" dataKey="mortality" stroke="#ef4444" fillOpacity={1} fill="url(#colorMortality)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-stone-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black uppercase tracking-tight dark:text-white font-bangla">দৈনিক লগ সমূহ</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-slate-800">
                    <th className="pb-4 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest font-bangla">তারিখ</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest font-bangla">মৃত্যু</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest font-bangla">ছবি</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest font-bangla">ওষুধ/বিবরণ</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest font-bangla">কর্মী</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest font-bangla">একশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-slate-800/50">
                  {logs.slice().reverse().map(log => (
                    <tr key={log.id}>
                      <td className="py-4 font-bold text-slate-900 dark:text-stone-300 text-sm font-bangla">{new Date(log.date).toLocaleDateString('bn-BD')}</td>
                      <td className="py-4 font-bold text-red-600 text-sm font-bangla">{log.mortalityCount} টি</td>
                      <td className="py-4 border-none">
                        {log.mortalityImageUrl ? (
                          <button 
                            onClick={() => setSelectedImage(log.mortalityImageUrl || null)} 
                            className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 dark:border-slate-700 hover:scale-110 transition-transform block"
                          >
                            <img src={log.mortalityImageUrl} alt="Mortality" className="w-full h-full object-cover" />
                          </button>
                        ) : '-'}
                      </td>
                      <td className="py-4 font-medium text-stone-500 dark:text-stone-400 text-sm max-w-xs font-bangla">{log.medicineDetails || log.mortalityReason || '-'}</td>
                      <td className="py-4 font-bold text-slate-900 dark:text-slate-100 text-[10px] uppercase tracking-widest font-bangla">{log.workerName}</td>
                      <td className="py-4">
                        {user.role === 'admin' && (
                          <button onClick={() => openEditLog(log)} className="p-2 text-stone-400 hover:text-red-600 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {user.role === 'admin' && (
            <section className="bg-slate-900 dark:bg-emerald-950 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-200 dark:shadow-none border border-transparent dark:border-emerald-900/50">
              <h2 className="text-lg font-black mb-6 uppercase tracking-widest opacity-60 font-bangla">লাভ / লোকসান তথ্য</h2>
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <span className="text-sm font-bold opacity-70 uppercase tracking-widest italic font-bangla">মোট ব্যয়</span>
                  <span className="text-xl font-black">৳ {Math.round(totalExpensesAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <span className="text-sm font-bold opacity-70 uppercase tracking-widest italic font-bangla">মোট বিক্রি</span>
                  <span className="text-xl font-black">৳ {Math.round(totalSalesAmount).toLocaleString()}</span>
                </div>
                <div className="pt-4">
                  <p className="text-sm font-bold opacity-70 uppercase tracking-widest italic mb-2 font-bangla">নেট {totalSalesAmount >= totalExpensesAmount ? 'লাভ' : 'লোকসান'}</p>
                  <p className={`text-4xl font-black tracking-tighter ${totalSalesAmount >= totalExpensesAmount ? 'text-emerald-400' : 'text-red-400'}`}>
                    ৳ {Math.abs(Math.round(totalSalesAmount - totalExpensesAmount)).toLocaleString()}
                  </p>
                </div>
              </div>
            </section>
          )}

          {user.role === 'admin' && (
            <section className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-stone-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-xl font-black mb-8 uppercase tracking-tight text-emerald-600 font-bangla">বিক্রয় রেকর্ড</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-slate-800">
                    <th className="pb-4 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest font-bangla">তারিখ</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest font-bangla">উপাদান</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest font-bangla">টাকা</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest font-bangla">রশিদ</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest font-bangla">আ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-slate-800/50">
                  {sales.slice().reverse().map(sale => (
                    <tr key={sale.id}>
                      <td className="py-4 font-bold text-slate-900 dark:text-stone-300 text-sm font-bangla">{new Date(sale.date).toLocaleDateString('bn-BD')}</td>
                      <td className="py-4">
                        <p className="font-bold text-slate-900 dark:text-stone-200 text-sm font-bangla">{sale.quantity} টি</p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest font-bangla">{sale.weightKg} কেজি</p>
                      </td>
                      <td className="py-4 font-black text-emerald-600 text-sm">৳{Math.round(sale.totalAmount)}</td>
                      <td className="py-4 border-none">
                        {sale.receiptImageUrl ? (
                          <button 
                            onClick={() => setSelectedImage(sale.receiptImageUrl || null)} 
                            className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 dark:border-slate-700 hover:scale-110 transition-transform block"
                          >
                            <img src={sale.receiptImageUrl} alt="Receipt" className="w-full h-full object-cover" />
                          </button>
                        ) : '-'}
                      </td>
                      <td className="py-4">
                        {user.role === 'admin' && (
                          <button onClick={() => openEditSale(sale)} className="p-2 text-stone-400 hover:text-emerald-600 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400 dark:text-stone-500 font-bold text-xs uppercase tracking-widest font-bangla">কোন বিক্রয় রেকর্ড নেই</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-stone-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-black mb-8 uppercase tracking-tight text-blue-600 font-bangla">খাদ্য আসার রেকর্ড</h2>
          <div className="space-y-4">
            {feedRecords.length > 0 ? feedRecords.slice().reverse().map(record => (
              <div key={record.id} className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-slate-900 dark:text-stone-200 font-bangla">{record.bagCount} বস্তা</p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest flex gap-3 items-center font-bangla">
                        {new Date(record.date).toLocaleDateString('bn-BD')}
                        {record.slipImageUrl && (
                          <button 
                            onClick={() => setSelectedImage(record.slipImageUrl || null)}
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <Camera className="w-3 h-3" />
                            <span className="font-bangla">স্লিপ দেখুন</span>
                          </button>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-black text-blue-600 dark:text-blue-400">৳{Math.round(record.totalAmount)}</p>
                      {user.role === 'admin' && (
                        <button onClick={() => openEditFeed(record)} className="p-2 text-stone-400 hover:text-blue-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-center text-stone-400 dark:text-stone-500 font-bold text-xs uppercase tracking-widest py-8 font-bangla">এখনো কোনো খাদ্য আসেনি</p>
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-stone-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-black mb-8 uppercase tracking-tight text-red-600 font-bangla">অন্যান্য খরচ সমূহ</h2>
          <div className="space-y-4">
            {expenses.length > 0 ? expenses.slice().reverse().map(expense => (
              <div key={expense.id} className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-slate-900 dark:text-stone-200 font-bangla">{expense.description}</p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest flex gap-3 items-center font-bangla">
                        {new Date(expense.date).toLocaleDateString('bn-BD')} | {
                          expense.category === 'feed' ? 'খাদ্য' :
                          expense.category === 'medicine' ? 'ওষুধ' :
                          expense.category === 'equipment' ? 'সরঞ্জাম' :
                          expense.category === 'electricity' ? 'বিদ্যুৎ' : 'অন্যান্য'
                        }
                        {expense.imageUrl && (
                          <button 
                            onClick={() => setSelectedImage(expense.imageUrl || null)}
                            className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:underline"
                          >
                            <Camera className="w-3 h-3" />
                            <span className="font-bangla">রশিদ দেখুন</span>
                          </button>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-black text-red-600 dark:text-red-400">৳{Math.round(expense.amount).toLocaleString()}</p>
                      {user.role === 'admin' && (
                        <button onClick={() => openEditExpense(expense)} className="p-2 text-stone-400 hover:text-red-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-center text-stone-400 dark:text-stone-500 font-bold text-xs uppercase tracking-widest py-8 font-bangla">কোনো খরচ রেকর্ড নেই</p>
            )}
          </div>
        </section>
      </div>
      </div>

      <AnimatePresence>
        {showExpenseModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter font-bangla">
                  {editingExpense ? 'খরচ এডিট করুন' : 'খরচ যোগ করুন'}
                </h2>
                <button onClick={() => { setShowExpenseModal(false); setEditingExpense(null); }} className="p-3 bg-stone-100 dark:bg-slate-800 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors">
                  <X className="w-6 h-6 text-slate-900 dark:text-white" />
                </button>
              </div>

              <form onSubmit={handleCreateExpense} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest pl-2 font-bangla">ক্যাটাগরি</label>
                  <select 
                    value={expenseCategory} onChange={(e: any) => setExpenseCategory(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-100 dark:bg-slate-800 dark:text-white rounded-3xl font-bold focus:ring-2 focus:ring-red-500 outline-none border-none appearance-none"
                  >
                    <option value="feed">খাদ্য</option>
                    <option value="medicine">ওষুধ</option>
                    <option value="equipment">সরঞ্জাম</option>
                    <option value="electricity">বিদ্যুৎ</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest pl-2 font-bangla">খরচের পরিমাণ (টাকা)</label>
                  <input 
                    type="number" required placeholder="উদা: ৫০০" 
                    value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-100 dark:bg-slate-800 dark:text-white rounded-3xl font-bold focus:ring-2 focus:ring-red-500 outline-none border-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest pl-2 font-bangla">বিবরণ</label>
                  <input 
                    type="text" required placeholder="কি বাবদ খরচ?" 
                    value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-100 dark:bg-slate-800 dark:text-white rounded-3xl font-bold focus:ring-2 focus:ring-red-500 outline-none border-none"
                  />
                </div>

                <ImageUpload 
                  label="খরচ/রশিদ ছবি (সরাসরি তুলুন বা আপলোড)" 
                  value={expenseImageUrl} 
                  onChange={setExpenseImageUrl} 
                  icon={Camera}
                />

                <button 
                  type="submit"
                  className="w-full bg-slate-900 dark:bg-red-600 text-white font-black py-5 rounded-3xl uppercase tracking-widest text-sm shadow-xl mt-4 active:scale-95 transition-all font-bangla"
                >
                  {editingExpense ? 'তথ্য আপডেট করুন' : 'খরচ এন্ট্রি নিশ্চিত করুন'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showFeedModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter font-bangla">
                  {editingFeed ? 'খাদ্য রেকর্ড এডিট করুন' : 'খাদ্য যোগ করুন'}
                </h2>
                <button onClick={() => { setShowFeedModal(false); setEditingFeed(null); }} className="p-3 bg-stone-100 dark:bg-slate-800 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors">
                  <X className="w-6 h-6 text-slate-900 dark:text-white" />
                </button>
              </div>

              <form onSubmit={handleCreateFeed} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest pl-2 font-bangla">কত বস্তা?</label>
                  <input 
                    type="number" required placeholder="উদা: ১০" 
                    value={bagCount} onChange={(e) => setBagCount(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-100 dark:bg-slate-800 dark:text-white rounded-3xl font-bold focus:ring-2 focus:ring-blue-500 outline-none border-none"
                  />
                </div>

                <ImageUpload 
                  label="স্লিপ ছবি (সরাসরি তুলুন বা আপলোড)" 
                  value={slipImageUrl} 
                  onChange={setSlipImageUrl} 
                  icon={Camera}
                />

                <div className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-3xl border-2 border-blue-100 dark:border-blue-900/50 space-y-2">
                  <div className="flex justify-between items-center opacity-60">
                    <span className="text-xs font-bold uppercase tracking-widest font-bangla">প্রতি বস্তা মূল্য</span>
                    <span className="text-lg font-black dark:text-blue-200">৳ ৩,৪০০</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest font-bangla">মোট খাদ্য মূল্য</span>
                    <span className="text-2xl font-black text-blue-900 dark:text-blue-100">৳ {Math.round(parseInt(bagCount || '0') * 3400).toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 dark:bg-blue-600 text-white font-black py-5 rounded-3xl uppercase tracking-widest text-sm shadow-xl mt-4 active:scale-95 transition-all font-bangla"
                >
                  {editingFeed ? 'তথ্য আপডেট করুন' : 'খাদ্য এন্ট্রি নিশ্চিত করুন'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showSaleModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter font-bangla">
                  {editingSale ? 'বিক্রি এডিট করুন' : 'বিক্রি যোগ করুন'}
                </h2>
                <button onClick={() => { setShowSaleModal(false); setEditingSale(null); }} className="p-3 bg-stone-100 dark:bg-slate-800 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors">
                  <X className="w-6 h-6 text-slate-900 dark:text-white" />
                </button>
              </div>

              <form onSubmit={handleCreateSale} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest pl-2 font-bangla">সংখ্যা (টি)</label>
                    <input 
                      type="number" required placeholder="উদা: ১০০" 
                      value={quantity} onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-6 py-4 bg-stone-100 dark:bg-slate-800 dark:text-white rounded-3xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest pl-2 font-bangla">ওজন (কেজি)</label>
                    <input 
                      type="number" step="0.1" required placeholder="উদা: ১৫০.৫" 
                      value={weightKg} onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full px-6 py-4 bg-stone-100 dark:bg-slate-800 dark:text-white rounded-3xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none border-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest pl-2 font-bangla">মূল্য (প্রতি কেজি)</label>
                  <input 
                    type="number" required placeholder="উদা: ১৭০" 
                    value={pricePerKg} onChange={(e) => setPricePerKg(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-100 dark:bg-slate-800 dark:text-white rounded-3xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none border-none"
                  />
                </div>

                <ImageUpload 
                  label="রশিদ ছবি (সরাসরি তুলুন বা আপলোড)" 
                  value={receiptImageUrl} 
                  onChange={setReceiptImageUrl} 
                  icon={Camera}
                />

                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-6 rounded-3xl border-2 border-emerald-100 dark:border-emerald-900/50 flex justify-between items-center">
                  <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest font-bangla">মোট বিক্রয় মূল্য</span>
                  <span className="text-2xl font-black text-emerald-900 dark:text-emerald-100">৳ {Math.round(parseFloat(weightKg || '0') * parseFloat(pricePerKg || '0')).toLocaleString()}</span>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 dark:bg-emerald-600 text-white font-black py-5 rounded-3xl uppercase tracking-widest text-sm shadow-xl mt-4 active:scale-95 transition-all font-bangla"
                >
                  {editingSale ? 'তথ্য আপডেট করুন' : 'কনফার্ম বিক্রি'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showLogModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter font-bangla">
                  {editingLog ? 'লগ এডিট করুন' : 'লগ যোগ করুন'}
                </h2>
                <button onClick={() => { setShowLogModal(false); setEditingLog(null); }} className="p-3 bg-stone-100 dark:bg-slate-800 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors">
                  <X className="w-6 h-6 text-slate-900 dark:text-white" />
                </button>
              </div>

              <form onSubmit={handleCreateLog} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest pl-2 font-bangla">মুরগির মৃত্যু (টি)</label>
                    <input 
                      type="number" required placeholder="উদা: ২" 
                      value={mortalityCount} onChange={(e) => setMortalityCount(e.target.value)}
                      className="w-full px-6 py-4 bg-stone-100 dark:bg-slate-800 dark:text-white rounded-3xl font-bold focus:ring-2 focus:ring-red-500 outline-none border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest pl-2 font-bangla">খাবার খরচ (কেজি)</label>
                    <input 
                      type="number" step="0.1" required placeholder="উদা: ৫০" 
                      value={feedUsedKg} onChange={(e) => setFeedUsedKg(e.target.value)}
                      className="w-full px-6 py-4 bg-stone-100 dark:bg-slate-800 dark:text-white rounded-3xl font-bold focus:ring-2 focus:ring-red-500 outline-none border-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest pl-2 font-bangla">মৃত্যুর কারণ (যদি থাকে)</label>
                  <input 
                    type="text" placeholder="উদা: কক্সিডিওসিস" 
                    value={mortalityReason} onChange={(e) => setMortalityReason(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-100 dark:bg-slate-800 dark:text-white rounded-3xl font-bold focus:ring-2 focus:ring-red-500 outline-none border-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest pl-2 font-bangla">ওষুধ ও অন্যান্য বিবরণ</label>
                  <textarea 
                    rows={3} placeholder="আজকে কি কি ওষুধ দেয়া হয়েছে?" 
                    value={medicineDetails} onChange={(e) => setMedicineDetails(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-100 dark:bg-slate-800 dark:text-white rounded-3xl font-bold focus:ring-2 focus:ring-red-500 outline-none border-none resize-none font-bangla"
                  />
                </div>

                <ImageUpload 
                  label="মৃত্যুর ছবি (যদি থাকে)" 
                  value={mortalityImageUrl} 
                  onChange={setMortalityImageUrl} 
                  icon={Camera}
                />

                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl uppercase tracking-widest text-sm shadow-xl mt-4 active:scale-95 transition-all font-bangla"
                >
                  {editingLog ? 'তথ্য আপডেট করুন' : 'লগ এন্ট্রি নিশ্চিত করুন'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {selectedImage && (
          <div className="fixed inset-0 bg-stone-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-0 right-0 p-4 text-white hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <X className="w-8 h-8" />
              </button>
              <img 
                src={selectedImage} 
                alt="Enlarged view" 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MiniStat({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) {
  const colorMap: any = {
    emerald: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400',
    red: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400',
    stone: 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300',
    blue: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400'
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-stone-200 dark:border-slate-800 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[9px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest font-bangla">{label}</p>
        <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
