import React from 'react';

const ResultsDisplay = ({ result, imageUrl }) => {
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

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-800">

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
    );
};

export default ResultsDisplay;