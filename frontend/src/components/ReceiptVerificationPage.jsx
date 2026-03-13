import React from 'react';

const ReceiptVerificationPage = () => {
  return (
    <div className="w-full max-w-4xl mx-auto text-center px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Payment Receipt Verification</h2>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">Inspect transaction receipts and payment proofs for manipulation, forged details, or suspicious inconsistencies.</p>
      </div>

      <div className="glass-panel-heavy p-10 max-w-2xl mx-auto">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"></path>
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Module Under Development</h3>
        <p className="text-slate-400 mb-8 leading-relaxed">
          This feature is currently being integrated with our financial document forensics engine. 
          Backend integration for receipt verification will be added soon.
        </p>
        
        <div className="border border-dashed border-white/10 rounded-2xl p-8 bg-black/20 opacity-70 cursor-not-allowed transition-all duration-300">
          <div className="flex flex-col items-center">
            <svg className="w-10 h-10 text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            <p className="text-sm font-medium text-slate-400">Upload area disabled</p>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-3 text-xs font-semibold text-emerald-300 bg-emerald-500/10 py-2.5 px-5 rounded-full inline-flex border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          Frontend ready. Model integration pending.
        </div>
      </div>
    </div>
  );
};

export default ReceiptVerificationPage;
