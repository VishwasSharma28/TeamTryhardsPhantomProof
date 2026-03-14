import React, { useState, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { QRCodeSVG } from 'qrcode.react';
import { renderToString } from 'react-dom/server';

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
        file_id,
        extracted_text,
        language_detected: analyzeRes.data.language_detected || 'en',
        ...osintRes.data
      });

    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.error || err.response?.data?.detail || err.message;
      setError(`Analysis failed: ${backendError}`);
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

  const downloadReport = async () => {
    if (!result) return;
    const vc = verdictConfig[result?.verdict] || verdictConfig['UNVERIFIED'];
    const langMap = { hi: 'Hindi', ta: 'Tamil', te: 'Telugu', kn: 'Kannada', ml: 'Malayalam', bn: 'Bengali', en: 'English' };
    const langName = langMap[result.language_detected] || result.language_detected || 'English';
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });

    const modelsHtml = (result.models_used || []).map(m =>
      `<div style="padding:8px 12px;background:#f8f9fa;border-radius:6px;border-left:3px solid #7c3aed;margin-bottom:6px;font-size:13px;color:#374151;">${m}</div>`
    ).join('');

    const sourcesHtml = (result.matched_sources || []).length > 0
      ? result.matched_sources.map(s => `<span style="display:inline-block;background:#eff6ff;color:#1d4ed8;padding:4px 12px;border-radius:20px;font-size:12px;margin:3px 4px;border:1px solid #bfdbfe;">🔗 ${s}</span>`).join('')
      : '<p style="color:#9ca3af;font-style:italic;font-size:13px;">No matching sources found in fact-check databases.</p>';

    const verdictColors = {
      VERIFIED: { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' },
      TRUE: { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' },
      UNVERIFIED: { bg: '#fffbeb', border: '#d97706', text: '#b45309' },
      SUSPICIOUS: { bg: '#fff7ed', border: '#ea580c', text: '#c2410c' },
      FALSE: { bg: '#fef2f2', border: '#dc2626', text: '#b91c1c' },
      SCAM: { bg: '#fef2f2', border: '#dc2626', text: '#b91c1c' },
    };
    const vColors = verdictColors[result.verdict] || verdictColors['UNVERIFIED'];

    const qrUrl = result.file_id ? `https://phantomproof.ai/verify/${result.file_id}` : `https://phantomproof.ai/verify/fakerpt_${Date.now()}`;
    const qrSvgString = renderToString(<QRCodeSVG value={qrUrl} size={64} level="M" fgColor="#000000" bgColor="#ffffff" />);

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>PHANTOMPROOF — Fake News Report</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Helvetica Neue', Arial, sans-serif; background:#fff; color:#000; padding:40px; line-height:1.4; }
  .header { text-align:center; border-bottom:3px solid #000; padding-bottom:24px; margin-bottom:28px; }
  .header h1 { font-size:32px; font-weight:900; color:#000; text-transform:uppercase; letter-spacing:-1px; }
  .header p { font-size:12px; font-weight:700; color:#444; margin-top:6px; text-transform:uppercase; }
  .verdict-box { padding:24px; border:2px solid #000; border-left-width:8px; background:${vColors.bg}; margin-bottom:24px; }
  .verdict-box .label { font-size:12px; text-transform:uppercase; font-weight:900; color:#000; margin-bottom:4px; }
  .verdict-box .value { font-size:28px; font-weight:900; color:${vColors.text}; }
  .verdict-box .tag { display:inline-block; font-size:11px; background:#000; color:#fff; padding:3px 12px; font-weight:900; margin-top:8px; text-transform:uppercase; }
  .section { margin-bottom:25px; }
  .section-title { font-size:13px; text-transform:uppercase; color:#000; border-bottom:2px solid #000; padding-bottom:4px; margin-bottom:15px; font-weight:900; }
  .card { background:#fff; border:1px solid #000; padding:18px; page-break-inside: avoid; }
  .ocr-text { font-family:monospace; font-size:13px; line-height:1.6; color:#000; font-weight:700; white-space:pre-wrap; background:#f8fafc; padding:15px; border:1px solid #e5e7eb; }
  .explanation { font-size:15px; line-height:1.6; color:#000; font-weight:500; }
  .footer { display:flex; justify-content:space-between; align-items:center; margin-top:50px; padding-top:20px; border-top:2px solid #000; font-size:11px; color:#000; font-weight:700; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
</style></head><body>

<div class="header">
  <h1>🛡️ PHANTOMPROOF.ai</h1>
  <p>Fake News Verification Report • Generated ${now}</p>
</div>

<div class="verdict-box">
  <div class="label">Verdict</div>
  <div class="value">${vc.icon} ${vc.label}</div>
  ${result.translated ? '<div class="tag">🌐 Translated from regional language</div>' : ''}
</div>

${result.explanation ? `
<div class="section">
  <div class="section-title">Analysis</div>
  <div class="card"><p class="explanation">${result.explanation}</p></div>
</div>` : ''}

<div class="two-col">
  <div class="section">
    <div class="section-title">Extracted Text (OCR)</div>
    <div class="card">
      <div class="ocr-text">${result.extracted_text || 'No text detected in image.'}</div>
      <p style="margin-top:8px;font-size:12px;color:#6b7280;">Language: ${langName}</p>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Fact-Check Sources</div>
    <div class="card">
      ${sourcesHtml}
      ${result.fingerprint_match ? `<div style="margin-top:12px;padding:8px 12px;background:#f3e8ff;border-radius:8px;font-size:12px;color:#7c3aed;"><strong>Known Pattern:</strong> ${result.fingerprint_match}</div>` : ''}
      ${result.ml_confidence != null ? `<div style="margin-top:8px;display:flex;justify-content:space-between;padding:8px 12px;background:#f3f4f6;border-radius:8px;font-size:12px;color:#6b7280;"><span>RoBERTa ML Confidence</span><strong style="color:#1f2937;">${result.ml_confidence}%</strong></div>` : ''}
    </div>
  </div>
</div>

${modelsHtml ? `
<div class="section">
  <div class="section-title">🤖 Models & Techniques Used</div>
  <div class="models-section">${modelsHtml}</div>
</div>` : ''}

<div class="section" style="page-break-inside: avoid;">
  <div class="section-title">How It Works</div>
  <div class="card" style="font-size:13px;line-height:1.8;color:#4b5563;">
    ${result.translated ? '<p>🌐 <strong>Step 1:</strong> Non-English text was detected and automatically translated to English.</p>' : ''}
    <p>📷 <strong>${result.translated ? 'Step 2' : 'Step 1'}:</strong> Text was extracted from the image using EasyOCR.</p>
    <p>🧠 <strong>${result.translated ? 'Step 3' : 'Step 2'}:</strong> RoBERTa AI model analyzed the text for fake news patterns.</p>
    <p>📡 <strong>${result.translated ? 'Step 4' : 'Step 3'}:</strong> Live databases from AltNews, BOOM, AFP, and PIB were searched.</p>
    <p>🔍 <strong>${result.translated ? 'Step 5' : 'Step 4'}:</strong> Text was scanned for known scam and misinformation phrases.</p>
  </div>
</div>

<div class="footer">
  <div style="text-align:left;">
    <p><strong>PHANTOMPROOF.ai — AI-Powered Image Forensics & Fake News Detection</strong></p>
    <p style="margin-top:4px;">This report was auto-generated. Always verify critical claims from official sources.</p>
    <p style="margin-top:4px;">For verification, scan the QR code or visit ${qrUrl}</p>
  </div>
  <div>
    ${qrSvgString}
  </div>
</div>

</body></html>`;

    const opt = {
      margin: 10,
      filename: `PhantomProof_FakeNews_${result.file_id || Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().from(html).set(opt).save();
    } catch (e) {
      console.error("PDF Generation Error:", e);
      alert("Failed to generate PDF. Please try again.");
    }
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
    <div className="w-full max-w-4xl mx-auto text-center px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Fake News Verification</h2>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">Analyze news screenshots, headlines, and viral claims to determine whether the content is misleading, manipulated, or unsupported.</p>
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

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => { setResult(null); setFile(null); setPreview(null); setError(null); }}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
            >
              Analyze Another Image
            </button>
            <button
              onClick={downloadReport}
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors shadow-lg border border-gray-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FakeNewsPage;