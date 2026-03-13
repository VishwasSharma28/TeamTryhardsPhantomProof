import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1];


export default function SocialCommunity() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);

  return (
    <section id="community" ref={ref} className="relative py-28 lg:py-36">
      <motion.div 
        style={{ opacity, scale }}
        className="max-w-7xl mx-auto px-8"
      >
        <div className="glass-panel p-1">
          <div className="relative rounded-2xl bg-slate-900/40 backdrop-blur-3xl p-12 md:p-16 lg:p-24 overflow-hidden">
            {/* Dot pattern */}
            <div className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                backgroundSize: "30px 30px",
              }}
            />

            {/* Glows */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-cyan-500/8 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-blue-500/8 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative text-center">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, ease }}
                className="text-sm font-medium text-cyan-400 tracking-widest uppercase block mb-6"
              >
                Community
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6"
              >
                <span className="text-white">Join the </span>
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Community
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease, delay: 0.2 }}
                className="text-lg text-slate-400 max-w-xl mx-auto mb-12"
              >
                Post feedback, leave comments, rate Phantom AI, and connect with
                a global community dedicated to digital truth.
              </motion.p>

              {/* CTA with Glowing Effect */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease, delay: 0.3 }}
                className="relative inline-block group"
              >
                {/* Intense Outer Glow Aura */}
                <div className="absolute -inset-4 bg-white/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <a
                  href="#"
                  className="relative z-10 glass-button-primary px-10 py-5 group flex items-center gap-3 bg-white/5 border border-white/20 hover:bg-white/10 hover:border-white/40 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all duration-500 rounded-full text-lg font-semibold"
                >
                  <span className="relative z-10 text-white">Join the Community</span>
                  <svg className="relative z-10 w-5 h-5 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
