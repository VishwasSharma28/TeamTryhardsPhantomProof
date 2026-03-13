import React, { useState, useRef } from 'react';
import axios from 'axios';

const FakeNewsPage = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (selectedFile) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      // Step 1: Upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadRes = await axios.post('http://localhost:8000/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const file_id = uploadRes.data.file_id;

      // Step 2: OCR → extract text
      const analyzeRes = await axios.post('http://localhost:8000/analyze/', { file_id });
      const extracted_text = analyzeRes.data.extracted_text || analyzeRes.data.ocr?.extracted_text || '';

      // Step 3: OSINT verify
      const osintRes = await axios.post('http://localhost:8000/osint/verify', {
        claim_text: extracted_text
      });

      setResult({
        extracted_text,
        language_detected: analyzeRes.data.language_detected || 'en',
        ...osintRes.data
      });

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave' && !e.currentTarget.contains(e.relatedTarget)) setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const verdictConfig = {
    VERIFIED: { color: 'text-green-400', bg: 'bg-green-900/30 border-green-700/50', icon: '✅', label: 'Verified' },
    TRUE: { color: 'text-green-400', bg: 'bg-green-900/30 border-green-700/50', icon: '✅', label: 'Verified True' },
    UNVERIFIED: { color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-700/50', icon: '⚠️', label: 'Unverified' },
    SUSPICIOUS: { color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-700/50', icon: '🔍', label: 'Suspicious' },
    FALSE: { color: 'text-red-400', bg: 'bg-red-900/30 border-red-700/50', icon: '❌', label: 'False / Fake' },
    SCAM: { color: 'text-red-400', bg: 'bg-red-900/30 border-red-700/50', icon: '🚨', label: 'Scam Detected' },
  };

  const vc = verdictConfig[result?.verdict] || verdictConfig['UNVERIFIED'];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Fake News Verification
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Upload a news screenshot or image. We extract the text, translate if needed, and verify using RoBERTa AI + trusted Indian fact-check sources.
        </p>
      </div>

      {/* Upload Zone */}
      {!result && !loading && (
        <div
          className={`relative w-full border-2 border-dashed rounded-2xl transition-colors cursor-pointer mb-6 ${dragActive ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-900/50 hover:border-purple-400 hover:bg-gray-900'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="flex flex-col items-center justify-center py-16 pointer-events-none">
            <div className="p-4 bg-purple-500/10 rounded-full mb-4">
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-gray-300 font-medium mb-1">
              <span className="text-purple-400 font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, JPEG — news screenshots, WhatsApp forwards, headlines</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 font-medium">Extracting text and verifying claim...</p>
          <p className="text-xs text-gray-600 mt-2">Translating if needed → RoBERTa → RSS fact-check</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 text-center mb-6">
          <p className="text-red-400">{error}</p>
          <button onClick={() => { setError(null); setResult(null); setFile(null); setPreview(null); }}
            className="mt-3 text-sm text-red-300 hover:text-red-200 underline">
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-500">

          {/* Verdict Banner */}
          <div className={`rounded-2xl border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${vc.bg}`}>
            <div className="flex items-center gap-4">
              <span className="text-5xl">{vc.icon}</span>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Verdict</p>
                <h3 className={`text-3xl font-black ${vc.color}`}>{vc.label}</h3>
                {result.translated && (
                  <span className="text-xs bg-purple-900/40 text-purple-400 border border-purple-700/40 px-2 py-0.5 rounded-full mt-1 inline-block">
                    🌐 Translated from regional language
                  </span>
                )}
              </div>
            </div>
            {preview && (
              <img src={preview} alt="Uploaded" className="w-24 h-24 rounded-xl object-cover border border-gray-700 shrink-0" />
            )}
          </div>

          {/* Explanation */}
          {result.explanation && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Analysis</p>
              <p className="text-gray-300 text-sm leading-relaxed">{result.explanation}</p>
            </div>
          )}

          {/* Two columns: OCR text + Sources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Extracted Text */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Extracted Text (OCR)</p>
              <div className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-950 rounded-lg p-3 max-h-48 overflow-y-auto">
                {result.extracted_text || 'No text detected in image.'}
              </div>
              {result.language_detected && (
                <span className="mt-2 inline-block text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                  Language: {result.language_detected === 'hi' ? 'Hindi' :
                    result.language_detected === 'ta' ? 'Tamil' :
                      result.language_detected === 'te' ? 'Telugu' :
                        result.language_detected === 'kn' ? 'Kannada' :
                          result.language_detected === 'ml' ? 'Malayalam' :
                            result.language_detected}
                </span>
              )}
            </div>

            {/* Matched Sources + Fingerprint */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Fact-Check Sources</p>
              {result.matched_sources?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.matched_sources.map((src, i) => (
                    <span key={i} className="text-xs bg-blue-900/30 text-blue-400 px-3 py-1.5 rounded-full border border-blue-800/50">
                      🔗 {src}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No matching sources found in fact-check databases.</p>
              )}

              {result.fingerprint_match && (
                <div className="mt-4 text-xs bg-purple-900/20 text-purple-400 px-3 py-2 rounded-lg border border-purple-900/30">
                  <span className="font-semibold">Known Pattern:</span> {result.fingerprint_match}
                </div>
              )}

              {result.ml_confidence != null && (
                <div className="mt-3 text-xs text-gray-400 flex justify-between items-center bg-gray-800/50 px-3 py-2 rounded-lg">
                  <span>RoBERTa ML Confidence</span>
                  <span className="font-bold text-gray-200">{result.ml_confidence}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Models Used Panel */}
          {result.models_used && result.models_used.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
                🤖 Models & Techniques Used
              </p>
              <div className="space-y-3">
                {[
                  {
                    key: 'EasyOCR',
                    icon: '📷',
                    name: 'EasyOCR',
                    desc: 'Extracts text from uploaded image. Supports English, Hindi, Tamil, Telugu, Kannada, Malayalam.'
                  },
                  {
                    key: 'Helsinki',
                    icon: '🌐',
                    name: 'Helsinki-NLP Translator',
                    desc: 'Translates non-English text to English before analysis. Uses opus-mt-mul-en (100+ languages).'
                  },
                  {
                    key: 'RoBERTa',
                    icon: '🧠',
                    name: 'RoBERTa Fake News Classifier',
                    desc: 'ML model trained on fake news datasets. Detects misinformation patterns in English text with 92%+ accuracy.'
                  },
                  {
                    key: 'RSS',
                    icon: '📡',
                    name: 'RSS Fact-Check Feeds',
                    desc: 'Live search across AltNews, BOOM, AFP India, and PIB for matching verified or debunked stories.'
                  },
                  {
                    key: 'Sentiment',
                    icon: '🔍',
                    name: 'Sentiment & Pattern Analysis',
                    desc: 'Scans for misinformation language signals: phishing cues, urgency patterns, chain message indicators.'
                  },
                  {
                    key: 'Fingerprint',
                    icon: '🗂️',
                    name: 'Misinformation Fingerprint DB',
                    desc: 'Database of known Indian misinformation patterns: lockdown hoaxes, UPI scams, fake PM quotes, chain messages.'
                  }
                ].map((model) => {
                  const isUsed = result.models_used.some(m => m.includes(model.key));
                  return (
                    <div key={model.key} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                      isUsed
                        ? 'bg-purple-900/20 border-purple-700/40'
                        : 'bg-gray-800/30 border-gray-700/30 opacity-40'
                    }`}>
                      <span className="text-xl shrink-0 mt-0.5">{model.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${isUsed ? 'text-purple-300' : 'text-gray-500'}`}>
                            {model.name}
                          </p>
                          {isUsed && (
                            <span className="text-xs bg-purple-800/50 text-purple-400 px-2 py-0.5 rounded-full border border-purple-700/40">
                              Used
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{model.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  How it works — in simple words
                </p>
                <div className="text-xs text-gray-400 leading-relaxed space-y-1.5">
                  {result.translated && (
                    <p>🌐 <span className="text-gray-300 font-medium">Step 1:</span> Your image had non-English text, so we automatically translated it to English first.</p>
                  )}
                  <p>📷 <span className="text-gray-300 font-medium">{result.translated ? 'Step 2' : 'Step 1'}:</span> We scanned your image and extracted all the text from it using EasyOCR.</p>
                  <p>🧠 <span className="text-gray-300 font-medium">{result.translated ? 'Step 3' : 'Step 2'}:</span> An AI model (RoBERTa) trained on thousands of real and fake news articles read the text and checked if it matches fake news patterns.</p>
                  <p>📡 <span className="text-gray-300 font-medium">{result.translated ? 'Step 4' : 'Step 3'}:</span> We searched live databases from trusted Indian fact-checkers like AltNews, BOOM, and PIB to see if this story has already been verified or debunked.</p>
                  <p>🔍 <span className="text-gray-300 font-medium">{result.translated ? 'Step 5' : 'Step 4'}:</span> We scanned the text for known scam and misinformation phrases — like "share immediately", "OTP", "free prize" and similar red flags.</p>
                  <p className="pt-1 text-gray-500 italic">Based on all of this, we gave you the verdict above.</p>
                </div>
              </div>
            </div>
          )}

          {/* Analyze Another */}
          <div className="text-center pt-4">
            <button
              onClick={() => { setResult(null); setFile(null); setPreview(null); setError(null); }}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
            >
              Analyze Another Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FakeNewsPage;