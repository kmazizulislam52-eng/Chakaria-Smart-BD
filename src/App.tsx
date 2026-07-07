import { useState, useEffect } from 'react';
import { VoterDatabase } from './services/db';
import { Voter, DatabaseStats } from './types';
import DashboardStats, { toBanglaNumeral } from './components/DashboardStats';
import VoterSearch from './components/VoterSearch';
import VoterSlip from './components/VoterSlip';
import AdminPanel from './components/AdminPanel';
import { Search, Settings } from 'lucide-react';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'admin'>('search');
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [stats, setStats] = useState<DatabaseStats>({
    totalVoters: 0,
    totalMale: 0,
    totalFemale: 0,
    totalCenters: 0,
    totalVoted: 0,
    constituencyName: 'চকরিয়া পৌরসভা (৭নং ওয়ার্ড), কক্সবাজার-১'
  });

  const dbInstance = VoterDatabase.getInstance();

  useEffect(() => {
    // Initialize high-capacity IndexedDB on start
    dbInstance.init()
      .then(() => {
        setDbReady(true);
        refreshStats();
      })
      .catch((err) => {
        console.error('Failed to initialize database:', err);
      });
  }, []);

  const refreshStats = async () => {
    try {
      const currentStats = await dbInstance.getDatabaseStats();
      setStats(currentStats);
    } catch (err) {
      console.error('Error refreshing stats:', err);
    }
  };

  if (!dbReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-lg text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">ডাটাবেজ প্রস্তুত করা হচ্ছে</h2>
          <p className="text-xs text-slate-400">উচ্চ-ক্ষমতা সম্পন্ন স্থানীয় ভোটার ডাটাবেজ ইনডেক্স করা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন...</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-1.5 rounded-full animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row text-slate-900 overflow-x-hidden">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-68 bg-slate-900 text-white flex-col shrink-0 print:hidden justify-between">
        <div className="flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold flex items-center gap-2 text-emerald-400 underline underline-offset-8">
              নির্বাচন পোর্টাল
            </h1>
            <p className="text-[11px] text-slate-400 mt-2 tracking-wide font-medium uppercase">চকরিয়া পৌরসভা নির্বাচন ডাটাবেস</p>
          </div>
          
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('search')}
              className={`w-full p-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'search' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4 text-emerald-300" />
              স্লিপ প্রিন্ট ও অনুসন্ধান
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full p-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'admin' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-emerald-300" />
              এডমিন কন্ট্রোল প্যানেল
            </button>
          </nav>
        </div>

        {/* Live database stats footer in sidebar */}
        <div className="p-5 bg-slate-800/80 m-4 rounded-2xl border border-slate-700/50">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">নিবন্ধিত মোট ভোটার</p>
          <p className="text-2xl font-black text-emerald-400 mt-1 font-sans">
            {toBanglaNumeral(stats.totalVoters)} <span className="text-xs font-normal text-slate-300">জন</span>
          </p>
          <div className="mt-3.5 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-1.5 bg-emerald-400 rounded-full transition-all duration-500" 
              style={{ width: stats.totalVoters > 0 ? `${Math.min(100, (stats.totalVoted / stats.totalVoters) * 100)}%` : '0%' }}
            ></div>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-medium">
            <span>কাস্টড: {toBanglaNumeral(stats.totalVoted)}</span>
            <span>প্রগতি: {stats.totalVoters > 0 ? toBanglaNumeral(Math.round((stats.totalVoted / stats.totalVoters) * 100)) : '০'}%</span>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar / Mobile Navigation */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">স্মার্ট নির্বাচনী পোর্টাল</h2>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{stats.constituencyName} • ভোটার ম্যানেজমেন্ট সিস্টেম</p>
          </div>

          {/* Navigation for Mobile Screens */}
          <div className="flex md:hidden bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('search')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'search' 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-500'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              স্লিপ প্রিন্ট ও অনুসন্ধান
            </button>
            <button 
              onClick={() => setActiveTab('admin')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'admin' 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-500'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              এডমিন প্যানেল
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
              চকরিয়া পৌরসভা
            </span>
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-sans shadow-xs border border-slate-800">
              BD
            </div>
          </div>
        </header>

        {/* Outer view frame with scroll capability */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 w-full max-w-7xl mx-auto">
          
          {/* Top statistical display panel */}
          <section className="print:hidden">
            <DashboardStats stats={stats} />
          </section>

          {/* Render Active View Tab */}
          <section className="mt-2">
            {activeTab === 'search' ? (
              <VoterSearch 
                dbInstance={dbInstance}
                onViewSlip={(v) => setSelectedVoter(v)}
                onDataChanged={refreshStats}
              />
            ) : (
              <AdminPanel 
                dbInstance={dbInstance}
                stats={stats}
                onDataChanged={refreshStats}
              />
            )}
          </section>

          {/* Floating Slip Overlay View */}
          {selectedVoter && (
            <VoterSlip 
              voter={selectedVoter} 
              onClose={() => setSelectedVoter(null)} 
            />
          )}
        </div>

        {/* Bottom micro footer */}
        <footer className="bg-white border-t border-slate-200/80 py-4 px-6 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-2.5 text-[11px] text-slate-400 font-medium shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>ভোটার তথ্য ব্যাংক © ২০২৬ | সকল অধিকার সংরক্ষিত।</span>
          </div>
          <div className="flex items-center gap-2">
            <span>বুল ইমপোর্টার: v2.1</span>
            <span>•</span>
            <span className="text-slate-500">নিরাপদ লোকাল ডাটাবেস</span>
          </div>
        </footer>

      </main>

    </div>
  );
}
