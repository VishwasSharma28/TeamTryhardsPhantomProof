import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1];

const services = [
  {
    title: "Autonomous AI Verification",
    description:
      "Multi-model ensemble for deepfake detection, ELA mapping, CLIP scoring, and metadata forensics — fully autonomous.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    accent: "from-white/20 to-white/5",
    glow: "group-hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]",
  },
  {
    title: "System Integrity Enhancement",
    description:
      "Watermarking, audit trails, and tamper-evident seals to guarantee the integrity of every verified asset.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    accent: "from-white/20 to-white/5",
    glow: "group-hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]",
  },
  {
    title: "Digital Life Improvement",
    description:
      "Tools for everyone — verify screenshots, detect scam receipts, check news, and protect your digital footprint.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
    accent: "from-white/20 to-white/5",
    glow: "group-hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]",
  },
];

export default function ServicesGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);

  return (
    <section ref={ref} className="relative py-28 lg:py-36">
      <motion.div 
        style={{ opacity, scale }}
        className="max-w-7xl mx-auto px-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-emerald-400 tracking-widest uppercase block mb-4">
            Services
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight gradient-text mb-6">
            What we offer
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Three pillars of digital trust — powered by advanced AI and forensic intelligence.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease, delay: 0.2 + i * 0.15 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className={`group glass-panel p-8 lg:p-10 cursor-default transition-all duration-500 hover:shadow-2xl hover:bg-white/10 hover:border-white/40 ${service.glow}`}
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.accent} flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-500`}
              >
                {service.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-white tracking-tight mb-3">
                {service.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-400 leading-relaxed">
                {service.description}
              </p>

              {/* Bottom accent */}
              <div className="mt-8 h-px bg-gradient-to-r from-white/[0.06] to-transparent group-hover:from-white/20 transition-all duration-500" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
