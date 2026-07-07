import React, { useState, useEffect } from 'react';
import { Voter } from '../types';
import { VoterDatabase } from '../services/db';
import { toBanglaNumeral } from './DashboardStats';
import { Search, IdCard, MapPin, User, Printer, RefreshCw } from 'lucide-react';

interface VoterSearchProps {
  dbInstance: VoterDatabase;
  onViewSlip: (voter: Voter) => void;
  onDataChanged: () => void;
}

type SearchMode = 'nid' | 'voterNo' | 'nameArea';

export default function VoterSearch({ dbInstance, onViewSlip, onDataChanged }: VoterSearchProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>('nid');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Voter[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    handleSearch();
  }, [searchQuery]);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const matchedVoters = await dbInstance.searchVoters(searchQuery);
      setResults(matchedVoters);
    } catch (err) {
      console.error('Error during search:', err);
    } finally {
      setSearching(false);
    }
  };

  const getPlaceholderText = () => {
    if (searchMode === 'nid') return 'জাতীয় পরিচয়পত্র নং (NID) দিয়ে খুঁজুন...';
    if (searchMode === 'voterNo') return '৮ সংখ্যার ভোটার নম্বর দিয়ে খুঁজুন...';
    return 'ভোটার নাম, পিতা/মাতা বা এলাকার নাম দিয়ে খুঁজুন...';
  };

  return (
    <div id="voter-search-section" className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-100">
      
      {/* Modes tab selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">ভোটার স্লিপ প্রিন্ট ও অনুসন্ধান</h2>
          <p className="text-xs text-slate-400 mt-1">NID, ভোটার নম্বর বা নাম দিয়ে স্লিপ খুঁজুন ও প্রিন্ট করুন <span className="text-rose-500 font-semibold">(নতুন ভোটার সংযোজন শুধুমাত্র এডমিন প্যানেলে সম্ভব)</span></p>
        </div>
      </div>

      {/* Search Bar Input Panel */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => { setSearchMode('nid'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              searchMode === 'nid' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <IdCard className="w-4 h-4" />
            জাতীয় পরিচয়পত্র (NID)
          </button>
          <button 
            onClick={() => { setSearchMode('voterNo'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              searchMode === 'voterNo' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            ভোটার নম্বর (Voter No)
          </button>
          <button 
            onClick={() => { setSearchMode('nameArea'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              searchMode === 'nameArea' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            নাম ও এলাকা দিয়ে খুঁজুন
          </button>
        </div>

        {/* Search Field */}
        <div className="relative">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getPlaceholderText()}
            className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-2xl text-slate-800 font-medium placeholder-slate-400 outline-none transition-all text-sm md:text-base"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              মুছে ফেলুন
            </button>
          )}
        </div>
      </div>

      {/* Results Panel */}
      <div>
        {searching ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-sm font-medium">তথ্য অনুসন্ধান করা হচ্ছে...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((voter) => (
              <div 
                key={voter.id}
                className="group bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-xs rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200"
              >
                {/* Left: Voter details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 group-hover:text-indigo-950 text-base">{voter.nameBn}</span>
                    <span className="text-[10px] bg-slate-200/60 font-medium text-slate-600 px-2 py-0.5 rounded-sm">
                      ক্রমিক: {toBanglaNumeral(voter.serialNo)}
                    </span>
                  </div>
                  <div className="space-y-0.5 text-xs text-slate-500">
                    <p className="flex items-center gap-1 text-slate-600">
                      <strong className="text-slate-400">পিতা:</strong> {voter.fatherName}
                    </p>
                    <p className="font-mono text-slate-400">
                      NID: <span className="text-slate-600 font-medium">{toBanglaNumeral(voter.nid)}</span> | Voter No: <span className="text-slate-600 font-medium">{toBanglaNumeral(voter.voterNo)}</span>
                    </p>
                    <p className="text-[11px] text-indigo-600 font-medium mt-1 truncate max-w-[280px]">
                      📍 {voter.centerName}
                    </p>
                  </div>
                </div>

                {/* Right: Slip print */}
                <div className="flex items-center shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                  {/* Print slip button */}
                  <button
                    onClick={() => onViewSlip(voter)}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    স্লিপ প্রিন্ট করুন
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center px-4">
            <div className="p-4 bg-slate-50 rounded-full text-slate-300 mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-700">কোন ভোটার তথ্য পাওয়া যায়নি</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              দয়া করে সঠিক NID, ভোটার নম্বর বা নাম লিখুন অথবা এডমিন প্যানেল থেকে নতুন ভোটার যুক্ত করুন।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
