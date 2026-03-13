import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1];

export default function ExtensionPromo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.8], [0, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.8], [0.9, 1, 0.95]);

  return (
    <section id="extension" ref={ref} className="relative py-20 lg:py-28">
      <motion.div 
        style={{ opacity, scale }}
        className="max-w-5xl mx-auto px-8"
      >
        <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-lg rounded-3xl p-1 shadow-2xl">
          <div className="relative rounded-2xl bg-gradient-to-br from-indigo-900/40 to-cyan-900/20 backdrop-blur-3xl p-10 md:p-14 lg:p-20 overflow-hidden text-center">
            
            {/* Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease }}
                className="text-4xl md:text-5xl lg:text-5xl font-semibold tracking-tight mb-8"
              >
                <span className="text-white">Haven't You Tried Our </span>
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Extension Yet ?
                </span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease, delay: 0.2 }}
                className="flex justify-center"
              >
                <a
                  href="https://github.com/VishwasSharma28/TeamTryhardsPhantomProof/blob/main/backend/extension_implementations.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-button-primary px-8 py-4 group inline-flex items-center justify-center"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Extension
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </a>
              </motion.div>
            </div>

          </div>
        </div>
      </motion.div>
    </section>
  );
}
