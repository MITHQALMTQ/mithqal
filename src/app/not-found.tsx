"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * MITHQAL — Custom 404 Not Found Page
 *
 * Matches the cinematic dark navy + gold aesthetic.
 * Uses Framer Motion for the headline stagger.
 */

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } };
const wordVariant = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function NotFound() {
  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-[#07090e] flex flex-col">
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.08) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      <Navbar />

      {/* Hero */}
      <section className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-6">
        <motion.div variants={container} initial="hidden" animate="visible" className="max-w-3xl">
          {/* 404 */}
          <motion.div variants={wordVariant} className="text-8xl md:text-9xl font-bold tracking-tight mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">404</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={container} className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-[1.1] mb-6">
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">This</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">path</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">does</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">not</motion.span>
            <motion.span variants={wordVariant} className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">exist.</motion.span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p variants={wordVariant} className="text-lg text-[#cbd5e1] max-w-xl mx-auto mb-10 leading-relaxed">
            The route you sought is not among the defined institutional paths. Like the architecture itself, the routes here are controlled — and this one is not among them.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={wordVariant} className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/"
              className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/30 border-2 border-amber-300"
            >
              Return to Home →
            </a>
            <a
              href="/architecture"
              className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300"
            >
              Explore Architecture
            </a>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
