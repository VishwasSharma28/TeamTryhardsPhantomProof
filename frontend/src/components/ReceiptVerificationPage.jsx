import React, { useState, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
      setError(err.response?.data?.detail || 'Failed to scan the payment receipt.');
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
      const reportElement = document.getElementById('report-container');
      if (!reportElement) return;
      
      try {
        const canvas = await html2canvas(reportElement, {
          scale: 2,
          backgroundColor: '#111827', // Match gray-900 background
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Fraud_Report_${utr || 'Scan'}.pdf`);
      } catch (err) {
        console.error('Error generating PDF', err);
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
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Payment Receipt Verification</h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">Inspect transaction receipts and payment proofs for manipulation, forged details, or suspicious inconsistencies.</p>
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
