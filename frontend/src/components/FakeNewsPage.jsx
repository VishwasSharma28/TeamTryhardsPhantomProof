import React from 'react';

const FakeNewsPage = () => {
  return (
    <div className="w-full max-w-4xl mx-auto text-center px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Fake News Verification</h2>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">Analyze news screenshots, headlines, and viral claims to determine whether the content is misleading, manipulated, or unsupported.</p>
      </div>

      <div className="glass-panel-heavy p-10 max-w-2xl mx-auto">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-cyan-500/10 rounded-full border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
            <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Module Under Development</h3>
        <p className="text-slate-400 mb-8 leading-relaxed">
          This feature is currently being integrated with our advanced language models. 
          Backend integration for fake news verification will be added soon.
        </p>
        
        <div className="border border-dashed border-white/10 rounded-2xl p-8 bg-black/20 opacity-70 cursor-not-allowed transition-all duration-300">
          <div className="flex flex-col items-center">
            <svg className="w-10 h-10 text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            <p className="text-sm font-medium text-slate-400">Upload area disabled</p>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-3 text-xs font-semibold text-cyan-300 bg-cyan-500/10 py-2.5 px-5 rounded-full inline-flex border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
          Frontend ready. Model integration pending.
        </div>
      </div>
    </div>
  );
};

export default FakeNewsPage;
