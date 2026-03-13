import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import ImageUpload from './components/ImageUpload';
import LoadingSpinner from './components/LoadingSpinner';
import ReportViewer from './components/ReportViewer';
import FakeNewsPage from './components/FakeNewsPage';
import ReceiptVerificationPage from './components/ReceiptVerificationPage';
import Dither from './components/background/Dither';

function App() {
  const [page, setPage] = useState('landing'); // 'landing' or 'app'
  const [activeTab, setActiveTab] = useState('ai-detection');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleUploadStart = () => {
    setLoading(true);
    setError(null);
    setResult(null);
  };

  const handleUploadSuccess = (data, uploadedImageUrl) => {
    setLoading(false);
    setResult(data);
    setImageUrl(uploadedImageUrl);
  };

  const handleUploadError = (errorMessage) => {
    setLoading(false);
    setError(errorMessage);
  };

  const handleReset = () => {
    setResult(null);
    setImageUrl(null);
    setError(null);
  };

  const goToApp = () => {
    setPage('app');
    window.scrollTo(0, 0);
  };

  const goToLanding = () => {
    setPage('landing');
    window.scrollTo(0, 0);
  };

  // ── Landing Page ────────────────────────────────────────────────────
  if (page === 'landing') {
    return <LandingPage onTryNow={goToApp} />;
  }

  // ── Functional App ──────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen text-white font-[Inter] selection:bg-cyan-500/30">
      {/* Background Layer */}
      <Dither />
      
      {/* App Content */}
      <div className="relative z-10">
        <header className="border-b border-white/10 bg-[#040816]/60 backdrop-blur-2xl sticky top-0 z-50 shadow-2xl">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={goToLanding} className="flex items-center gap-3 group">
            <img 
              src="/asset/logo.png" 
              alt="Phantom AI Logo" 
              className="w-12 h-12 object-contain group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all duration-300"
            />
            <h1 className="text-xl font-bold tracking-tight text-white">
              PHANTOM <span className="text-slate-400 font-normal">AI</span>
            </h1>
          </button>
          <nav>
            <span className="text-sm font-medium text-slate-400">Verification System</span>
          </nav>
        </div>
      </header>

      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-dither-fade-in relative z-10">
        {/* Navigation Toggle */}
        <div className="flex justify-center mb-12 w-full">
          <div className="glass-toggle-container max-w-2xl">
            <button 
              onClick={() => setActiveTab('fake-news')} 
              className={`glass-toggle-btn ${activeTab === 'fake-news' ? 'glass-toggle-btn-active' : ''}`}
            >
              Fake News
            </button>
            <button 
              onClick={() => setActiveTab('ai-detection')} 
              className={`glass-toggle-btn ${activeTab === 'ai-detection' ? 'glass-toggle-btn-active' : ''}`}
            >
              Deepfake AI
            </button>
            <button 
              onClick={() => setActiveTab('fake-receipt')} 
              className={`glass-toggle-btn ${activeTab === 'fake-receipt' ? 'glass-toggle-btn-active' : ''}`}
            >
              Payment Receipt
            </button>
          </div>
        </div>

        {activeTab === 'fake-news' && <FakeNewsPage />}

        {activeTab === 'fake-receipt' && <ReceiptVerificationPage />}

        {activeTab === 'ai-detection' && (
          <div className="animate-in fade-in duration-500">
            <div className="text-center max-w-4xl mx-auto mb-12">
              <h2 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-4 text-glow-base">Deepfake & Manipulation Detector</h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">Upload any image to verify its authenticity. Our advanced AI scans for digital tampering, deepfake traces, and corroborates OSINT data.</p>
            </div>

            {!loading && !result && (
              <ImageUpload
                onUploadStart={handleUploadStart}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
            )}

        {loading && <LoadingSpinner />}

        {error && (
          <div className="max-w-2xl mx-auto mt-8 bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-center">
            <p className="text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="mt-4 text-sm text-red-300 hover:text-red-200 underline">Try again</button>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ReportViewer scanResult={result} />
            <div className="text-center">
              <button
                onClick={handleReset}
                className="glass-button px-8 py-3 w-full max-w-xs shadow-xl"
              >
                Analyze Another Image
              </button>
            </div>
          </div>
        )}
          </div>
        )}
      </main>
      </div>
    </div>
  );
}

export default App;
