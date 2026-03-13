import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1];

export default function Hero({ onTryNow }) {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.7], [1, 0.9]);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-10 max-w-7xl mx-auto px-8 w-full text-center pt-28 pb-28"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.2 }}
          className="mb-10 flex justify-center"
        >
          <img 
            src="/asset/logo.png" 
            alt="Phantom AI Logo" 
            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:scale-105 transition-transform duration-500"
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.4 }}
          className="text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[1] mb-8 mx-auto max-w-5xl"
        >
          <span className="text-white">PHANTOM </span>
          <span className="gradient-text-accent text-glow-cyan">AI</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.6 }}
          className="text-xl md:text-2xl font-medium text-slate-300 tracking-tight mb-5"
        >
          Trust Nothing. Verify Everything.
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.75 }}
          className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12"
        >
          AI-powered verification system detecting deepfakes,
          misinformation, and manipulated media.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.9 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <button
            onClick={onTryNow}
            className="glass-button-primary px-8 py-4 group"
          >
            <span className="relative z-10 flex items-center gap-2">
              TRY NOW
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>

          <a
            href="#about"
            className="glass-button px-8 py-4 text-center border-white/10 hover:border-cyan-400/30"
          >
            Learn More
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] font-medium text-slate-600 tracking-[0.25em] uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center p-1.5"
        >
          <div className="w-1 h-1.5 rounded-full bg-cyan-400/60" />
        </motion.div>
      </motion.div>
    </section>
  );
}
