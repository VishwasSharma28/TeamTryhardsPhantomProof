import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const ease = [0.22, 1, 0.36, 1];

const reviews = [
  {
    quote: "Phantom AI changed how we verify digital media. It's an indispensable tool in our editorial pipeline.",
    author: "Sarah Chen",
    role: "Head of Digital, Reuters",
    avatar: "SC",
  },
  {
    quote: "The most accurate deepfake detection system I've seen. Multi-signal analysis gives unmatched confidence.",
    author: "Dr. James Patel",
    role: "AI Research Lead, MIT Media Lab",
    avatar: "JP",
  },
  {
    quote: "Finally a system that brings transparency to AI verification. The forensic reports are court-admissible.",
    author: "Maria Gonzalez",
    role: "Senior Prosecutor, DOJ",
    avatar: "MG",
  },
  {
    quote: "An essential tool for the modern internet. We verify every image before publication now.",
    author: "Alex Thompson",
    role: "Editor-in-Chief, TechCrunch",
    avatar: "AT",
  },
  {
    quote: "Trust in digital media starts with Phantom AI. It detected manipulations invisible to the naked eye.",
    author: "Yuki Tanaka",
    role: "Cybersecurity Director, NHK",
    avatar: "YT",
  },
];

export default function Reviews() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <section ref={ref} className="relative py-28 lg:py-36 overflow-hidden">
      <div className="max-w-7xl mx-auto px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-cyan-400 tracking-widest uppercase block mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight gradient-text mb-6">
            Trusted by leaders
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Professionals worldwide trust Phantom AI for critical verification.
          </p>
        </motion.div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {reviews.map((review, i) => (
            <motion.div
              key={review.author}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease, delay: 0.15 + i * 0.08 }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`glass-panel p-7 transition-all duration-500 cursor-default ${
                hoveredIndex === i
                  ? "bg-white/[0.07] border-cyan-400/20 shadow-xl shadow-cyan-500/5 -translate-y-1 scale-[1.02]"
                  : ""
              } ${i === 3 ? "lg:col-span-2" : ""}`}
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4 text-amber-400">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-[15px] text-slate-300 leading-relaxed mb-6">
                "{review.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] font-bold text-black">
                  {review.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {review.author}
                  </div>
                  <div className="text-xs text-slate-500">{review.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
