import React, { useState } from 'react';
import { Voter, DatabaseStats } from '../types';
import { VoterDatabase } from '../services/db';
import { toBanglaNumeral } from './DashboardStats';
import { 
  Lock, Key, Trash2, Plus, Database, AlertCircle, 
  CheckCircle, FileSpreadsheet, RefreshCw, Sparkles, AlertTriangle 
} from 'lucide-react';

interface AdminPanelProps {
  dbInstance: VoterDatabase;
  stats: DatabaseStats;
  onDataChanged: () => void;
}

const DEFAULT_ADMIN_PASSWORD = '2926'; // Clean and simple for easy use

export default function AdminPanel({ dbInstance, stats, onDataChanged }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Manual input form state
  const [newVoter, setNewVoter] = useState<Omit<Voter, 'id'>>({
    nid: '',
    voterNo: '',
    serialNo: 1,
    nameBn: '',
    nameEn: '',
    fatherName: '',
    motherName: '',
    dob: '',
    gender: 'Male',
    centerName: '',
    boothNo: '',
    area: '',
    constituency: 'চকরিয়া পৌরসভা (৭নং ওয়ার্ড), কক্সবাজার-১',
    isVoted: false
  });

  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Authentication validation
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DEFAULT_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
  };

  // Manual voter submission
  const handleSubmitVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Basic Validations
    if (!newVoter.nid || newVoter.nid.length < 10) {
      setFormError('জাতীয় পরিচয়পত্র নম্বর (NID) কমপক্ষে ১০ সংখ্যার হতে হবে!');
      return;
    }
    if (!newVoter.voterNo || newVoter.voterNo.length < 5) {
      setFormError('ভোটার নম্বর অবশ্যই পূরণ করতে হবে!');
      return;
    }
    if (!newVoter.nameBn || !newVoter.nameEn) {
      setFormError('ভোটার নাম (বাংলা ও ইংরেজি) উভয়ই পূরণ করুন!');
      return;
    }
    if (!newVoter.centerName) {
      setFormError('ভোট কেন্দ্রের নাম পূরণ করা বাধ্যতামূলক!');
      return;
    }

    try {
      setLoadingAction('adding_voter');
      await dbInstance.addVoter({
        ...newVoter,
        serialNo: Number(newVoter.serialNo)
      });
      setFormSuccess(`ভোটার "${newVoter.nameBn}" সফলভাবে তালিকাভুক্ত হয়েছেন!`);
      
      // Reset input form, preserving common fields
      setNewVoter({
        nid: '',
        voterNo: '',
        serialNo: Number(newVoter.serialNo) + 1, // Auto-increment serial
        nameBn: '',
        nameEn: '',
        fatherName: '',
        motherName: '',
        dob: '',
        gender: 'Male',
        centerName: newVoter.centerName, // Keep center to add multiple voters easily
        boothNo: newVoter.boothNo,
        area: newVoter.area,
        constituency: newVoter.constituency,
        isVoted: false
      });
      onDataChanged();
    } catch (err) {
      setFormError('ভোটার যুক্ত করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoadingAction(null);
    }
  };

  // CSV Bulk Importer Parser
  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError('');
    setFormSuccess('');
    setLoadingAction('importing_csv');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].toLowerCase().split(',');

        const parsedVoters: Voter[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Simple CSV parser supporting double quotes
          const values: string[] = [];
          let currentVal = '';
          let insideQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
              values.push(currentVal.trim());
              currentVal = '';
            } else {
              currentVal += char;
            }
          }
          values.push(currentVal.trim());

          if (values.length < 4) continue;

          // Map values to voter entity properties
          const voter: Partial<Voter> = {};
          headers.forEach((header, index) => {
            const val = values[index]?.replace(/^"|"$/g, '') || '';
            const key = header.trim();
            
            if (key === 'nid') voter.nid = val;
            else if (key === 'voterno' || key === 'voter_no') voter.voterNo = val;
            else if (key === 'serialno' || key === 'serial_no') voter.serialNo = parseInt(val) || 1;
            else if (key === 'namebn' || key === 'name_bn') voter.nameBn = val;
            else if (key === 'nameen' || key === 'name_en') voter.nameEn = val;
            else if (key === 'fathername' || key === 'father_name') voter.fatherName = val;
            else if (key === 'mothername' || key === 'mother_name') voter.motherName = val;
            else if (key === 'dob') voter.dob = val;
            else if (key === 'gender') voter.gender = (val.toLowerCase() === 'female' ? 'Female' : 'Male');
            else if (key === 'centername' || key === 'center_name') voter.centerName = val;
            else if (key === 'boothno' || key === 'booth_no') voter.boothNo = val;
            else if (key === 'area' || key === 'ward') voter.area = val;
            else if (key === 'constituency') voter.constituency = val;
          });

          // Ensure basic data is present
          if (voter.nameBn && voter.nid) {
            parsedVoters.push({
              id: 'v-csv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5) + '-' + i,
              nid: voter.nid,
              voterNo: voter.voterNo || String(Math.floor(10000000 + Math.random() * 90000000)),
              serialNo: voter.serialNo || i,
              nameBn: voter.nameBn,
              nameEn: voter.nameEn || 'Voter ' + i,
              fatherName: voter.fatherName || 'N/A',
              motherName: voter.motherName || 'N/A',
              dob: voter.dob || '1990-01-01',
              gender: voter.gender || 'Male',
              centerName: voter.centerName || 'প্রধান ভোট কেন্দ্র',
              boothNo: voter.boothNo || '০১',
              area: voter.area || '৭নং ওয়ার্ড, চকরিয়া পৌরসভা',
              constituency: voter.constituency || 'চকরিয়া পৌরসভা (৭নং ওয়ার্ড), কক্সবাজার-১',
              isVoted: false
            });
          }
        }

        if (parsedVoters.length === 0) {
          throw new Error('কোন সঠিক ভোটার তথ্য পাওয়া যায়নি। CSV ফরম্যাট চেক করুন।');
        }

        await dbInstance.importBulk(parsedVoters);
        setFormSuccess(`অভিনন্দন! CSV ফাইল থেকে ${toBanglaNumeral(parsedVoters.length)} জন ভোটার সফলভাবে যুক্ত করা হয়েছে।`);
        onDataChanged();
      } catch (err: any) {
        setFormError(err.message || 'CSV ইমপোর্ট করতে ব্যর্থ হয়েছে। কলাম হেডার চেক করুন।');
      } finally {
        setLoadingAction(null);
        // Clear input element
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Generate 5,000 synthetic Bangladeshi voters for massive performance proof!
  const handleSimulateLargeDatabase = async () => {
    setLoadingAction('simulating_data');
    setFormError('');
    setFormSuccess('');

    try {
      const bnFirstNames = ['মোঃ', 'মোহাম্মদ', 'আব্দুল', 'কাজী', 'সৈয়দ', 'মোসাম্মৎ', 'আফরিন', 'জান্নাতুল', 'সাদিয়া', 'রাবেয়া', 'তাহমিদ', 'হাসান', 'মাহমুদ', 'সাকিব', 'আরিফ'];
      const bnLastNames = ['রহমান', 'ইসলাম', 'হাসান', 'শেখ', 'চৌধুরী', 'খাতুন', 'আক্তার', 'বেগম', 'আলম', 'শিকদার', 'হক', 'মিয়া', 'আহমেদ', 'হোসেন', 'উদ্দিন'];
      const enFirstNames = ['Md.', 'Mohammad', 'Abdul', 'Kazi', 'Syed', 'Mosammat', 'Afrin', 'Jannatul', 'Sadia', 'Rabeya', 'Tahmid', 'Hasan', 'Mahmud', 'Sakib', 'Arif'];
      const enLastNames = ['Rahman', 'Islam', 'Hasan', 'Shekh', 'Chowdhury', 'Khatun', 'Akter', 'Begum', 'Alam', 'Sikder', 'Hok', 'Miah', 'Ahmed', 'Hossen', 'Uddin'];
      
      const centersList = [
        'চকরিয়া সরকারি উচ্চ বিদ্যালয় (কেন্দ্র-১)',
        'চকরিয়া মডেল সরকারি প্রাথমিক বিদ্যালয় (কেন্দ্র-২)'
      ];

      const areasList = [
        '৭নং ওয়ার্ড, চকরিয়া পৌরসভা',
        'মাস্টার পাড়া, চকরিয়া',
        'ভরামুহুরী, চকরিয়া',
        'হালকা পাড়া, চকরিয়া'
      ];

      const simulatedList: Voter[] = [];
      const timestamp = Date.now();

      for (let i = 1; i <= 5000; i++) {
        const randFirstIdx = Math.floor(Math.random() * bnFirstNames.length);
        const randLastIdx = Math.floor(Math.random() * bnLastNames.length);
        
        const centerIdx = Math.floor(Math.random() * centersList.length);
        const areaIdx = Math.floor(Math.random() * areasList.length);
        const gender = randFirstIdx >= 5 ? 'Female' : 'Male'; // Mosammat etc are Female

        const nid = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const voterNo = Math.floor(10000000 + Math.random() * 90000000).toString();
        
        simulatedList.push({
          id: `sim-${timestamp}-${i}`,
          nid,
          voterNo,
          serialNo: i,
          nameBn: `${bnFirstNames[randFirstIdx]} ${bnLastNames[randLastIdx]}`,
          nameEn: `${enFirstNames[randFirstIdx]} ${enLastNames[randLastIdx]}`,
          fatherName: `${bnFirstNames[Math.floor(Math.random() * 5)]} ${bnLastNames[Math.floor(Math.random() * 15)]}`,
          motherName: `মোসাম্মৎ ${bnLastNames[Math.floor(Math.random() * 5) + 5]} বেগম`,
          dob: `${Math.floor(1960 + Math.random() * 45)}-0${Math.floor(1 + Math.random() * 9)}-${Math.floor(10 + Math.random() * 18)}`,
          gender,
          centerName: centersList[centerIdx],
          boothNo: `০${Math.floor(1 + Math.random() * 6)} (${gender === 'Male' ? 'পুরুষ' : 'মহিলা'})`,
          area: areasList[areaIdx],
          constituency: 'চকরিয়া পৌরসভা (৭নং ওয়ার্ড), কক্সবাজার-১',
          isVoted: Math.random() > 0.6 // Randomly simulated cast votes
        });
      }

      await dbInstance.importBulk(simulatedList);
      setFormSuccess(`সফলভাবে ৫,০০০ জন নতুন ভোটারের ডাটাবেজ তৈরি এবং ইনডেক্স করা হয়েছে!`);
      onDataChanged();
    } catch (err) {
      setFormError('সিমুলেশন ব্যর্থ হয়েছে।');
    } finally {
      setLoadingAction(null);
    }
  };

  // Truncate DB
  const handleClearDatabase = async () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে ডাটাবেজের সমস্ত ভোটার রেকর্ড ডিলেট করতে চান? এটি রিভার্স করা যাবে না!')) {
      return;
    }

    try {
      setLoadingAction('clearing_db');
      await dbInstance.clearAllVoters();
      setFormSuccess('ডাটাবেজ সম্পূর্ণ সফলভাবে খালি করা হয়েছে।');
      onDataChanged();
    } catch (err) {
      setFormError('ডাটাবেজ ক্লিয়ার করতে সমস্যা হয়েছে।');
    } finally {
      setLoadingAction(null);
    }
  };

  // Restore defaults
  const handleResetToDefaults = async () => {
    try {
      setLoadingAction('resetting_db');
      await dbInstance.resetDatabase();
      setFormSuccess('সফলভাবে ডিফল্ট মক ডেটাবেজ পুনরুদ্ধার করা হয়েছে।');
      onDataChanged();
    } catch (err) {
      setFormError('রিসেট করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoadingAction(null);
    }
  };

  // Render password portal
  if (!isAuthenticated) {
    return (
      <div id="admin-login-card" className="max-w-md mx-auto bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xs text-center">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xs">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">এডমিন অথেনটিকেশন</h2>
        <p className="text-xs text-slate-400 mt-1.5 mb-6">নতুন ভোটার যুক্ত করা ও ডাটাবেজ ম্যানেজ করতে পাসওয়ার্ড দিন</p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">এডমিন পাসওয়ার্ড</label>
            <div className="relative">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড লিখুন..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-800 transition-all font-sans text-sm"
                required
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            {passwordError && (
              <p className="text-xs font-semibold text-rose-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {passwordError}
              </p>
            )}
          </div>

          <button 
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-xs cursor-pointer"
          >
            লগইন করুন
          </button>
        </form>
      </div>
    );
  }

  // Render Authenticated Admin Dashboard
  return (
    <div id="admin-dashboard-container" className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-bold tracking-widest uppercase">ADMIN PORTAL</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <h2 className="text-2xl font-black mt-2">এডমিন কন্ট্রোল প্যানেল</h2>
          <p className="text-xs text-slate-400 mt-1">নতুন ভোটার এড করা, ডাটাবেজ ইমপোর্ট ও ব্যাকআপ পরিচালনাকারী ড্যাশবোর্ড</p>
        </div>
        
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700/60 cursor-pointer self-start md:self-auto"
        >
          লগআউট (Logout)
        </button>
      </div>

      {/* Success/Error Alerts */}
      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-800 text-sm animate-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">সফল হয়েছে!</p>
            <p className="text-xs text-emerald-700 mt-0.5">{formSuccess}</p>
          </div>
        </div>
      )}

      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-800 text-sm animate-in slide-in-from-top-4 duration-300">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">ত্রুটি!</p>
            <p className="text-xs text-rose-700 mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Form): Add New Voter */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xs">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">নতুন ভোটার তথ্য সংযোজন</h3>
              <p className="text-xs text-slate-400">ম্যানুয়ালি ডাটাবেজে একটি নতুন ভোটার কার্ড তৈরি করুন</p>
            </div>
          </div>

          <form onSubmit={handleSubmitVoter} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* NID */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">জাতীয় পরিচয়পত্র নম্বর (NID)</label>
                <input 
                  type="text"
                  maxLength={17}
                  value={newVoter.nid}
                  onChange={(e) => setNewVoter({ ...newVoter, nid: e.target.value.replace(/\D/g, '') })}
                  placeholder="যেমন: ৩৮২৯৪০১৮২৩"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-800 text-sm transition-all font-sans"
                  required
                />
              </div>

              {/* Voter No */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">ভোটার নম্বর (Voter No)</label>
                <input 
                  type="text"
                  maxLength={12}
                  value={newVoter.voterNo}
                  onChange={(e) => setNewVoter({ ...newVoter, voterNo: e.target.value.replace(/\D/g, '') })}
                  placeholder="যেমন: ১০০২৯৩৮৪"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-800 text-sm transition-all font-sans"
                  required
                />
              </div>

              {/* Serial No */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">ভোটার তালিকা ক্রমিক নং (Serial)</label>
                <input 
                  type="number"
                  min={1}
                  value={newVoter.serialNo}
                  onChange={(e) => setNewVoter({ ...newVoter, serialNo: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-800 text-sm transition-all font-sans"
                  required
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">জন্ম তারিখ (Date of Birth)</label>
                <input 
                  type="date"
                  value={newVoter.dob}
                  onChange={(e) => setNewVoter({ ...newVoter, dob: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-800 text-sm transition-all font-sans"
                  required
                />
              </div>

              {/* Name Bangla */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">ভোটার নাম (বাংলা)</label>
                <input 
                  type="text"
                  value={newVoter.nameBn}
                  onChange={(e) => setNewVoter({ ...newVoter, nameBn: e.target.value })}
                  placeholder="যেমন: মোঃ আব্দুল লতিফ"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-800 text-sm transition-all"
                  required
                />
              </div>

              {/* Name English */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">ভোটার নাম (ইংরেজী)</label>
                <input 
                  type="text"
                  value={newVoter.nameEn}
                  onChange={(e) => setNewVoter({ ...newVoter, nameEn: e.target.value })}
                  placeholder="যেমন: Md. Abdul Latif"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-800 text-sm transition-all"
                  required
                />
              </div>

              {/* Father Name */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">পিতার নাম</label>
                <input 
                  type="text"
                  value={newVoter.fatherName}
                  onChange={(e) => setNewVoter({ ...newVoter, fatherName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-800 text-sm transition-all"
                  required
                />
              </div>

              {/* Mother Name */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">মাতার নাম</label>
                <input 
                  type="text"
                  value={newVoter.motherName}
                  onChange={(e) => setNewVoter({ ...newVoter, motherName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-800 text-sm transition-all"
                  required
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">লিঙ্গ (Gender)</label>
                <select 
                  value={newVoter.gender}
                  onChange={(e) => setNewVoter({ ...newVoter, gender: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-800 text-sm transition-all"
                >
                  <option value="Male">পুরুষ (Male)</option>
                  <option value="Female">নারী (Female)</option>
                  <option value="Other">অন্যান্য (Other)</option>
                </select>
              </div>

              {/* Booth No */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">ভোট কক্ষ নম্বর (Booth No)</label>
                <input 
                  type="text"
                  value={newVoter.boothNo}
                  onChange={(e) => setNewVoter({ ...newVoter, boothNo: e.target.value })}
                  placeholder="যেমন: ০৩ (পুরুষ)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-800 text-sm transition-all"
                  required
                />
              </div>

              {/* Constituency */}
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 block mb-1.5">নির্বাচনী আসন এলাকা (Constituency)</label>
                <input 
                  type="text"
                  value={newVoter.constituency}
                  onChange={(e) => setNewVoter({ ...newVoter, constituency: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-800 text-sm transition-all"
                  required
                />
              </div>

              {/* Center Name */}
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 block mb-1.5">ভোট কেন্দ্রের নাম</label>
                <input 
                  type="text"
                  value={newVoter.centerName}
                  onChange={(e) => setNewVoter({ ...newVoter, centerName: e.target.value })}
                  placeholder="যেমন: রমনা সরকারি মডেল প্রাথমিক বিদ্যালয় (কেন্দ্র-২)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-800 text-sm transition-all"
                  required
                />
              </div>

              {/* Area */}
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 block mb-1.5">ভোটার এলাকা / গ্রাম / ওয়ার্ড</label>
                <input 
                  type="text"
                  value={newVoter.area}
                  onChange={(e) => setNewVoter({ ...newVoter, area: e.target.value })}
                  placeholder="যেমন: হাতিরঝিল পূর্ব লেন, ৫নং ওয়ার্ড"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-800 text-sm transition-all"
                  required
                />
              </div>

            </div>

            <button 
              type="submit"
              disabled={loadingAction !== null}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
            >
              {loadingAction === 'adding_voter' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  ভোটার তালিকাভুক্ত হচ্ছে...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  নতুন ভোটার যুক্ত করুন (Add Voter)
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Columns (CSV + Bulk Database Actions) */}
        <div className="space-y-8">
          
          {/* Box 1: CSV Bulk Import */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xs">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">CSV ফাইল ইমপোর্ট</h3>
                <p className="text-[11px] text-slate-400">একসাথে হাজার হাজার ভোটার রেকর্ড এড করুন</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5 text-[11px] text-slate-500 space-y-2">
              <p className="font-bold text-slate-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-indigo-500" />
                ফাইল ফরম্যাট গাইডলাইন:
              </p>
              <p>আপনার CSV ফাইলের প্রথম লাইনে নিচের কলাম হেডারগুলো হুবহু থাকতে হবে:</p>
              <div className="bg-white p-2 rounded-lg font-mono text-[9px] text-indigo-600 overflow-x-auto select-all border border-slate-200">
                nid,voterNo,serialNo,nameBn,nameEn,fatherName,motherName,dob,gender,centerName,boothNo,area,constituency
              </div>
            </div>

            <label className="border-2 border-dashed border-slate-200 hover:border-indigo-500 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center group">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleCsvImport}
                className="hidden" 
                disabled={loadingAction !== null}
              />
              <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 transition-colors mb-2" />
              <span className="text-xs font-bold text-slate-700">ফাইল নির্বাচন করুন</span>
              <span className="text-[10px] text-slate-400 mt-1">শুধুমাত্র .CSV ফাইল সাপোর্ট করে</span>
            </label>
          </div>

          {/* Box 2: Bulk DB Simulator & DB Actions */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">ডাটাবেজ একশনস ও সিমুলেশন</h3>
                <p className="text-[11px] text-slate-400">ডাটাবেজ পরীক্ষা এবং রিসেট করার টুলস</p>
              </div>
            </div>

            {/* Simulated 5000 records */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 rounded-2xl p-4 border border-indigo-100">
              <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                হাই-ক্যাপাসিটি ডাটাবেজ টেস্ট (৫,০০০ ভোটার)
              </h4>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                এটি ইনস্ট্যান্টলি ডাটাবেজে ৫,০০০ জন ডামি ভোটার রেকর্ড জেনারেট করে যুক্ত করবে। এটি দিয়ে ভোটার সংখ্যা বাড়িয়ে স্পিড টেস্ট করতে পারেন!
              </p>
              <button 
                onClick={handleSimulateLargeDatabase}
                disabled={loadingAction !== null}
                className="w-full mt-3.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {loadingAction === 'simulating_data' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ৫,০০০ রেকর্ড জেনারেট হচ্ছে...
                  </>
                ) : (
                  '৫,০০০ ভোটার যুক্ত করুন (Simulate 5K)'
                )}
              </button>
            </div>

            {/* Clear Database + Reset defaults */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <button 
                onClick={handleResetToDefaults}
                disabled={loadingAction !== null}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loadingAction === 'resetting_db' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'ডিফল্ট ডাটাবেজ পুনরুদ্ধার করুন'
                )}
              </button>

              <button 
                onClick={handleClearDatabase}
                disabled={loadingAction !== null}
                className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border border-rose-100"
              >
                {loadingAction === 'clearing_db' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    সমস্ত ডাটা ডিলিট করুন (Clear DB)
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
