import { DatabaseStats } from '../types';

export function toBanglaNumeral(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit)]);
}

interface DashboardStatsProps {
  stats: DatabaseStats;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const malePercentage = stats.totalVoters > 0
    ? Math.round((stats.totalMale / stats.totalVoters) * 100)
    : 0;

  const femalePercentage = stats.totalVoters > 0
    ? Math.round((stats.totalFemale / stats.totalVoters) * 100)
    : 0;

  return (
    <div id="dashboard-stats" className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
      {/* Card 1: Total Voters */}
      <div id="stat-total-voters" className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-slate-400 tracking-wider uppercase mb-1">মোট ভোটার সংখ্যা</p>
            <h3 className="text-3xl font-bold text-slate-800 font-sans">
              {toBanglaNumeral(stats.totalVoters)} <span className="text-xs font-normal text-slate-500">জন</span>
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            পুরুষ: {toBanglaNumeral(stats.totalMale)} ({toBanglaNumeral(malePercentage)}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
            নারী: {toBanglaNumeral(stats.totalFemale)} ({toBanglaNumeral(femalePercentage)}%)
          </span>
        </div>
      </div>

      {/* Card 2: Total Centers */}
      <div id="stat-total-centers" className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-slate-400 tracking-wider uppercase mb-1">মোট ভোট কেন্দ্র</p>
            <h3 className="text-3xl font-bold text-slate-800">
              {toBanglaNumeral(stats.totalCenters || 2)} <span className="text-xs font-normal text-slate-500">টি</span>
            </h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.33l-7.5-5-7.5 5V21m12.938-3.094a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 1 1-1.06 1.06l-1.06-1.06Zm-11.875 0a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06l-1.06 1.06Z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-500 flex justify-between items-center">
          <span>নির্বাচনী এরিয়া: <strong className="text-indigo-600">{stats.constituencyName}</strong></span>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">ওয়ার্ড নং ৭</span>
        </div>
      </div>
    </div>
  );
}
