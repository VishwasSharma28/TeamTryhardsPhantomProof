import React, { useState } from 'react';
import { translations } from '../i18n/translations';
import AIDetectionCard from './AIDetectionCard';
import html2pdf from 'html2pdf.js';
import { QRCodeSVG } from 'qrcode.react';
import { renderToString } from 'react-dom/server';

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
    const [reasoningOpen, setReasoningOpen] = useState(false);
    const [explanationOpen, setExplanationOpen] = useState(true);

    if (!scanResult) return null;

    const downloadPDF = async (result, selectedLang) => {
        try {
            const fileId = result.file_id || (result.image_path ? result.image_path.split(/[\/\\]/).pop() : null) || `scan_${Date.now()}`;
            const t = translations[selectedLang] || translations.en;
            const now = new Date().toLocaleString();
            
            const qrUrl = `https://phantomproof.ai/verify/${fileId}`;
            const qrSvgString = renderToString(<QRCodeSVG value={qrUrl} size={64} level="M" fgColor="#000000" bgColor="#ffffff" />);

            // Helper to build signal bars
            const signals = result.verdict_breakdown || result.signal_breakdown || {};
            const signalsHtml = Object.entries(signals).map(([key, val]) => `
                <div style="margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; font-size:10px; color:#6b7280; margin-bottom:2px;">
                        <span style="text-transform:capitalize;">${key.replace('_', ' ')}</span>
                        <span>${val.toFixed(1)}%</span>
                    </div>
                    <div style="width:100%; height:4px; background:#e5e7eb; border-radius:2px;">
                        <div style="width:${val}%; height:100%; background:${val > 70 ? '#10b981' : val > 40 ? '#f59e0b' : '#ef4444'}; border-radius:2px;"></div>
                    </div>
                </div>
            `).join('');

            const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>PHANTOMPROOF — Forensic Analysis Report</title>
<style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',sans-serif; background:#fff; color:#1f2937; padding:40px; line-height:1.5; }
    .header { text-align:center; border-bottom:2px solid #e5e7eb; padding-bottom:20px; margin-bottom:30px; }
    .header h1 { font-size:24px; color:#2563eb; }
    .badge { display:inline-block; padding:8px 20px; border-radius:30px; font-weight:bold; font-size:18px; margin-top:10px; color:#fff; }
    .badge-verified { background:#10b981; }
    .badge-manipulated { background:#ef4444; }
    .section { margin-bottom:25px; page-break-inside: avoid; }
    .section-title { font-size:12px; font-weight:800; text-transform:uppercase; color:#6b7280; border-bottom:1px solid #e5e7eb; padding-bottom:5px; margin-bottom:12px; }
    .card { background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:15px; }
    .summary-text { font-size:14px; color:#374151; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:20px; }
    .footer { display:flex; justify-content:space-between; align-items:center; margin-top:40px; padding-top:20px; border-top:1px solid #e5e7eb; font-size:10px; color:#9ca3af; }
</style></head><body>
    <div class="header">
        <h1>🛡️ PHANTOMPROOF.ai</h1>
        <p>Advanced Forensic Media Authentication • Generated ${now}</p>
        <div class="badge ${result.verdict === 'VERIFIED' ? 'badge-verified' : 'badge-manipulated'}">
            ${result.verdict} — ${result.authenticity_score?.toFixed(1) || 0}%
        </div>
    </div>

    <div class="section">
        <div class="section-title">Executive Summary</div>
        <div class="card">
            <p class="summary-text">${result.executive_summary?.[selectedLang] || result.executive_summary?.en || "No summary available."}</p>
        </div>
    </div>

    <div class="grid">
        <div class="section">
            <div class="section-title">Forensic Signal Breakdown</div>
            <div class="card">${signalsHtml}</div>
        </div>
        <div class="section">
            <div class="section-title">OSINT & Metadata Verification</div>
            <div class="card">
                <p style="font-size:13px; color:#374151;">${result.explanation || "No OSINT findings reported."}</p>
                <div style="margin-top:10px; display:flex; flex-wrap:wrap; gap:5px;">
                    ${(result.matched_sources || []).map(s => `<span style="font-size:10px; background:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:10px;">${s}</span>`).join('')}
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">AI Ensemble Analysis</div>
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:14px;">AI Generation Likelihood</span>
                <span style="font-size:24px; font-weight:900;">${result.ai_ensemble?.total_ai_score?.toFixed(1) || 0}%</span>
            </div>
            <p style="font-size:12px; color:#6b7280; margin-top:8px;">Signals: ${Object.keys(result.ai_ensemble?.model_breakdown || {}).join(', ')}</p>
        </div>
    </div>

    <div class="footer">
        <div>
            <p><strong>PHANTOMPROOF.ai — Digital Trust & Asset Verification</strong></p>
            <p>This document serves as primary forensic evidence. Report ID: ${fileId}</p>
            <p style="margin-top:5px;">Verification: Visit ${qrUrl}</p>
        </div>
        <div>${qrSvgString}</div>
    </div>
</body></html>`;

            const opt = {
                margin: 10,
                filename: `PhantomProof_Forensics_Report_${fileId}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Create a temporary hidden element to render the HTML string
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.innerHTML = html;
            document.body.appendChild(container);

            try {
                // Generate the PDF from the temp element
                const pdfBlob = await html2pdf().from(container).set(opt).output('blob');
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = opt.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                document.body.removeChild(container);
            } catch (err) {
                console.error("PDF Generation Error:", err);
                document.body.removeChild(container);
                alert("Error generating PDF: " + err.message);
            }
        } catch (error) {
            console.error(error);
            alert("Error preparing report: " + error.message);
        }
    };

    const t = translations[lang] || translations.en;
    const confidence = scanResult.confidence || 0;
    const isVerified = scanResult.verdict === "VERIFIED";

    const badgeColor = isVerified
        ? 'bg-green-500/20 text-green-400 border-green-500/50'
        : 'bg-red-500/20 text-red-400 border-red-500/50';

    // Explainability data
    const explainability = scanResult.explainability;
    const modelsUsed = explainability?.models_used ?? [];
    const reasoning = explainability?.reasoning ?? [];
    const formula = explainability?.formula ?? '';

    // Evidence Explanation data (new)
    const explanation = scanResult.explanation;
    const hasExplanation = explanation && typeof explanation === 'object' && explanation.sections;

    return (
        <div className="w-full mx-auto rounded-3xl overflow-hidden glass-panel-heavy flex flex-col mt-4">
            {/* LANGUAGE SWITCHER REMOVED */}

            <div className="p-8 space-y-8">
                {/* EXECUTIVE SUMMARY */}
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        {scanResult.title || t.title || "Executive Summary"}
                    </h2>

                    <div className="flex justify-center">
                        <div className={`px-6 py-2 rounded-full border-2 font-bold tracking-wider text-lg shadow-lg flex items-center justify-center gap-2 ${badgeColor}`}>
                            {t.verdict[scanResult.verdict] || scanResult.verdict} • {confidence.toFixed(1)}%
                        </div>
                    </div>

                    <div className="max-w-2xl mx-auto mt-4 p-5 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <p className="text-gray-300 text-lg leading-relaxed">
                            {scanResult.executive_summary?.[lang] || scanResult.executive_summary?.en || t.explanations.ela}
                        </p>
                    </div>
                </div>

                {/* VERDICT BREAKDOWN FLOWCHART */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            How We Calculated This
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1 text-gray-300">
                                    <span>Error Level Analysis (ELA)</span>
                                    <span className="font-mono">{scanResult.verdict_breakdown?.ela_contribution?.toFixed(1) || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(100, scanResult.verdict_breakdown?.ela_contribution || 0)}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1 text-gray-300">
                                    <span>Metadata Integrity</span>
                                    <span className="font-mono">{scanResult.verdict_breakdown?.metadata_contribution?.toFixed(1) || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, scanResult.verdict_breakdown?.metadata_contribution || 0)}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1 text-gray-300">
                                    <span>Scam &amp; OSINT Patterns</span>
                                    <span className="font-mono">{scanResult.verdict_breakdown?.pattern_contribution?.toFixed(1) || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${Math.min(100, scanResult.verdict_breakdown?.pattern_contribution || 0)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI GENERATION DETECTION (METHOD 3 ENSEMBLE) */}
                    <div className="md:col-span-2 mb-4">
                        <AIDetectionCard
                            aiDetection={scanResult.ai_ensemble}
                            lang={lang}
                        />
                    </div>

                    {/* VISUAL EVIDENCE */}
                    <div className="glass-panel p-6 flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
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

                {/* ═══════════════════════════════════════════════════════════════
                    EXPLAINABILITY — How We Reached This Conclusion
                   ═══════════════════════════════════════════════════════════════ */}
                {(modelsUsed.length > 0 || reasoning.length > 0) && (
                    <div className="glass-panel overflow-hidden">

                        {/* Section Header */}
                        <div className="p-5 border-b border-gray-700 bg-gradient-to-r from-indigo-900/30 to-purple-900/20">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-indigo-600/30 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">How We Reached This Conclusion</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Breakdown of AI models, scoring weights, and decision reasoning</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">

                            {/* Scoring Formula */}
                            {formula && (
                                <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-700/50">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Scoring Formula</p>
                                    <p className="text-sm text-indigo-300 font-mono">{formula}</p>
                                </div>
                            )}

                            {/* Models Used */}
                            {modelsUsed.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Models &amp; Signals Used</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {modelsUsed.map((model, i) => (
                                            <div key={i} className="bg-gray-900 rounded-lg p-3 border border-gray-700/30 hover:border-gray-600/50 transition-colors">
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <span className="text-sm font-semibold text-gray-200">{model.name}</span>
                                                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full ml-2 shrink-0">
                                                        {model.weight}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2 leading-relaxed">{model.description}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400">Score:</span>
                                                    {typeof model.score === 'number' ? (
                                                        <span className={`text-sm font-bold ${model.score >= 70 ? 'text-green-400' :
                                                            model.score >= 40 ? 'text-amber-400' : 'text-red-400'
                                                            }`}>
                                                            {model.score}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm font-bold text-gray-300">{model.score ?? 'N/A'}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step-by-Step Reasoning */}
                            {reasoning.length > 0 && (
                                <div>
                                    <button
                                        onClick={() => setReasoningOpen(!reasoningOpen)}
                                        className="w-full flex justify-between items-center py-2 group"
                                    >
                                        <p className="text-xs text-gray-500 uppercase tracking-wider group-hover:text-gray-400 transition-colors">
                                            Step-by-Step Reasoning ({reasoning.length} steps)
                                        </p>
                                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${reasoningOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {reasoningOpen && (
                                        <div className="mt-2 space-y-0 border-l-2 border-indigo-800/50 ml-3">
                                            {reasoning.map((step, i) => {
                                                const isLast = i === reasoning.length - 1;
                                                const isPositive = step.includes('consistent') || step.includes('natural') || step.includes('no significant') || step.includes('AUTHENTIC') || step.includes('real photograph') || step.includes('low (');
                                                const isNegative = step.includes('artifacts detected') || step.includes('flagged') || step.includes('suspicious') || step.includes('AI-GENERATED') || step.includes('inconsistent') || step.includes('strong AI') || step.includes('high (');

                                                let dotColor = 'bg-gray-600';
                                                if (isPositive) dotColor = 'bg-green-500';
                                                if (isNegative) dotColor = 'bg-red-500';
                                                if (isLast) dotColor = 'bg-indigo-500';

                                                return (
                                                    <div key={i} className="relative pl-6 py-2">
                                                        <div className={`absolute left-[-5px] top-3.5 w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-gray-800`} />
                                                        <p className={`text-sm ${isLast ? 'text-white font-semibold' : 'text-gray-400'}`}>
                                                            {step}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    EVIDENCE EXPLANATION — Structured Forensic Analysis
                   ═══════════════════════════════════════════════════════════════ */}
                {hasExplanation && (
                    <div className="glass-panel overflow-hidden">

                        {/* Section Header */}
                        <button
                            onClick={() => setExplanationOpen(!explanationOpen)}
                            className="w-full p-5 border-b border-gray-700 bg-gradient-to-r from-emerald-900/30 to-teal-900/20 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-emerald-600/30 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white">Evidence Explanation</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Structured forensic analysis derived from all detection signals</p>
                                </div>
                            </div>
                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${explanationOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {explanationOpen && (
                            <div className="p-5 space-y-5">
                                {/* Digital Forensics */}
                                {explanation.sections?.digital_forensics && (
                                    <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                            <h4 className="text-sm font-bold text-purple-300 uppercase tracking-wider">Digital Forensics</h4>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            {explanation.sections.digital_forensics}
                                        </p>
                                    </div>
                                )}

                                {/* Contextual Analysis */}
                                {explanation.sections?.contextual_analysis && (
                                    <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wider">Contextual Analysis</h4>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            {explanation.sections.contextual_analysis}
                                        </p>
                                    </div>
                                )}

                                {/* Logical Consistency */}
                                {explanation.sections?.logical_consistency && (
                                    <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                            <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Logical Consistency</h4>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            {explanation.sections.logical_consistency}
                                        </p>
                                    </div>
                                )}

                                {/* Conclusion */}
                                {explanation.sections?.conclusion && (
                                    <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/60 rounded-xl p-4 border border-emerald-700/30">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">Final Conclusion</h4>
                                        </div>
                                        <p className="text-sm text-gray-200 leading-relaxed font-medium">
                                            {explanation.sections.conclusion}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    MISINFORMATION TIMELINE — Historical Reconstruction
                   ═══════════════════════════════════════════════════════════════ */}
                {scanResult.timeline_analysis?.timeline && scanResult.timeline_analysis.timeline.length > 0 && (
                    <div className="glass-panel overflow-hidden">

                        {/* Section Header */}
                        <div className="p-5 border-b border-gray-700 bg-gradient-to-r from-orange-900/30 to-red-900/20">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-orange-600/30 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white">Misinformation Timeline Analysis</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Historical spread reconstruction based on semantic matching</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-6">

                            {/* Narrative */}
                            {scanResult.timeline_analysis.timeline_explanation && (
                                <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700/50">
                                    <p className="text-sm text-gray-300 leading-relaxed italic">
                                        "{scanResult.timeline_analysis.timeline_explanation}"
                                    </p>
                                </div>
                            )}

                            {/* Events List */}
                            <div className="relative border-l-2 border-orange-800/50 ml-4 space-y-6 pt-2 pb-2">
                                {scanResult.timeline_analysis.timeline.map((eventObj, idx) => (
                                    <div key={idx} className="relative pl-6">
                                        {/* Timeline Dot */}
                                        <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-orange-500 ring-4 ring-gray-800" />

                                        <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-700/50 hover:border-orange-500/30 transition-colors">
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <span className="text-sm font-bold text-white bg-orange-500/20 px-3 py-1 rounded-md border border-orange-500/30 font-mono">
                                                    {eventObj.date || 'Unknown Date'}
                                                </span>
                                                {eventObj.confidence && (
                                                    <span className="text-xs text-gray-500 font-mono bg-gray-800 px-2 py-1 rounded">
                                                        conf: {(eventObj.confidence * 100).toFixed(0)}%
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-gray-200 text-sm mb-3">
                                                {eventObj.event}
                                            </p>

                                            {eventObj.source && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                                    Source: <span className="text-orange-300/80">{eventObj.source}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Matched Case context (if available) */}
                            {scanResult.timeline_analysis.matched_case && (
                                <div className="mt-4 pt-4 border-t border-gray-700/50">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Primary Match Reference</div>
                                    <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 flex justify-between items-center flex-wrap gap-2">
                                        <span className="text-sm text-gray-300 flex-1 truncate pr-4">
                                            "{scanResult.timeline_analysis.matched_case.claim}"
                                        </span>
                                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                                            Similarity: {(scanResult.timeline_analysis.matched_case.similarity * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>

            {/* PDF DOWNLOAD */}
            <div className="p-6 bg-black/40 border-t border-white/10 flex justify-center">
                <button
                    onClick={() => downloadPDF(scanResult, lang)}
                    className="glass-button-primary px-8 py-3"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Download Forensic Report ({languages.find(l => l.code === lang)?.name})
                </button>
            </div>
        </div>
    );
}
