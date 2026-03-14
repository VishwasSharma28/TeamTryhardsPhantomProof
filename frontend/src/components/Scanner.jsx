import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, FileImage, ShieldCheck, ShieldAlert, Brain, Search, FileText, AlertTriangle } from 'lucide-react';
import API_URL from '../config.js';

export default function Scanner() {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const processFile = (selectedFile) => {
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setResults(null);
            setError(null);
        } else {
            setError('Please select a valid image file.');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    const startScan = async () => {
        if (!file) return;

        setIsScanning(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_URL}/scan/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setResults(response.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || err.message || 'An error occurred during scanning.');
            // Hackathon fallback for visual demo if backend is entirely unreachable
            if (err.message === 'Network Error') {
                setError('Network Error: Could not reach the API server. Ensure backend is running and CORS is enabled.');
            }
        } finally {
            setIsScanning(false);
        }
    };

    const resetScan = () => {
        setFile(null);
        setPreviewUrl(null);
        setResults(null);
        setError(null);
    };

    return (
        <div className="w-full flex flex-col gap-8">
            {/* Upload Area */}
            {!results && !isScanning && (
                <div
                    className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-12 transition-all duration-300 ease-out flex flex-col items-center justify-center text-center cursor-pointer
            ${isDragging ? 'border-teal-400 bg-teal-400/10 scale-[1.02]' : 'border-gray-600 hover:border-blue-500 hover:bg-white/5 bg-black/20'}
            ${file ? 'border-blue-500 bg-blue-500/10' : ''}
          `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !file && fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />

                    {file ? (
                        <div className="w-full max-w-md flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                            <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group bg-black/50">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                                    <p className="text-sm font-medium text-white truncate flex items-center"><FileImage className="inline w-4 h-4 mr-2" />{file.name}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={(e) => { e.stopPropagation(); resetScan(); }}
                                    className="px-6 py-3 rounded-full font-medium border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); startScan(); }}
                                    className="px-8 py-3 rounded-full font-medium bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all"
                                >
                                    Analyze Image
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-teal-500/20 flex items-center justify-center mb-2">
                                <UploadCloud className="w-10 h-10 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-200">Drag & Drop Image</h3>
                            <p className="text-gray-400 max-w-sm">
                                Upload a JPEG, PNG, or WebP file to run AI forensics, OCR, and OSINT analysis.
                            </p>
                            <button className="mt-4 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/10">
                                Browse Files
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && !isScanning && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-400 animate-in slide-in-from-top-4">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            {/* Scanning State */}
            {isScanning && (
                <div className="flex flex-col items-center justify-center p-16 border border-white/5 bg-black/20 rounded-3xl animate-in fade-in duration-500">
                    <div className="relative w-32 h-32 mb-8">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Brain className="w-10 h-10 text-teal-400 animate-pulse" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Analyzing Image...</h3>
                    <p className="text-gray-400 text-center max-w-md">
                        Running multi-layered forensics, deepfake detection, and OSINT correlations. This may take 10-30 seconds.
                    </p>
                </div>
            )}

            {/* Results State */}
            {results && !isScanning && (
                <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-500">
                    {/* Top Header: Verdict & Score */}
                    <div className="flex flex-col md:flex-row border border-white/10 rounded-3xl overflow-hidden bg-black/40 backdrop-blur-md">
                        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 relative max-h-64 md:max-h-full">
                            {previewUrl && (
                                <img src={previewUrl} alt="Analyzed" className="w-full h-full object-cover opacity-60" />
                            )}
                        </div>
                        <div className="w-full md:w-2/3 p-8 flex flex-col justify-center">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                                <div>
                                    <p className="text-gray-400 uppercase tracking-wider text-sm font-semibold mb-1">Authenticity Score</p>
                                    <div className="text-5xl font-black text-white flex items-baseline gap-1">
                                        {results.authenticity_score ?? 'N/A'}<span className="text-3xl text-gray-500">%</span>
                                    </div>
                                </div>
                                <div className={`px-6 py-4 rounded-2xl flex items-center gap-3 border-2 ${(results.verdict || '').toUpperCase() === 'VERIFIED'
                                        ? 'border-green-500/50 bg-green-500/10 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.15)]'
                                        : 'border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
                                    }`}>
                                    {(results.verdict || '').toUpperCase() === 'VERIFIED' ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                                    <span className="text-2xl font-bold tracking-tight uppercase">{results.verdict || 'UNKNOWN'}</span>
                                </div>
                            </div>
                            <button
                                onClick={resetScan}
                                className="self-start text-sm px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors font-medium flex gap-2 items-center"
                            >
                                <UploadCloud className="w-4 h-4" /> Scan Another Image
                            </button>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Forensics */}
                        <div className="bg-[#14151a] border border-white/5 rounded-3xl p-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                <Search className="text-teal-400 w-5 h-5" />
                                <h4 className="text-lg font-semibold text-gray-200">Forensics</h4>
                            </div>
                            <pre className="text-sm text-gray-400 overflow-auto whitespace-pre-wrap font-mono custom-scrollbar max-h-60">
                                {results.forensics ? JSON.stringify(results.forensics, null, 2) : 'No forensic data'}
                            </pre>
                        </div>

                        {/* OCR */}
                        <div className="bg-[#14151a] border border-white/5 rounded-3xl p-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                <FileText className="text-blue-400 w-5 h-5" />
                                <h4 className="text-lg font-semibold text-gray-200">OCR Data</h4>
                            </div>
                            <pre className="text-sm text-gray-400 overflow-auto whitespace-pre-wrap font-mono custom-scrollbar max-h-60">
                                {results.ocr ? JSON.stringify(results.ocr, null, 2) : 'No OCR data'}
                            </pre>
                        </div>

                        {/* OSINT */}
                        <div className="bg-[#14151a] border border-white/5 rounded-3xl p-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                <Brain className="text-purple-400 w-5 h-5" />
                                <h4 className="text-lg font-semibold text-gray-200">OSINT</h4>
                            </div>
                            <pre className="text-sm text-gray-400 overflow-auto whitespace-pre-wrap font-mono custom-scrollbar max-h-60">
                                {results.osint ? JSON.stringify(results.osint, null, 2) : 'No OSINT matches'}
                            </pre>
                        </div>
                    </div>

                    {/* Full Raw JSON (Optional debug view for Hackathon, collapsed normally but let's just make it visible if needed, or omit to keep UI clean) */}
                </div>
            )}
        </div>
    );
}
