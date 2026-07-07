import React from 'react';
import { Voter } from '../types';
import { toBanglaNumeral } from './DashboardStats';

interface VoterSlipProps {
  voter: Voter;
  onClose: () => void;
}

// Simple SVG Barcode Generator based on Voter No
function generateSvgBarcode(voterNo: string) {
  const code = voterNo || "00000000";
  const bars = [];
  let x = 10;
  
  // Create a pseudo-random pattern based on characters
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i]) || 3;
    const width1 = (digit % 3) + 1;
    const width2 = ((digit + 2) % 3) + 1;
    
    // Black bar
    bars.push(<rect key={`b-${i}`} x={x} y={10} width={width1 * 2} height={40} fill="black" />);
    x += width1 * 2;
    // Gap
    x += width2 * 1.5;
  }
  
  return (
    <svg viewBox={`0 0 ${x + 10} 65`} className="w-full h-12">
      {bars}
      <text x={(x + 10) / 2} y={60} textAnchor="middle" className="font-mono text-[10px] tracking-widest fill-slate-700">
        *{code}*
      </text>
    </svg>
  );
}

export default function VoterSlip({ voter, onClose }: VoterSlipProps) {
  const handlePrint = () => {
    // We trigger window.print()
    // In index.css, we'll write @media print styles to hide everything except the voter-slip-print-container
    window.print();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      id="voter-slip-overlay" 
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:bg-white print:p-0 print:static print:h-auto print:overflow-visible cursor-pointer"
    >
      <div 
        id="voter-slip-container" 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 print:shadow-none print:border-none print:max-w-full print:w-full print:animate-none print:static cursor-default"
      >
        {/* Header - Hidden in Print */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center print:hidden">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold text-sm bg-indigo-50 px-3.5 py-1.5 rounded-xl transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            ফিরে যান (Go Back)
          </button>
          <span className="font-semibold text-slate-800 text-xs">ভোটার স্লিপ প্রিভিউ</span>
        </div>

        {/* Slip Body - Prints directly */}
        <div id="voter-slip-print-content" className="p-6 md:p-8 print:p-0">
          
          {/* Card Frame */}
          <div className="border-4 border-double border-indigo-900 p-5 rounded-xl bg-white relative overflow-hidden print:border-slate-800 print:p-6 print:rounded-none">
            {/* Watermark in background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-80 h-80 text-indigo-900">
                <path d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15Z" />
                <path fillRule="evenodd" d="M22.5 9h-21v1.5a1.5 1.5 0 0 0 1.5 1.5h18a1.5 1.5 0 0 0 1.5-1.5V9ZM2.25 13.5h19.5a.75.75 0 0 1 .75.75v3a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3v-3a.75.75 0 0 1 .75-.75Zm5.625 4.125a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm7.875-.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Official Header */}
            <div className="text-center border-b border-indigo-100 pb-4 mb-5 print:border-slate-300">
              <h1 className="text-xl font-extrabold text-indigo-950 tracking-wide print:text-black">
                চকরিয়া পৌরসভা নির্বাচন স্লিপ
              </h1>
              <p className="text-xs font-bold text-indigo-600 mt-0.5 uppercase tracking-widest print:text-slate-700">
                ELECTION VOTER SLIP
              </p>
              <div className="inline-block mt-2 bg-indigo-50 px-3 py-1 rounded-full text-[11px] font-semibold text-indigo-900 border border-indigo-100 print:border-slate-300 print:bg-slate-100 print:text-black">
                {voter.constituency}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5 items-center">
              
              {/* Photo Area / QR Code Area */}
              <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-4 h-40 print:bg-white print:border-slate-300">
                {/* Simulated QR Code for security */}
                <div className="bg-white p-2 border border-slate-200 rounded-lg shadow-2xs">
                  <svg viewBox="0 0 100 100" className="w-24 h-24 text-slate-800">
                    <rect width="100" height="100" fill="white" />
                    {/* Corners */}
                    <rect x="5" y="5" width="25" height="25" fill="black" />
                    <rect x="10" y="10" width="15" height="15" fill="white" />
                    <rect x="70" y="5" width="25" height="25" fill="black" />
                    <rect x="75" y="10" width="15" height="15" fill="white" />
                    <rect x="5" y="70" width="25" height="25" fill="black" />
                    <rect x="10" y="75" width="15" height="15" fill="white" />
                    {/* Random Blocks */}
                    <rect x="40" y="10" width="10" height="20" fill="black" />
                    <rect x="45" y="45" width="15" height="15" fill="black" />
                    <rect x="15" y="40" width="20" height="10" fill="black" />
                    <rect x="70" y="40" width="15" height="25" fill="black" />
                    <rect x="40" y="70" width="20" height="10" fill="black" />
                    <rect x="75" y="75" width="15" height="15" fill="black" />
                    <rect x="55" y="20" width="10" height="10" fill="black" />
                    <rect x="25" y="55" width="10" height="15" fill="black" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-indigo-900 mt-2 tracking-wider print:text-slate-800">SECURITY QR CODE</span>
              </div>

              {/* Voter Details */}
              <div className="md:col-span-2 space-y-2.5 text-sm">
                <div className="grid grid-cols-3 border-b border-slate-100 pb-1 print:border-slate-200">
                  <span className="text-slate-500 font-medium">ভোটার নাম (Bn):</span>
                  <span className="col-span-2 font-bold text-slate-800 print:text-black">{voter.nameBn}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 pb-1 print:border-slate-200">
                  <span className="text-slate-500 font-medium">নাম (En):</span>
                  <span className="col-span-2 font-semibold text-slate-700 print:text-black">{voter.nameEn}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 pb-1 print:border-slate-200">
                  <span className="text-slate-500 font-medium">পিতা:</span>
                  <span className="col-span-2 text-slate-800 print:text-black">{voter.fatherName}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 pb-1 print:border-slate-200">
                  <span className="text-slate-500 font-medium">মাতা:</span>
                  <span className="col-span-2 text-slate-800 print:text-black">{voter.motherName}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 pb-1 print:border-slate-200">
                  <span className="text-slate-500 font-medium">জন্ম তারিখ:</span>
                  <span className="col-span-2 font-mono text-slate-800 print:text-black">
                    {voter.dob ? toBanglaNumeral(voter.dob.split('-').reverse().join('/')) : 'N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 pb-1 print:border-slate-200">
                  <span className="text-slate-500 font-medium">জাতীয় পরিচয়পত্র:</span>
                  <span className="col-span-2 font-mono font-bold text-indigo-950 print:text-black">
                    {toBanglaNumeral(voter.nid)}
                  </span>
                </div>
              </div>
            </div>

            {/* Voting Details Highlights (Centered Box) */}
            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3 print:bg-slate-100 print:border-slate-300">
              <div className="text-center sm:border-r border-indigo-100 print:border-slate-300">
                <span className="text-[10px] font-bold uppercase text-slate-500">ভোটার ক্রমিক নং</span>
                <p className="text-lg font-extrabold text-indigo-900 mt-0.5 print:text-black">
                  {toBanglaNumeral(voter.serialNo)}
                </p>
              </div>
              <div className="text-center sm:border-r border-indigo-100 print:border-slate-300">
                <span className="text-[10px] font-bold uppercase text-slate-500">ভোটার নম্বর (Voter No)</span>
                <p className="text-lg font-extrabold text-indigo-900 mt-0.5 print:text-black">
                  {toBanglaNumeral(voter.voterNo)}
                </p>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500">ভোট কক্ষ নং (Booth)</span>
                <p className="text-lg font-extrabold text-emerald-700 mt-0.5 print:text-black">
                  {voter.boothNo}
                </p>
              </div>
            </div>

            {/* Voting Center details */}
            <div className="space-y-2 text-sm border-t border-indigo-100 pt-4 print:border-slate-300">
              <div className="flex items-start gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-indigo-600 mt-0.5 print:text-black">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.33l-7.5-5-7.5 5V21" />
                </svg>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">নির্ধারিত ভোট কেন্দ্র</span>
                  <p className="font-bold text-slate-900 text-sm sm:text-base print:text-black">{voter.centerName}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-indigo-600 mt-0.5 print:text-black">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">ভোটার এলাকা</span>
                  <p className="font-medium text-slate-800 print:text-black">{voter.area}</p>
                </div>
              </div>
            </div>

            {/* Barcode Section */}
            <div className="mt-6 border-t border-dashed border-indigo-100 pt-5 flex flex-col items-center justify-center print:border-slate-300">
              <div className="w-full max-w-xs">
                {generateSvgBarcode(voter.voterNo)}
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 text-center tracking-wide">
                * সঠিক কেন্দ্রে যেয়ে আপনার পবিত্র ভোটাধিকার প্রয়োগ করুন *
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions - Hidden in Print */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end print:hidden">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-sm transition-all"
          >
            ← ফিরে যান (Go Back)
          </button>
          <button 
            onClick={handlePrint}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-xs flex items-center gap-2 hover:shadow-md cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.617 0-1.11-.51-1.07-1.122L6.34 18m11.32 0h-11.32M9 10.5h.008v.008H9V10.5Zm3 0h.008v.008H12V10.5Zm3 0h.008v.008H15V10.5Z" />
            </svg>
            স্লিপ প্রিন্ট করুন (Print Slip)
          </button>
        </div>
      </div>
    </div>
  );
}
