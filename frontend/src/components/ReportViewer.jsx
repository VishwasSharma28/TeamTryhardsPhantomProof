import React, { useState } from 'react';
import { translations } from '../i18n/translations';
import { ShieldCheck, ShieldAlert, Brain, Search, FileText, AlertTriangle } from 'lucide-react';
import PixelDNACard from './PixelDNACard';
import ContextReportCard from './ContextReportCard';
import axios from 'axios';

const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "हिंदी", flag: "🇮🇳" },
    { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
    { code: "mr", name: "मराठी", flag: "🇮🇳" },
    { code: "bn", name: "বাংলা", flag: "🇮🇳" },
    { code: "te", name: "తెలుగు", flag: "🇮🇳" },
    { code: "kn", name: "ಕನ್ನಡ", flag: "🇮🇳" },
    { code: "gu", name: "ગુજરાતી", flag: "🇮🇳" },
    { code: "ml", name: "മലയാളം", flag: "🇮🇳" },
    { code: "pa", name: "ਪੰਜਾਬੀ", flag: "🇮🇳" }
];

export default function ReportViewer({ scanResult }) {
    const [lang, setLang] = useState("en");

    const [isDownloading, setIsDownloading] = useState(false);

    if (!scanResult) return null;

    const downloadPDF = async (result, selectedLang) => {
        try {
            setIsDownloading(true);
            const requestData = {
                file_id: result.file_id || "scan_report_" + Date.now(),
                authenticity_score: result.authenticity_score || 50,
                threat_category: result.verdict === "Appears Authentic" ? "UNVERIFIED" : "MANIPULATED_MEDIA",
                risk_level: (result.authenticity_score || 50) < 40 ? "HIGH" : "LOW",
                extracted_text: result.extracted_text || "",
                verdict: result.verdict || "UNVERIFIED",
                matched_sources: result.osint?.matched_sources || [],
                flags: result.forensics?.flags || [],
                explanation: result.explanations?.conclusion || "Synthesis complete.",
                signal_breakdown: result.signals || {},
                fingerprint_match: result.osint?.fingerprint_match || ""
            };

            const response = await axios.post("http://localhost:8000/report/generate", requestData);
            
            if (response.data.report_url) {
                const downloadUrl = `http://localhost:8000/report/download/${requestData.file_id}`;
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.setAttribute('download', `${requestData.file_id}_report.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const t = translations[lang] || translations.en;
    const confidence = scanResult.authenticity_score ?? scanResult.confidence ?? 0;
    const isAuthentic = (scanResult.verdict || "").toUpperCase().includes("AUTHENTIC");
    const isSuspicious = (scanResult.verdict || "").toUpperCase().includes("SUSPICIOUS") || (scanResult.verdict || "").toUpperCase().includes("MANIPULATED");

    const badgeColor = isAuthentic
        ? 'bg-green-500/20 text-green-400 border-green-500/50'
        : isSuspicious 
           ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
           : 'bg-red-500/20 text-red-500 border-red-500/50';

    return (
        <div className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl flex flex-col">
            {/* LANGUAGE SWITCHER */}
            <div className="flex flex-wrap items-center justify-center p-4 bg-gray-950 border-b border-gray-800 gap-2">
                {languages.map(l => (
                    <button
                        key={l.code}
                        onClick={() => setLang(l.code)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${lang === l.code ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                    >
                        {l.flag} {l.name}
                    </button>
                ))}
            </div>

            <div className="p-8 space-y-8">
                {/* EXECUTIVE SUMMARY */}
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        {scanResult.title || t.title || "Image Verification Report"}
                    </h2>

                    <div className="flex justify-center">
                        <div className={`px-6 py-2 rounded-full border-2 font-bold tracking-wider text-lg shadow-lg flex items-center justify-center gap-2 ${badgeColor}`}>
                            {scanResult.verdict ? scanResult.verdict.toUpperCase() : "UNKNOWN"} • {confidence.toFixed(1)}% AUTHENTICITY
                        </div>
                    </div>

                    <div className="max-w-2xl mx-auto mt-4 p-5 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <p className="text-gray-300 text-lg leading-relaxed">
                            {scanResult.executive_summary?.[lang] || scanResult.executive_summary?.en || t.explanations.ela}
                        </p>
                    </div>

                    {scanResult.osint && (
                        <div className={`max-w-2xl mx-auto mt-6 p-6 rounded-2xl border-4 font-black text-3xl shadow-xl transition-all ${
                            (scanResult.osint.verdict === "FALSE" || scanResult.osint.verdict === "SCAM") 
                            ? 'bg-red-900/40 text-red-400 border-red-500 shadow-red-500/20' 
                            : 'bg-green-900/40 text-green-400 border-green-500 shadow-green-500/20'
                        }`}>
                            {(scanResult.osint.verdict === "FALSE" || scanResult.osint.verdict === "SCAM") ? "this image is fake" : "it is original"}
                        </div>
                    )}
                </div>

                {/* ADVANCED HACKATHON VIEW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Left Column: Evidence & Timeline */}
                    <div className="space-y-6">
                        
                        {/* Evidence Panel */}
                        <div className="bg-[#14151a] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                <ShieldAlert className="text-blue-400 w-5 h-5" />
                                <h4 className="text-lg font-semibold text-gray-200 uppercase tracking-widest">Why This Result?</h4>
                            </div>
                            <div className="space-y-4">
                                {scanResult.explanations?.forensics?.map((msg, i) => (
                                    <div key={`for-${i}`} className="flex gap-3 text-sm text-gray-300">
                                        <Search className="w-5 h-5 text-teal-400 shrink-0" />
                                        <p>{msg}</p>
                                    </div>
                                ))}
                                {scanResult.explanations?.claims?.map((msg, i) => (
                                    <div key={`claim-${i}`} className="flex gap-3 text-sm text-gray-300">
                                        <FileText className="w-5 h-5 text-purple-400 shrink-0" />
                                        <p>{msg}</p>
                                    </div>
                                ))}
                                <div className="mt-4 pt-4 border-t border-white/5 font-medium text-white flex gap-3">
                                    <Brain className="w-5 h-5 text-blue-400 shrink-0" />
                                    <p>{scanResult.explanations?.conclusion || "Synthesis complete."}</p>
                                </div>
                            </div>
                        </div>

                        {/* Timeline Engine */}
                        <div className="bg-[#14151a] border border-white/5 rounded-3xl p-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                <AlertTriangle className="text-teal-400 w-5 h-5" />
                                <h4 className="text-lg font-semibold text-gray-200 uppercase tracking-widest">Timeline Analysis</h4>
                            </div>
                            <div className="space-y-4 pl-2 border-l-2 border-white/10 ml-2">
                                {scanResult.timeline?.map((item, idx) => (
                                    <div key={idx} className="relative pl-6">
                                        <div className="absolute w-3 h-3 bg-teal-500 rounded-full -left-[23px] top-1 shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                        <div className="font-bold text-teal-300 mb-1">{item.year}</div>
                                        <div className="text-sm text-gray-400">{item.event}</div>
                                    </div>
                                ))}
                                {(!scanResult.timeline || scanResult.timeline.length === 0) && <p className="text-gray-500 text-sm">No historical footprint detected.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Reality Score Breakdown */}
                    <div className="bg-[#14151a] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col items-center">
                        <h4 className="text-lg font-semibold text-gray-200 uppercase tracking-widest w-full text-center mb-2">Reality Score Breakdown</h4>
                        <p className="text-sm text-gray-500 text-center mb-8">Component analysis of digital and semantic authenticity.</p>
                        
                        <div className="w-full space-y-6">
                            {scanResult.signals && Object.entries(scanResult.signals).map(([key, value]) => (
                                <div key={key} className="w-full">
                                    <div className="flex justify-between text-sm font-medium mb-1">
                                        <span className="uppercase text-gray-400">{key === 'ela' ? 'Compression (ELA)' : key}</span>
                                        <span className={value > 70 ? 'text-green-400' : value < 40 ? 'text-red-400' : 'text-yellow-400'}>{value}/100</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden border border-white/5">
                                        <div 
                                            className={`h-2.5 rounded-full ${value > 70 ? 'bg-green-500' : value < 40 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                                            style={{ width: `${value}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {!scanResult.signals && <div className="text-center text-gray-500 text-sm">No specific signals provided.</div>}
                        </div>
                        
                        <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 text-center w-full">
                            <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Overall Authenticity Context</span>
                            <div className="text-sm text-gray-300">
                            This Reality Score uses a weighted ensemble of pixel-level forensics, camera metadata validation, semantic scene understanding, and open-source intelligence correlation.
                            </div>
                        </div>
                    </div>

                </div>

                {/* LEGACY / VISUAL EVIDENCE SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {/* PIXEL DNA FORENSICS */}
                    {scanResult.pixel_forensics && (
                        <div className="md:col-span-2 mb-4">
                            <PixelDNACard pixelForensics={scanResult.pixel_forensics} />
                        </div>
                    )}

                    {/* CONTEXTUAL FORENSICS (Iran Prison-style) */}
                    {scanResult.context_forensics && (
                        <div className="md:col-span-2 mb-4">
                            <ContextReportCard contextForensics={scanResult.context_forensics} />
                        </div>
                    )}

                    {/* VISUAL EVIDENCE */}
                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            Visual Evidence
                        </h3>

                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs text-center text-gray-500 uppercase tracking-widest font-bold">Original</span>
                                <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-700/50 relative">
                                    {scanResult.original_image
                                        ? <img src={scanResult.original_image} alt="Original" className="w-full h-full object-cover" />
                                        : <div className="absolute inset-0 flex items-center justify-center text-gray-600">No Image</div>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs text-center text-gray-500 uppercase tracking-widest font-bold">ELA Heatmap</span>
                                <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-700/50 relative">
                                    {scanResult.visualizations?.ela_heatmap
                                        ? <img src={`data:image/png;base64,${scanResult.visualizations.ela_heatmap}`} alt="ELA Heatmap" className="w-full h-full object-cover mix-blend-screen opacity-90" />
                                        : <div className="absolute inset-0 flex items-center justify-center text-gray-600">Generating...</div>}
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-xs text-gray-400 mt-4 font-mono bg-gray-900/50 py-2 rounded-lg border border-gray-700/50">
                            <span className="text-rose-400">🔴 Edited</span> | <span>⚪ Original</span> | <span className="text-amber-400">🟡 Suspicious</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* PDF DOWNLOAD */}
            <div className="p-6 bg-gray-950 border-t border-gray-800 flex justify-center">
                <button
                    onClick={() => downloadPDF(scanResult, lang)}
                    disabled={isDownloading}
                    className={`px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    {isDownloading ? "Generating Report..." : `Download Forensic Report (${languages.find(l => l.code === lang)?.name})`}
                </button>
            </div>
        </div>
    );
}
