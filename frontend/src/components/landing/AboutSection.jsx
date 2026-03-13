import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1];

const stats = [
  { value: "99.7%", label: "Detection Accuracy" },
  { value: "< 30s", label: "Analysis Time" },
  { value: "50+", label: "AI Models" },
  { value: "24/7", label: "Monitoring" },
];

export default function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);

  return (
    <section id="about" ref={ref} className="relative py-28 lg:py-36">
      <motion.div 
        style={{ opacity, scale }}
        className="max-w-7xl mx-auto px-8"
      >
        {/* Section Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
          className="text-center mb-6"
        >
          <span className="text-sm font-medium text-cyan-400 tracking-widest uppercase">
            About
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mb-8 text-center max-w-5xl mx-auto"
        >
          <span className="text-white">Creating a future where digital information can be </span>
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            trusted.
          </span>
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto text-center leading-relaxed mb-20"
        >
          Phantom AI is a next-generation verification platform that combines
          advanced machine learning, computer vision, and digital forensics to
          analyze and authenticate any piece of digital media.
        </motion.p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 lg:gap-6 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease, delay: 0.3 + i * 0.1 }}
              className="glass-panel p-6 lg:p-8 text-center group hover:bg-white/10 hover:border-white/40 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:scale-[1.05] transition-all duration-500 cursor-default"
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-300">
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-slate-500 font-medium uppercase tracking-wide">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Separator */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.2, ease, delay: 0.8 }}
          className="mt-28 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent origin-center"
        />
      </motion.div>
    </section>
  );
}
