import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { UserCheck, UserX, Clock, ShieldCheck } from 'lucide-react';

export default function UserApprovals() {
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPendingUsers = async () => {
    setLoading(true);
    try {
      const users = await api.getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      console.error("Failed to load pending users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.approveUser(id);
      loadPendingUsers();
    } catch (error) {
      alert("অ্যাপ্রুভ করতে সমস্যা হয়েছে");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই ইউজারকে মুছে ফেলতে চান?")) return;
    try {
      await api.rejectUser(id);
      loadPendingUsers();
    } catch (error) {
      alert("মুছে ফেলতে সমস্যা হয়েছে");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">নতুন ইউজার অনুমোদন</h1>
        <p className="text-stone-500 font-bold uppercase tracking-widest text-xs mt-2">যারা রেজিস্ট্রেশন করেছেন তাদের লিস্ট এবং অনুমোদন</p>
      </header>

      {pendingUsers.length === 0 ? (
        <div className="bg-white p-12 rounded-[3rem] text-center border border-stone-200">
          <Clock className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 font-bold">কোন পেন্ডিং ইউজার নেই</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingUsers.map((u) => (
            <motion.div 
              key={u.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-stone-200 flex flex-col gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center text-slate-900 text-xl font-black">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-lg">{u.name}</h3>
                  <p className="text-stone-400 font-bold text-xs uppercase tracking-widest">{u.phoneNumber}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => handleApprove(u.id)}
                  className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <UserCheck className="w-4 h-4" />
                  অ্যাপ্রুভ
                </button>
                <button 
                  onClick={() => handleReject(u.id)}
                  className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs active:scale-95 transition-all"
                >
                  <UserX className="w-4 h-4" />
                  বাতিল
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
