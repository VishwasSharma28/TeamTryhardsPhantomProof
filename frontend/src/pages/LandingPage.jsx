import { useEffect } from "react";
import Lenis from "lenis";

import AnimatedBackground from "../components/landing/AnimatedBackground";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import AboutSection from "../components/landing/AboutSection";
import WhyPhantom from "../components/landing/WhyPhantom";
import ServicesGrid from "../components/landing/ServicesGrid";
import TrustSection from "../components/landing/TrustSection";
import Reviews from "../components/landing/Reviews";
import SocialCommunity from "../components/landing/SocialCommunity";
import ExtensionPromo from "../components/landing/ExtensionPromo";
import Footer from "../components/landing/Footer";

export default function LandingPage({ onTryNow }) {
  // ── Lenis Smooth Scroll ──────────────────────────────────────────────
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <div className="relative min-h-screen bg-phantom-900 text-white selection:bg-indigo-500/30 noise-overlay">
      <AnimatedBackground />
      <Navbar onTryNow={onTryNow} />
      <Hero onTryNow={onTryNow} />
      <AboutSection />
      <WhyPhantom />
      <ServicesGrid />
      <TrustSection />
      <Reviews />
      <SocialCommunity />
      <ExtensionPromo />
      <Footer />
    </div>
  );
}
