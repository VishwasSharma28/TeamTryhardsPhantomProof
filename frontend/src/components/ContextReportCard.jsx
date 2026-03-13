const ContextReportCard = ({ contextForensics }) => {
  if (!contextForensics) return null;

  return (
    <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-2xl">
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${
          contextForensics.total_anomalies === 0 ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {contextForensics.total_anomalies === 0 ? '✅' : '🚨'}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Contextual Forensics</h3>
          <div className="text-4xl font-mono text-slate-200">{contextForensics.risk_score}%</div>
        </div>
      </div>

      {contextForensics.report && contextForensics.report.length > 0 && (
        <div className="space-y-4 mb-6">
          {contextForensics.report.map((line, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl ${
                line.includes('✅')
                  ? 'bg-emerald-500/20 border border-emerald-500/50'
                  : 'bg-red-500/20 border border-red-500/50'
              }`}
            >
              <div className="text-sm leading-relaxed text-white">{line}</div>
            </div>
          ))}
        </div>
      )}

      {contextForensics.red_flag_check && (
        <div className="p-4 bg-gradient-to-r from-slate-800/50 to-transparent rounded-xl border border-slate-600/50">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">30-Second Red Flag</div>
          <div className="text-sm text-slate-200">{contextForensics.red_flag_check}</div>
        </div>
      )}
    </div>
  );
};

export default ContextReportCard;
