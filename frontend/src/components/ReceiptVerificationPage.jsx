import React, { useState, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { QRCodeSVG } from 'qrcode.react';
import { renderToString } from 'react-dom/server';

const ReceiptVerificationPage = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError(null);
  };

  const handleScan = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/scan/payment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data.payment_analysis);
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.error || err.response?.data?.detail || err.message;
      setError(`Failed to scan the payment receipt: ${backendError}`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const renderResult = () => {
    if (!result) return null;

    const { amount_detected, bank_detected, utr, utr_valid, tampering_detected, layout_anomaly, fraud_score, verdict, explanations } = result;

    const isFraud = fraud_score > 60;
    const isSuspicious = fraud_score > 30 && fraud_score <= 60;
    const isGenuine = fraud_score <= 30;

    const getVerdictColor = () => {
      if (isFraud) return 'text-red-500 border-red-500 bg-red-500/10';
      if (isSuspicious) return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
      return 'text-emerald-500 border-emerald-500 bg-emerald-500/10';
    };

    const handleDownloadPDF = async () => {
      const now = new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });

      const verdictColors = {
        fraud: { bg: '#fef2f2', border: '#dc2626', text: '#b91c1c' },
        suspicious: { bg: '#fffbeb', border: '#d97706', text: '#b45309' },
        genuine: { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' },
      };
      const vKey = isFraud ? 'fraud' : isSuspicious ? 'suspicious' : 'genuine';
      const vColors = verdictColors[vKey];
      const verdictIcon = isFraud ? '🚨' : isSuspicious ? '⚠️' : '✅';

      const checkRow = (label, passed, passText, failText) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;">${label}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;">
            <span style="display:inline-block;padding:3px 12px;border-radius:6px;font-size:12px;font-weight:600;${
              passed
                ? 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;'
                : 'background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;'
            }">${passed ? passText : failText}</span>
          </td>
        </tr>`;

      const explanationsHtml = (explanations && explanations.length > 0)
        ? explanations.map(exp => `<li style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;font-size:13px;line-height:1.6;">${exp}</li>`).join('')
        : '';

      const qrUrl = result.file_id ? `https://phantomproof.ai/verify/${result.file_id}` : `https://phantomproof.ai/verify/rcpt_${Date.now()}`;
      const qrSvgString = renderToString(<QRCodeSVG value={qrUrl} size={64} level="M" fgColor="#000000" bgColor="#ffffff" />);

      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>PHANTOMPROOF — Payment Receipt Report</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Helvetica Neue', Arial, sans-serif; background:#fff; color:#000; padding:40px; line-height:1.4; }
  .header { text-align:center; border-bottom:3px solid #000; padding-bottom:24px; margin-bottom:28px; }
  .header h1 { font-size:32px; font-weight:900; color:#000; text-transform:uppercase; letter-spacing:-1px; }
  .header p { font-size:12px; font-weight:700; color:#444; margin-top:6px; text-transform:uppercase; }
  .verdict-box { padding:24px; border:2px solid #000; border-left-width:8px; background:${vColors.bg}; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; }
  .verdict-box .label { font-size:12px; text-transform:uppercase; font-weight:900; color:#000; margin-bottom:4px; }
  .verdict-box .value { font-size:28px; font-weight:900; color:${vColors.text}; }
  .verdict-box .score { text-align:right; }
  .verdict-box .score-value { font-size:36px; font-weight:900; color:${vColors.text}; }
  .verdict-box .score-label { font-size:12px; color:#000; font-weight:900; text-transform:uppercase; }
  .section { margin-bottom:25px; }
  .section-title { font-size:13px; text-transform:uppercase; color:#000; border-bottom:2px solid #000; padding-bottom:4px; margin-bottom:12px; font-weight:900; }
  .details-grid { display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:24px; page-break-inside: avoid; }
  .section-title { font-size:13px; text-transform:uppercase; color:#000; border-bottom:2px solid #000; padding-bottom:4px; margin-bottom:15px; font-weight:900; }
  .card { background:#fff; border:1px solid #000; padding:18px; page-break-inside: avoid; }
  .ocr-text { font-family:monospace; font-size:13px; line-height:1.6; color:#000; font-weight:700; white-space:pre-wrap; background:#f8fafc; padding:15px; border:1px solid #e5e7eb; }
  .explanation { font-size:15px; line-height:1.6; color:#000; font-weight:500; }
  .footer { display:flex; justify-content:space-between; align-items:center; margin-top:50px; padding-top:20px; border-top:2px solid #000; font-size:11px; color:#000; font-weight:700; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
</style></head><body>

<div class="header">
  <h1>🛡️ PHANTOMPROOF.ai</h1>
  <p>Payment Receipt Verification Report • Generated ${now}</p>
</div>

<div class="verdict-box">
  <div>
    <div class="label">Verdict</div>
    <div class="value">${verdictIcon} ${verdict}</div>
  </div>
  <div class="score">
    <div class="score-label">Fraud Score</div>
    <div class="score-value">${fraud_score}/100</div>
  </div>
</div>

<div class="details-grid">
  <div class="detail-card">
    <div class="label">Detected Amount</div>
    <div class="value">${amount_detected || 'N/A'}</div>
  </div>
  <div class="detail-card">
    <div class="label">Detected Bank</div>
    <div class="value">${bank_detected || 'N/A'}</div>
  </div>
  <div class="detail-card">
    <div class="label">Extracted UTR</div>
    <div class="value" style="font-family:monospace;">${utr || 'N/A'}</div>
  </div>
  <div class="detail-card">
    <div class="label">UTR Format</div>
    <div class="value">${utr_valid ? '✅ Valid' : '❌ Invalid'}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Verification Checks</div>
  <table>
    <thead><tr><th>Check</th><th>Result</th></tr></thead>
    <tbody>
      ${checkRow('UTR Format Valid', utr_valid, '✅ Passed', '❌ Failed')}
      ${checkRow('Image Tampering (ELA)', !tampering_detected, '✅ No Tampering', '❌ Detected')}
      ${checkRow('Layout Consistency', !layout_anomaly, '✅ Consistent', '❌ Anomalous')}
    </tbody>
  </table>
</div>

${explanationsHtml ? `
<div class="section" style="page-break-inside: avoid;">
  <div class="section-title">Analysis Explanations</div>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;">
    <ol style="margin:0;padding-left:20px;list-style:decimal;">
      ${explanationsHtml}
    </ol>
  </div>
</div>` : ''}

<div class="footer">
  <div style="text-align:left;">
    <p><strong>PHANTOMPROOF.ai — AI-Powered Image Forensics & Payment Fraud Detection</strong></p>
    <p style="margin-top:4px;">This report was auto-generated. Always cross-verify with your bank for official transaction status.</p>
    <p style="margin-top:4px;">For verification, scan the QR code or visit ${qrUrl}</p>
  </div>
  <div>
    ${qrSvgString}
  </div>
</div>

</body></html>`;

      const opt = {
        margin: 10,
        filename: `PhantomProof_Receipt_${result.file_id || Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        await html2pdf().from(html).set(opt).save();
      } catch (e) {
        console.error("PDF Generation Error:", e);
        alert("Failed to generate PDF. Please try again.");
      }
    };

    return (
      <div id="report-container" className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-3xl mx-auto shadow-2xl text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Analysis Report</h3>
          <div className={`px-4 py-2 rounded-full border-2 font-bold uppercase tracking-wider ${getVerdictColor()}`}>
            {verdict}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Detected Amount</p>
            <p className="text-xl font-semibold text-white">{amount_detected}</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Detected Bank</p>
            <p className="text-xl font-semibold text-white">{bank_detected}</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Extracted UTR</p>
            <p className="text-xl font-semibold text-white">{utr}</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Fraud Score</p>
            <p className={`text-xl font-black ${isFraud ? 'text-red-400' : isSuspicious ? 'text-yellow-400' : 'text-emerald-400'}`}>
              {fraud_score} / 100
            </p>
          </div>
        </div>

        <h4 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">Verification Checks</h4>
        <ul className="space-y-3">
          <li className="flex items-center justify-between bg-gray-800/30 p-3 rounded-lg border border-gray-800 p-4">
            <span className="text-gray-300">UTR Format Valid</span>
            {utr_valid ? (
              <span className="text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1 rounded-md">Passed</span>
            ) : (
              <span className="text-red-400 font-medium bg-red-500/10 px-3 py-1 rounded-md">Failed</span>
            )}
          </li>
          <li className="flex items-center justify-between bg-gray-800/30 p-3 rounded-lg border border-gray-800 p-4">
            <span className="text-gray-300">Image Tampering (ELA)</span>
            {!tampering_detected ? (
              <span className="text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1 rounded-md">No Tampering</span>
            ) : (
              <span className="text-red-400 font-medium bg-red-500/10 px-3 py-1 rounded-md">Detected</span>
            )}
          </li>
          <li className="flex items-center justify-between bg-gray-800/30 p-3 rounded-lg border border-gray-800 p-4">
            <span className="text-gray-300">Layout Consistency</span>
            {!layout_anomaly ? (
              <span className="text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1 rounded-md">Consistent</span>
            ) : (
              <span className="text-red-400 font-medium bg-red-500/10 px-3 py-1 rounded-md">Anomalous</span>
            )}
          </li>
        </ul>

        {explanations && explanations.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">Analysis Explanations</h4>
            <div className="bg-gray-800/20 rounded-xl p-5 border border-gray-800">
              <ul className="space-y-4">
                {explanations.map((exp, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-gray-300 leading-relaxed">{exp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 border-t border-gray-800 pt-8" data-html2canvas-ignore>
          <button onClick={handleDownloadPDF} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Download Complete Report
          </button>
          <button onClick={reset} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors border border-gray-700">
            Scan Another Receipt
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto text-center px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Payment Receipt Verification</h2>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">Inspect transaction receipts and payment proofs for manipulation, forged details, or suspicious inconsistencies.</p>
      </div>

      {!result && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-2xl mx-auto shadow-2xl">
          {!file ? (
            <div
              className={`relative flex flex-col items-center justify-center w-full min-h-[16rem] border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                dragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-600 bg-gray-800/50 hover:bg-gray-800 hover:border-emerald-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current.click()}
            >
              <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={handleChange} />
              <div className="flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                <svg className="w-12 h-12 text-emerald-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                <p className="mb-2 text-sm text-gray-300">
                  <span className="font-semibold text-emerald-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">Supported: Screenshots of payment confirmations (JPEG, PNG)</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-in fade-in duration-300">
              <img src={preview} alt="Preview" className="max-h-64 rounded-xl border border-gray-700 object-contain shadow-lg mb-6" />
              <div className="flex gap-4">
                <button onClick={reset} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors border border-gray-700">
                  Cancel
                </button>
                <button
                  onClick={handleScan}
                  disabled={loading}
                  className="px-8 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scanning...
                    </>
                  ) : (
                    'Run Fraud Analysis'
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm animate-in slide-in-from-top-2">
              {error}
            </div>
          )}
        </div>
      )}

      {renderResult()}
    </div>
  );
};

export default ReceiptVerificationPage;
