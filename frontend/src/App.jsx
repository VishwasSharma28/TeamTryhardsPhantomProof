import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import LoadingSpinner from './components/LoadingSpinner';
import ReportViewer from './components/ReportViewer';

function App() {
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

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-blue-500/30">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">PhantomProof</h1>
          </div>
          <nav>
            <span className="text-sm font-medium text-gray-400">Image Verification System</span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">Deepfake & Manipulation Detector</h2>
          <p className="text-lg text-gray-400">Upload any image to verify its authenticity. Our advanced AI scans for digital tampering, deepfake traces, and corroborates OSINT data.</p>
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
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors shadow-sm border border-gray-700 hover:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                Analyze Another Image
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
