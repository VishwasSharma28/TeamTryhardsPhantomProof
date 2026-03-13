import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-12 lg:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Moving Marquee Text */}
        <div className="relative flex overflow-x-hidden">
          <motion.div
            initial={{ x: "0%" }}
            animate={{ x: "-100%" }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex whitespace-nowrap"
          >
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-xs uppercase tracking-[0.3em] font-medium text-slate-500/40 px-8">
                made with love by <span className="text-white/40">tryhards team</span> —
              </span>
            ))}
          </motion.div>
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 flex whitespace-nowrap"
          >
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-xs uppercase tracking-[0.3em] font-medium text-slate-500/40 px-8">
                made with love by <span className="text-white/40">tryhards team</span> —
              </span>
            ))}
          </motion.div>
        </div>

        {/* Global Branding / Copyright */}
        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-center items-center gap-4 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">
            © {new Date().getFullYear()} Phantom AI. Built for the future of digital truth.
          </p>
        </div>
      </div>
    </footer>
  );
}
