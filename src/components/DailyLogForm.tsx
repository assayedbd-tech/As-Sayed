import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Batch, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Save, Calendar, Droplets, HeartPulse, Camera, TrendingUp, XCircle, CheckCircle2 } from 'lucide-react';

import ImageUpload from './ImageUpload';

interface DailyLogFormProps {
  user: UserProfile;
  onBack: () => void;
}

type ActionType = 'mortality' | 'feed' | 'sale' | 'close' | null;

export default function DailyLogForm({ user, onBack }: DailyLogFormProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchId, setBatchId] = useState('');
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  
  // Forms State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Mortality
  const [mortalityCount, setMortalityCount] = useState('0');
  const [mortalityReason, setMortalityReason] = useState('');
  const [mortalityImageUrl, setMortalityImageUrl] = useState('');
  const [medicineDetails, setMedicineDetails] = useState('');

  // Feed
  const [bagCount, setBagCount] = useState('');
  const [slipImageUrl, setSlipImageUrl] = useState('');

  // Sale
  const [quantity, setQuantity] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const data = await api.getBatches();
        const active = data.filter(b => b.status === 'active');
        setBatches(active);
        if (active.length > 0) setBatchId(active[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadBatches();
  }, []);

  const handleMortalitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) {
      alert('অনুগ্রহ করে ব্যাচ সিলেক্ট করুন।');
      return;
    }
    const count = parseInt(mortalityCount);
    if (isNaN(count)) {
      alert('মৃত্যু সংখ্যা সঠিক নয়।');
      return;
    }

    try {
      await api.createLog({
        batchId,
        date: new Date(date).toISOString(),
        mortalityCount: count,
        mortalityReason,
        mortalityImageUrl,
        medicineDetails,
        feedUsedKg: 0,
        workerId: user.id,
        workerName: user.name
      });
      alert('মৃতুর তথ্য সেভ হয়েছে!');
      onBack();
    } catch (err: any) {
      console.error('Mortality Entry Error:', err);
      try {
        const errorData = JSON.parse(err.message);
        alert(`ভুল হয়েছে: ${errorData.error || 'বডি সাইজ বড় হতে পারে (ছবি ছোট করুন)'}`);
      } catch {
        alert('সার্ভারে সমস্যা হয়েছে। ছবি ছোট করে আবার চেষ্টা করুন।');
      }
    }
  };

  const handleFeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) {
      alert('অনুগ্রহ করে ব্যাচ সিলেক্ট করুন।');
      return;
    }
    const count = parseInt(bagCount);
    if (isNaN(count) || count <= 0) {
      alert('খাদ্য বস্তার সংখ্যা সঠিক নয়।');
      return;
    }
    const pricePerBag = 3400;

    try {
      await api.createFeedRecord({
        batchId,
        date: new Date(date).toISOString(),
        bagCount: count,
        pricePerBag,
        totalAmount: count * pricePerBag,
        slipImageUrl
      });
      alert('খাদ্য যোগ করা হয়েছে!');
      onBack();
    } catch (err: any) {
      console.error('Feed Entry Error:', err);
      try {
        const errorData = JSON.parse(err.message);
        alert(`ভুল হয়েছে: ${errorData.error || 'বডি সাইজ বড় হতে পারে (ছবি ছোট করুন)'}`);
      } catch {
        alert('সার্ভারে সমস্যা হয়েছে। ছবি ছোট করে আবার চেষ্টা করুন।');
      }
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSale({
        batchId,
        date: new Date(date).toISOString(),
        quantity: parseInt(quantity),
        weightKg: parseFloat(weightKg),
        pricePerKg: parseFloat(pricePerKg),
        totalAmount: parseFloat(weightKg) * parseFloat(pricePerKg),
        receiptImageUrl
      });
      alert('বিক্রি রেকর্ড করা হয়েছে!');
      onBack();
    } catch (err) {
      alert('ভুল হয়েছে।');
    }
  };

  const handleCloseBatch = async () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ব্যাচটি বন্ধ করতে চান?')) return;
    try {
      await api.updateBatchStatus(batchId, 'closed');
      alert('ব্যাচটি বন্ধ করা হয়েছে।');
      onBack();
    } catch (err) {
      alert('ভুল হয়েছে।');
    }
  };

  if (loading) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8 pb-20"
    >
      <header className="flex items-center gap-6">
        <button onClick={activeAction ? () => setActiveAction(null) : onBack} className="p-4 bg-white rounded-full border border-stone-200 hover:bg-stone-50 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
            {activeAction ? (
              activeAction === 'mortality' ? 'মৃত্যু এন্ট্রি' :
              activeAction === 'feed' ? 'খাদ্য যোগ' :
              activeAction === 'sale' ? 'বিক্রি যোগ' : 'ব্যাচ ক্লোজ'
            ) : 'দ্রুত এন্ট্রি'}
          </h1>
          <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">খামারের আপডেট সরাসরি দিন</p>
        </div>
      </header>

      {!activeAction ? (
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[3rem] border border-stone-200 shadow-sm">
            <h2 className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-6 pl-2">ব্যাচ নির্বাচন করুন</h2>
            <div className="grid grid-cols-1 gap-3">
              {batches.map(batch => (
                <button
                  key={batch.id}
                  onClick={() => setBatchId(batch.id)}
                  className={`p-6 rounded-3xl border-2 text-left transition-all ${
                    batchId === batch.id 
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-4 ring-emerald-50' 
                    : 'border-stone-50 bg-stone-50 text-stone-400'
                  }`}
                >
                  <p className="font-black text-lg">{batch.name}</p>
                  <p className="text-[10px] uppercase font-bold opacity-70 tracking-widest">{batch.breed} | {batch.initialChicks} টি</p>
                </button>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4">
            <ActionCard 
              label="মৃত মুরগি এন্ট্রি" 
              icon={HeartPulse} 
              color="red" 
              onClick={() => setActiveAction('mortality')} 
            />
            <ActionCard 
              label="খাদ্য যোগ করুন" 
              icon={Droplets} 
              color="blue" 
              onClick={() => setActiveAction('feed')} 
            />
            <ActionCard 
              label="বিক্রি যোগ করুন" 
              icon={TrendingUp} 
              color="emerald" 
              onClick={() => setActiveAction('sale')} 
            />
            {user.role === 'admin' && (
              <ActionCard 
                label="ব্যাচ ক্লোজ করুন" 
                icon={XCircle} 
                color="orange" 
                onClick={() => setActiveAction('close')} 
              />
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-xl space-y-8">
          {activeAction === 'mortality' && (
            <form onSubmit={handleMortalitySubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest pl-2">তারিখ</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none" />
                </div>
                <ImageUpload label="মৃত্যুর ছবি" value={mortalityImageUrl} onChange={setMortalityImageUrl} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest pl-2">মৃত্যু সংখ্যা</label>
                  <input type="number" required value={mortalityCount} onChange={e => setMortalityCount(e.target.value)} className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest pl-2">কারণ</label>
                  <input type="text" value={mortalityReason} onChange={e => setMortalityReason(e.target.value)} placeholder="উদা: রাণীক্ষেত" className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none" />
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl uppercase tracking-widest text-sm shadow-xl mt-4 active:scale-95 transition-all flex items-center justify-center gap-4">
                <Save className="w-5 h-5" />
                <span>মৃত মুরগি ডাটা সেভ করুন</span>
              </button>
            </form>
          )}

          {activeAction === 'feed' && (
            <form onSubmit={handleFeedSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest pl-2">তারিখ</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest pl-2">কত বস্তা?</label>
                  <input type="number" required value={bagCount} onChange={e => setBagCount(e.target.value)} className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none" />
                </div>
              </div>
              <ImageUpload label="স্লিপ ছবি/রিসিপ্ট" value={slipImageUrl} onChange={setSlipImageUrl} />
              <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 flex justify-between items-center">
                <span className="text-sm font-bold text-blue-800 uppercase tracking-widest">মোট খাদ্য মূল্য (৳৩৪০০/বস্তা)</span>
                <span className="text-2xl font-black text-blue-900">৳ {(parseInt(bagCount || '0') * 3400).toLocaleString()}</span>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl uppercase tracking-widest text-sm shadow-xl mt-4 active:scale-95 transition-all">
                খাদ্য এন্ট্রি করুন
              </button>
            </form>
          )}

          {activeAction === 'sale' && (
            <form onSubmit={handleSaleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest pl-2">মোট সংখ্যা (টি)</label>
                  <input type="number" required value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest pl-2">মোট ওজন (কেজি)</label>
                  <input type="number" step="0.01" required value={weightKg} onChange={e => setWeightKg(e.target.value)} className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest pl-2">দাম প্রতি কেজি (টাকা)</label>
                <input type="number" required value={pricePerKg} onChange={e => setPricePerKg(e.target.value)} className="w-full px-6 py-4 bg-stone-50 rounded-2xl font-bold border-none" />
              </div>

              <ImageUpload 
                label="রশিদ ছবি (সরাসরি তুলুন বা আপলোড)" 
                value={receiptImageUrl} 
                onChange={setReceiptImageUrl} 
                icon={Camera}
              />

              <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100 flex justify-between items-center">
                <span className="text-sm font-bold text-emerald-800 uppercase tracking-widest">মোট বিক্রি মূল্য</span>
                <span className="text-2xl font-black text-emerald-900">৳ {(parseFloat(weightKg || '0') * parseFloat(pricePerKg || '0')).toLocaleString()}</span>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-black py-6 rounded-3xl uppercase tracking-widest text-sm shadow-xl mt-4 active:scale-95 transition-all">
                বিক্রি এন্ট্রি করুন
              </button>
            </form>
          )}

          {activeAction === 'close' && (
            <div className="text-center space-y-8 py-10">
              <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">ব্যাচটি বন্ধ করতে চান?</h3>
                <p className="text-stone-500 font-bold max-w-xs mx-auto">ব্যাচটি ক্লোজ করলে আর নতুন ডাটা এন্ট্রি করা যাবে না। সব রিপোর্ট আর্কাইভে চলে যাবে।</p>
              </div>
              <button onClick={handleCloseBatch} className="w-full bg-orange-600 text-white font-black py-6 rounded-3xl uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all">
                ব্যাচ সফলভাবে বন্ধ করুন
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ActionCard({ label, icon: Icon, color, onClick }: { label: string, icon: any, color: string, onClick: () => void }) {
  const colorMap: any = {
    red: 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100',
  };

  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-8 rounded-[2.5rem] border-2 transition-all active:scale-98 ${colorMap[color]}`}>
      <div className="flex items-center gap-6">
        <div className="p-4 bg-white rounded-2xl shadow-sm">
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-lg font-black tracking-tight">{label}</span>
      </div>
      <ArrowLeft className="w-5 h-5 rotate-180 opacity-50" />
    </button>
  );
}
