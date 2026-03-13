import React, { useState } from 'react';

const ResultsDisplay = ({ result, imageUrl }) => {
    const [reasoningOpen, setReasoningOpen] = useState(false);

    if (!result) return null;

    const score = result.authenticity_score ?? 0;
    const verdict = result.verdict ?? 'UNVERIFIED';
    const isVerified = score > 70 && verdict !== 'FALSE' && verdict !== 'SCAM';

    const badgeColor = isVerified ? 'bg-green-500' :
        score < 40 ? 'bg-red-500' : 'bg-amber-500';

    const riskColor = {
        'CRITICAL': 'text-red-400',
        'HIGH': 'text-orange-400',
        'MEDIUM': 'text-amber-400',
        'LOW': 'text-green-400',
    }[result.risk_level] ?? 'text-gray-400';

    const explainability = result.explainability;
    const modelsUsed = explainability?.models_used ?? [];
    const reasoning = explainability?.reasoning ?? [];
    const formula = explainability?.formula ?? result.formula ?? '';

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 flex flex-col gap-6">

            {/* Main Card */}
            <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-800">

                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Analysis Report</h2>
                    <div className={`px-4 py-1.5 rounded-full text-white font-bold tracking-wider text-sm shadow-lg flex items-center gap-2 ${badgeColor}`}>
                        {isVerified ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        )}
                        {verdict} — {score.toFixed(1)}%
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Image */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Analyzed Image</h3>
                        <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-950 flex items-center justify-center">
                            {imageUrl ? (
                                <img src={imageUrl} alt="Analyzed" className="max-w-full max-h-80 object-contain" />
                            ) : (
                                <div className="h-48 flex items-center justify-center text-gray-500">Image Preview</div>
                            )}
                        </div>

                        {/* Risk + Threat */}
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="bg-gray-800 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Risk Level</p>
                                <p className={`font-bold text-sm ${riskColor}`}>{result.risk_level ?? 'N/A'}</p>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Threat Category</p>
                                <p className="font-bold text-sm text-purple-400">{result.threat_category ?? 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Detailed Metrics</h3>

                        {/* Forensics Signal Breakdown */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-gray-300 font-medium mb-3">Digital Forensics</p>
                            {result.signal_breakdown ? (
                                <div className="space-y-2">
                                    {Object.entries(result.signal_breakdown).map(([key, val]) => (
                                        <div key={key} className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 bg-gray-700 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${val > 70 ? 'bg-green-500' : val > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${val}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-300 w-10 text-right">{val}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No forensics data available.</p>
                            )}
                        </div>

                        {/* OCR */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-gray-300 font-medium mb-2">Extracted Text (OCR)</p>
                            <p className="text-sm text-gray-400 whitespace-pre-wrap">
                                {result.extracted_text || 'No text detected.'}
                            </p>
                            {result.language_detected && (
                                <span className="mt-2 inline-block text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                                    Language: {result.language_detected === 'hi' ? 'Hindi' : 'English'}
                                </span>
                            )}
                        </div>

                        {/* OSINT */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-gray-300 font-medium mb-2">OSINT Verification</p>
                            {result.matched_sources && result.matched_sources.length > 0 ? (
                                <div>
                                    <p className="text-sm text-gray-400 mb-2">{result.explanation}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.matched_sources.map((src, i) => (
                                            <span key={i} className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full border border-blue-800">
                                                {src}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No OSINT matches found.</p>
                            )}
                        </div>

                        {/* Flags */}
                        {result.flags && result.flags.length > 0 && (
                            <div className="bg-gray-800 rounded-lg p-4">
                                <p className="text-gray-300 font-medium mb-2">Manipulation Flags</p>
                                <div className="flex flex-wrap gap-2">
                                    {result.flags.map((flag, i) => (
                                        <span key={i} className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded-full border border-red-800">
                                            {flag.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                EXPLAINABILITY SECTION — How We Reached This Conclusion
               ═══════════════════════════════════════════════════════════════════ */}
            {(modelsUsed.length > 0 || reasoning.length > 0) && (
                <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 overflow-hidden">

                    {/* Section Header */}
                    <div className="p-5 border-b border-gray-800 bg-gradient-to-r from-indigo-900/30 to-purple-900/20">
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
                            <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Scoring Formula</p>
                                <p className="text-sm text-indigo-300 font-mono">{formula}</p>
                            </div>
                        )}

                        {/* Models Used */}
                        {modelsUsed.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Models & Signals Used</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {modelsUsed.map((model, i) => (
                                        <div key={i} className="bg-gray-800 rounded-lg p-3 border border-gray-700/30 hover:border-gray-600/50 transition-colors">
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
                                                    <span className={`text-sm font-bold ${
                                                        model.score >= 70 ? 'text-green-400' :
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
                                            const isPositive = step.includes('consistent') || step.includes('verified') || step.includes('natural') || step.includes('No copy-move') || step.includes('AUTHENTIC') || step.includes('no significant');
                                            const isNegative = step.includes('artifacts detected') || step.includes('flagged') || step.includes('suspicious') || step.includes('FAKE') || step.includes('smoothing') || step.includes('contradicted') || step.includes('missing');
                                            
                                            let dotColor = 'bg-gray-600';
                                            if (isPositive) dotColor = 'bg-green-500';
                                            if (isNegative) dotColor = 'bg-red-500';
                                            if (isLast) dotColor = badgeColor;

                                            return (
                                                <div key={i} className="relative pl-6 py-2">
                                                    <div className={`absolute left-[-5px] top-3.5 w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-gray-900`} />
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
        </div>
    );
};

export default ResultsDisplay;