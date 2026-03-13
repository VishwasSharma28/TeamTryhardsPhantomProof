import React from 'react';

const FakeNewsPage = () => {
  return (
    <div className="w-full max-w-4xl mx-auto text-center px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Fake News Verification</h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">Analyze news screenshots, headlines, and viral claims to determine whether the content is misleading, manipulated, or unsupported.</p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-10 max-w-2xl mx-auto shadow-2xl backdrop-blur-sm">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-purple-500/10 rounded-full">
            <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">Module Under Development</h3>
        <p className="text-gray-400 mb-8 leading-relaxed">
          This feature is currently being integrated with our advanced language models. 
          Backend integration for fake news verification will be added soon.
        </p>
        
        <div className="border-2 border-dashed border-gray-700/50 rounded-xl p-8 bg-gray-950/30 opacity-60 cursor-not-allowed">
          <div className="flex flex-col items-center">
            <svg className="w-10 h-10 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            <p className="text-sm font-medium text-gray-500">Upload area disabled</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-purple-400/80 bg-purple-500/10 py-2 px-4 rounded-full inline-flex border border-purple-500/20">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
          Frontend ready. Model integration pending.
        </div>
      </div>
    </div>
  );
};

export default FakeNewsPage;
