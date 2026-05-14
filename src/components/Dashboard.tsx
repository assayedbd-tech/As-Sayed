import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Batch, UserProfile } from '../types';
import { motion } from 'motion/react';
import { TrendingUp, Users, Activity, Plus, ArrowRight, ThermometerSun, Droplets, CloudSun } from 'lucide-react';

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
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2 uppercase font-bangla">ড্যাশবোর্ড</h1>
          <p className="text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest text-xs font-bangla">স্বাগতম, {user.name} | আপনার খামারের বর্তমান অবস্থা</p>
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
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-bangla">সচল ব্যাচ সমূহ</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeBatches.length > 0 ? (
            activeBatches.map(batch => (
              <motion.button
                key={batch.id}
                whileHover={{ y: -4 }}
                onClick={() => onSelectBatch(batch.id)}
                className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-stone-200 dark:border-slate-800 text-left transition-all hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-slate-950"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-stone-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors dark:text-slate-400">
                    <Activity className="w-7 h-7" />
                  </div>
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 font-bangla">{batch.name}</h3>
                <div className="flex gap-6 mb-6">
                  <div>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest mb-1 font-bangla">মুরগির সংখ্যা</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 font-bangla">{batch.initialChicks}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest mb-1 font-bangla">শুরু হয়েছে</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 font-bangla">{new Date(batch.startDate).toLocaleDateString('bn-BD')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                  <span>বিস্তারিত দেখুন</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.button>
            ))
          ) : (
            <div className="col-span-full py-20 bg-stone-100 dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-stone-200 dark:border-slate-800 flex flex-col items-center justify-center text-center px-6">
              <Plus className="w-12 h-12 text-stone-300 dark:text-slate-700 mb-4" />
              <p className="text-stone-500 dark:text-slate-400 font-bold mb-2 uppercase tracking-widest text-xs font-bangla">কোন সচল ব্যাচ নেই</p>
              <p className="text-slate-400 dark:text-slate-500 font-medium max-w-xs text-sm font-bangla">নতুন ব্যাচ যোগ করতে 'ব্যাচ সমূহ' মেনুতে যান।</p>
            </div>
          )}
        </div>
      </div>

      {/* Live Weather Section */}
      <LiveWeather />
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-stone-200 dark:border-slate-800 shadow-sm transition-all shadow-slate-100 dark:shadow-slate-950">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-opacity-20`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest mb-2 font-bangla">{label}</p>
      <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter font-bangla">{value}</p>
    </div>
  );
}

function LiveWeather() {
  const [weather, setWeather] = useState<{ temp: number, humidity: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Default to Dhaka, Bangladesh coordinates
        let lat = 23.81;
        let lon = 90.41;

        // Try to get actual location
        navigator.geolocation.getCurrentPosition((pos) => {
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        });

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m`);
        const data = await res.json();
        setWeather({
          temp: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m
        });
      } catch (err) {
        console.error("Failed to fetch weather:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-stone-200 dark:border-slate-800 animate-pulse h-40" />
  );

  return (
    <div className="bg-slate-900 dark:bg-slate-950 p-10 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -ml-32 -mb-32" />
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-600 rounded-2xl">
              <CloudSun className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight font-bangla">খামারের বর্তমান আবহাওয়া</h3>
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] font-bangla">লাইভ আপডেট (৫ মিনিট অন্তর)</p>
        </div>

        <div className="flex gap-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-600/20 rounded-3xl flex items-center justify-center">
              <ThermometerSun className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 font-bangla">তাপমাত্রা</p>
              <p className="text-4xl font-black text-white tracking-tighter">{weather?.temp}°C</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600/20 rounded-3xl flex items-center justify-center">
              <Droplets className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 font-bangla">আর্দ্রতা</p>
              <p className="text-4xl font-black text-white tracking-tighter">{weather?.humidity}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
