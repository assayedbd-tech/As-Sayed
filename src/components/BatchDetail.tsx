import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Batch, DailyLog, Sale, UserProfile, Expense, FeedRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, TrendingDown, TrendingUp, Package, X, Plus, Trash2, CheckCircle2, Droplets, Camera, FileText } from 'lucide-react';
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Sale form states
  const [quantity, setQuantity] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');

  // Feed form states
  const [bagCount, setBagCount] = useState('');
  const [slipImageUrl, setSlipImageUrl] = useState('');

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
      await api.createSale({
        batchId,
        date: new Date().toISOString(),
        quantity: qty,
        weightKg: weight,
        pricePerKg: price,
        totalAmount: total,
        receiptImageUrl
      });
      setShowSaleModal(false);
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
      await api.createFeedRecord({
        batchId,
        date: new Date().toISOString(),
        bagCount: count,
        pricePerBag,
        totalAmount: total,
        slipImageUrl
      });
      setShowFeedModal(false);
      setBagCount('');
      setSlipImageUrl('');
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
          <button onClick={onBack} className="p-4 bg-white rounded-full border border-stone-200 hover:bg-stone-50 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-1 uppercase">{batch.name}</h1>
            <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${batch.status === 'active' ? 'bg-emerald-500' : 'bg-stone-300'}`}></span>
              {batch.status === 'active' ? 'চলমান ব্যাচ' : 'বন্ধ ব্যাচ'} | {batch.breed}
            </p>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          {batch.status === 'active' && user.role === 'admin' && (
            <>
              <button 
                onClick={() => setShowFeedModal(true)}
                className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
              >
                <Droplets className="w-5 h-5" />
                <span>খাদ্য যোগ করুন</span>
              </button>
              <button 
                onClick={() => setShowSaleModal(true)}
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
        {user.role === 'admin' && <MiniStat label="মোট ব্যয় (টাকা)" value={Math.round(totalExpensesAmount).toLocaleString()} icon={FileText} color="stone" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm">
            <h2 className="text-xl font-black mb-8 uppercase tracking-tight text-red-600">মৃত্যুহার গ্রাফ</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mortalityChartData}>
                  <defs>
                    <linearGradient id="colorMortality" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="mortality" stroke="#ef4444" fillOpacity={1} fill="url(#colorMortality)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black uppercase tracking-tight">দৈনিক লগ সমূহ</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">তারিখ</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">মৃত্যু</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">ছবি</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">ওষুধ/বিবরণ</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">কর্মী</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {logs.slice().reverse().map(log => (
                    <tr key={log.id}>
                      <td className="py-4 font-bold text-slate-900 text-sm">{new Date(log.date).toLocaleDateString('bn-BD')}</td>
                      <td className="py-4 font-bold text-red-600 text-sm">{log.mortalityCount} টি</td>
                      <td className="py-4">
                        {log.mortalityImageUrl ? (
                          <button 
                            onClick={() => setSelectedImage(log.mortalityImageUrl || null)} 
                            className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 hover:scale-110 transition-transform block"
                          >
                            <img src={log.mortalityImageUrl} alt="Mortality" className="w-full h-full object-cover" />
                          </button>
                        ) : '-'}
                      </td>
                      <td className="py-4 font-medium text-stone-500 text-sm max-w-xs">{log.medicineDetails || log.mortalityReason || '-'}</td>
                      <td className="py-4 font-bold text-slate-900 text-[10px] uppercase tracking-widest">{log.workerName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {user.role === 'admin' && (
            <section className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-200">
              <h2 className="text-lg font-black mb-6 uppercase tracking-widest opacity-60">লাভ / লোকসান তথ্য</h2>
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <span className="text-sm font-bold opacity-70 uppercase tracking-widest italic">মোট ব্যয়</span>
                  <span className="text-xl font-black">৳ {Math.round(totalExpensesAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <span className="text-sm font-bold opacity-70 uppercase tracking-widest italic">মোট বিক্রি</span>
                  <span className="text-xl font-black">৳ {Math.round(totalSalesAmount).toLocaleString()}</span>
                </div>
                <div className="pt-4">
                  <p className="text-sm font-bold opacity-70 uppercase tracking-widest italic mb-2">নেট {totalSalesAmount >= totalExpensesAmount ? 'লাভ' : 'লোকসান'}</p>
                  <p className={`text-4xl font-black tracking-tighter ${totalSalesAmount >= totalExpensesAmount ? 'text-emerald-400' : 'text-red-400'}`}>
                    ৳ {Math.abs(Math.round(totalSalesAmount - totalExpensesAmount)).toLocaleString()}
                  </p>
                </div>
              </div>
            </section>
          )}

          {user.role === 'admin' && (
            <section className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm">
              <h2 className="text-xl font-black mb-8 uppercase tracking-tight text-emerald-600">বিক্রয় রেকর্ড</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">তারিখ</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">উপাদান</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">টাকা</th>
                    <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">রশিদ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {sales.slice().reverse().map(sale => (
                    <tr key={sale.id}>
                      <td className="py-4 font-bold text-slate-900 text-sm">{new Date(sale.date).toLocaleDateString('bn-BD')}</td>
                      <td className="py-4">
                        <p className="font-bold text-slate-900 text-sm">{sale.quantity} টি</p>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{sale.weightKg} কেজি</p>
                      </td>
                      <td className="py-4 font-black text-emerald-600 text-sm">৳{Math.round(sale.totalAmount)}</td>
                      <td className="py-4">
                        {sale.receiptImageUrl ? (
                          <button 
                            onClick={() => setSelectedImage(sale.receiptImageUrl || null)} 
                            className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 hover:scale-110 transition-transform block"
                          >
                            <img src={sale.receiptImageUrl} alt="Receipt" className="w-full h-full object-cover" />
                          </button>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-stone-400 font-bold text-xs uppercase tracking-widest">কোন বিক্রয় রেকর্ড নেই</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {user.role === 'admin' && (
            <section className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm">
              <h2 className="text-xl font-black mb-8 uppercase tracking-tight text-blue-600">খাদ্য আসার রেকর্ড</h2>
              <div className="space-y-4">
                {feedRecords.length > 0 ? feedRecords.slice().reverse().map(record => (
                  <div key={record.id} className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div>
                      <p className="font-black text-slate-900">{record.bagCount} বস্তা</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex gap-3 items-center">
                        {new Date(record.date).toLocaleDateString('bn-BD')}
                        {record.slipImageUrl && (
                          <button 
                            onClick={() => setSelectedImage(record.slipImageUrl || null)}
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Camera className="w-3 h-3" />
                            <span>স্লিপ দেখুন</span>
                          </button>
                        )}
                      </p>
                    </div>
                    <p className="font-black text-blue-600">৳{Math.round(record.totalAmount)}</p>
                  </div>
                )) : (
                  <p className="text-center text-stone-400 font-bold text-xs uppercase tracking-widest py-8">এখনো কোনো খাদ্য আসেনি</p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFeedModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-xl w-full"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">খাদ্য যোগ করুন</h2>
                <button onClick={() => setShowFeedModal(false)} className="p-3 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateFeed} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">কত বস্তা?</label>
                  <input 
                    type="number" required placeholder="উদা: ১০" 
                    value={bagCount} onChange={(e) => setBagCount(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-100 rounded-3xl font-bold focus:ring-2 focus:ring-blue-500 outline-none border-none"
                  />
                </div>

                <ImageUpload 
                  label="স্লিপ ছবি (সরাসরি তুলুন বা আপলোড)" 
                  value={slipImageUrl} 
                  onChange={setSlipImageUrl} 
                  icon={Camera}
                />

                <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 space-y-2">
                  <div className="flex justify-between items-center opacity-60">
                    <span className="text-xs font-bold uppercase tracking-widest">প্রতি বস্তা মূল্য</span>
                    <span className="text-lg font-black">৳ ৩,৪০০</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-blue-800 uppercase tracking-widest">মোট খাদ্য মূল্য</span>
                    <span className="text-2xl font-black text-blue-900">৳ {Math.round(parseInt(bagCount || '0') * 3400).toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl uppercase tracking-widest text-sm shadow-xl shadow-slate-200 mt-4 active:scale-95 transition-all"
                >
                  খাদ্য এন্ট্রি নিশ্চিত করুন
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
              className="bg-white rounded-[3rem] p-10 max-w-xl w-full"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">বিক্রি যোগ করুন</h2>
                <button onClick={() => setShowSaleModal(false)} className="p-3 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateSale} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">সংখ্যা (টি)</label>
                    <input 
                      type="number" required placeholder="উদা: ১০০" 
                      value={quantity} onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-6 py-4 bg-stone-100 rounded-3xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">ওজন (কেজি)</label>
                    <input 
                      type="number" step="0.1" required placeholder="উদা: ১৫০.৫" 
                      value={weightKg} onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full px-6 py-4 bg-stone-100 rounded-3xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none border-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2">মূল্য (প্রতি কেজি)</label>
                  <input 
                    type="number" required placeholder="উদা: ১৭০" 
                    value={pricePerKg} onChange={(e) => setPricePerKg(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-100 rounded-3xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none border-none"
                  />
                </div>

                <ImageUpload 
                  label="রশিদ ছবি (সরাসরি তুলুন বা আপলোড)" 
                  value={receiptImageUrl} 
                  onChange={setReceiptImageUrl} 
                  icon={Camera}
                />

                <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-emerald-800 uppercase tracking-widest">মোট বিক্রয় মূল্য</span>
                  <span className="text-2xl font-black text-emerald-900">৳ {Math.round(parseFloat(weightKg || '0') * parseFloat(pricePerKg || '0')).toLocaleString()}</span>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl uppercase tracking-widest text-sm shadow-xl shadow-slate-200 mt-4 active:scale-95 transition-all"
                >
                  কনফার্ম বিক্রি
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
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    stone: 'bg-stone-100 text-stone-700',
    blue: 'bg-blue-100 text-blue-700'
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-stone-200 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}
