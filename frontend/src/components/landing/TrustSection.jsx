import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1];

const pillars = [
  {
    title: "Explainable AI",
    description: "Every decision our models make is transparent and interpretable. You see exactly why content was flagged.",
    icon: "💡",
  },
  {
    title: "Forensic Evidence",
    description: "ELA heatmaps, EXIF metadata, pixel-level analysis, and OSINT corroboration — courtroom-grade evidence.",
    icon: "🔬",
  },
  {
    title: "Authenticity Scoring",
    description: "A comprehensive 0–100 score derived from 5 independent AI signals, weighted and calibrated for accuracy.",
    icon: "📊",
  },
];

export default function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-28 lg:py-36">
      <div className="max-w-7xl mx-auto px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-emerald-400 tracking-widest uppercase block mb-4">
            Transparency
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
            <span className="text-white">Built on </span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Transparency
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Trust starts with openness. Every analysis provides full forensic breakdown.
          </p>
        </motion.div>

        {/* Pillars */}
        <div className="grid md:grid-cols-3 gap-8 mb-20 max-w-5xl mx-auto">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease, delay: 0.2 + i * 0.15 }}
              className="text-center group"
            >
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-500">
                {pillar.icon}
              </div>
              <h3 className="text-xl font-semibold text-white tracking-tight mb-3">
                {pillar.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Cinematic visual */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease, delay: 0.6 }}
          className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-lg rounded-3xl p-1 max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl bg-gradient-to-br from-phantom-800 to-phantom-900 p-12 lg:p-16 overflow-hidden">
            {/* Grid */}
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />
            <div className="relative text-center">
              <div className="text-7xl md:text-9xl font-bold gradient-text-accent text-glow-cyan mb-4">
                100%
              </div>
              <div className="text-xl md:text-2xl font-semibold text-white mb-2">
                Full Transparency
              </div>
              <p className="text-slate-400 max-w-md mx-auto">
                Every analysis comes with a full breakdown of signals, scores, and forensic evidence.
              </p>
            </div>
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
