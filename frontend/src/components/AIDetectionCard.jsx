import { motion } from 'framer-motion';
import { Shield, Brain, Zap, Eye } from 'lucide-react';

const AIDetectionCard = ({ aiDetection }) => {
    const colors = {
        low: { bg: 'bg-emerald-900/40', ring: 'border-emerald-500/50', icon: '🟢', text: 'text-emerald-400', shadow: 'shadow-emerald-500/20' },
        med: { bg: 'bg-amber-900/40', ring: 'border-amber-500/50', icon: '🟡', text: 'text-amber-400', shadow: 'shadow-amber-500/20' },
        high: { bg: 'bg-red-900/40', ring: 'border-red-500/50', icon: '🔴', text: 'text-red-400', shadow: 'shadow-red-500/20' }
    };

    const colorSet = aiDetection?.ai_confidence < 15 ? colors.low :
        aiDetection?.ai_confidence > 85 ? colors.high : colors.med;

    if (!aiDetection) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`relative p-8 rounded-3xl shadow-2xl border ${colorSet.ring} ${colorSet.bg} backdrop-blur-3xl text-white overflow-hidden ${colorSet.shadow}`}
        >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse pointer-events-none" />

            <div className="relative flex items-start gap-6 mb-8">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: aiDetection.ai_confidence > 85 ? [0, 5, -5, 0] : [0, 0, 0, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 rounded-3xl bg-white/20 flex items-center justify-center text-5xl font-black shadow-2xl ring-4 ring-white/30"
                >
                    {colorSet.icon}
                </motion.div>

                <div className="flex-1 min-w-0">
                    <h2 className="text-3xl font-black mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
                        AI Generation Detection
                    </h2>
                    <div className={`text-6xl font-mono font-black leading-none mb-3 ${colorSet.text}`}>
                        {aiDetection.ai_confidence}%
                    </div>
                    <div className="text-lg font-semibold opacity-90 capitalize">
                        {aiDetection.ai_confidence < 15 && '✅ Authentic Photography'}
                        {aiDetection.ai_confidence > 85 && '🔴 Confirmed AI Generation'}
                        {aiDetection.ai_confidence >= 15 && aiDetection.ai_confidence <= 85 && '⚠️ Suspicious - Review Required'}
                    </div>
                </div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {aiDetection.breakdown && Object.entries(aiDetection.breakdown).map(([key, value]) => (
                    <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group p-5 bg-white/10 rounded-2xl backdrop-blur cursor-pointer hover:bg-white/20 transition-all"
                    >
                        <div className="text-3xl font-black text-center mb-2">{value}%</div>
                        <div className="text-xs uppercase tracking-wider opacity-75 text-center">{key.replace('_', ' ')}</div>
                    </motion.div>
                ))}
            </div>

            {/* Technical Details */}
            <div className="space-y-4 text-sm">
                {aiDetection.explanations?.en?.map((detail, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-white/10 rounded-xl backdrop-blur hover:bg-white/20 transition-all">
                        <div className="w-2 h-2 bg-white/80 rounded-full mt-2 flex-shrink-0" />
                        <span className="leading-relaxed">{detail}</span>
                    </div>
                ))}
            </div>

            {/* Model badge */}
            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur px-4 py-2 rounded-xl text-xs font-mono opacity-80">
                🤖 umm-maybe/AI-image-detector
            </div>
        </motion.div>
    );
};

export default AIDetectionCard;
