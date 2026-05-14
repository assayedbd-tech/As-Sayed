import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Batch, UserProfile } from '../types';
import { motion } from 'motion/react';
import { TrendingUp, Users, Activity, Plus, ArrowRight } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  onSelectBatch: (id: string) => void;
}

export default function Dashboard({ user, onSelectBatch }: DashboardProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getBatches();
        setBatches(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const activeBatches = batches.filter(b => b.status === 'active');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 uppercase">ড্যাশবোর্ড</h1>
          <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">স্বাগতম, {user.name} | আপনার খামারের বর্তমান অবস্থা</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={TrendingUp} 
          label="চলমান ব্যাচ" 
          value={activeBatches.length.toString()} 
          color="bg-emerald-500" 
        />
        <StatCard 
          icon={Users} 
          label="মোট মুরগি" 
          value={activeBatches.reduce((acc, b) => acc + b.initialChicks, 0).toLocaleString()} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={Activity} 
          label="মোট ব্যাচ" 
          value={batches.length.toString()} 
          color="bg-orange-500" 
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">সচল ব্যাচ সমূহ</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeBatches.length > 0 ? (
            activeBatches.map(batch => (
              <motion.button
                key={batch.id}
                whileHover={{ y: -4 }}
                onClick={() => onSelectBatch(batch.id)}
                className="group relative bg-white p-8 rounded-[2.5rem] border border-stone-200 text-left transition-all hover:shadow-2xl hover:shadow-slate-200"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Activity className="w-7 h-7" />
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-2">{batch.name}</h3>
                <div className="flex gap-6 mb-6">
                  <div>
                    <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">মুরগির সংখ্যা</p>
                    <p className="font-bold text-slate-900">{batch.initialChicks}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">শুরু হয়েছে</p>
                    <p className="font-bold text-slate-900">{new Date(batch.startDate).toLocaleDateString('bn-BD')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                  <span>বিস্তারিত দেখুন</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.button>
            ))
          ) : (
            <div className="col-span-full py-20 bg-stone-100 rounded-[3rem] border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-center px-6">
              <Plus className="w-12 h-12 text-stone-300 mb-4" />
              <p className="text-stone-500 font-bold mb-2 uppercase tracking-widest text-xs">কোন সচল ব্যাচ নেই</p>
              <p className="text-slate-400 font-medium max-w-xs text-sm">নতুন ব্যাচ যোগ করতে 'ব্যাচ সমূহ' মেনুতে যান।</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-opacity-20`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-2">{label}</p>
      <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>
  );
}
