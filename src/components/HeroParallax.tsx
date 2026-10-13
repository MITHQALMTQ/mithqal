"use client";

import React, { useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * HeroParallax — GSAP pinning timeline controller + 2.5D layered parallax.
 *
 * Architecture (Hybrid 2.5D Illusion):
 *   - Z-Index 10: layer_0_sky.webp        → yPercent: 15 (slowest)
 *   - Z-Index 20: HTML Content (titles)     → behind mountains for depth
 *   - Z-Index 30: layer_1_mountains.webp   → yPercent: 8 (standard)
 *   - Z-Index 40: layer_2_monolith.png    → yPercent: 2 (tight) + amber aura
 *   - Z-Index 50: layer_3_foreground_rocks → yPercent: 0 (anchor)
 *
 * GSAP ScrollTrigger pins the hero section and scrubs the parallax layers.
 * Framer Motion staggers the headline word-by-word on initial load.
 *
 * Performance: layers are static <img> elements (GPU-composited transforms).
 * No WebGL here — the water shader is a separate isolated component.
 */

gsap.registerPlugin(ScrollTrigger);

// ─── Word-by-word stagger config ───────────────────────────────────
const headlineWords = "Your Digital Capital. Unified. Intelligent.".split(" ");
const subheadline = "Mithqal is the next-generation platform for AI, finance, and digital ownership — built for creators, investors, and visionaries who see beyond.";

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
};

const wordVariant = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function HeroParallax() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const mountainsRef = useRef<HTMLDivElement>(null);
  const monolithRef = useRef<HTMLDivElement>(null);
  const rocksRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pin the hero section and scrub parallax layers
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
        pin: true,
        pinSpacing: false,
      });

      // Layer parallax — different yPercent speeds create 2.5D depth
      gsap.to(skyRef.current, {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(mountainsRef.current, {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(monolithRef.current, {
        yPercent: 2,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Text block moves slightly for depth illusion
      gsap.to(textRef.current, {
        yPercent: 20,
        opacity: 0.3,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden bg-[#07090e]"
    >
      {/* Z-10: Sky layer (slowest parallax) */}
      <div
        ref={skyRef}
        className="absolute inset-0 z-10 will-change-transform"
      >
        <img
          src="/hero/layer_0_sky.webp"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Z-20: HTML Content (behind mountains for depth) */}
      <div
        ref={textRef}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 will-change-transform"
      >
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="max-w-4xl"
        >
          {/* Eyebrow */}
          <motion.div
            variants={wordVariant}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <span className="w-px h-4 bg-amber-400" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">
              The Intelligence Layer for a New Economy
            </span>
          </motion.div>

          {/* Headline — word-by-word stagger */}
          <motion.h1
            variants={container}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6"
          >
            {headlineWords.map((word, i) => (
              <motion.span
                key={i}
                variants={wordVariant}
                className="inline-block mr-[0.25em]"
              >
                {word}
              </motion.span>
            ))}
            <motion.span
              variants={wordVariant}
              className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200"
            >
              Limitless.
            </motion.span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={wordVariant}
            className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {subheadline}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={wordVariant}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="/features"
              className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/20"
            >
              Get Started →
            </a>
            <a
              href="/ecosystem"
              className="px-8 py-3 rounded-full border border-amber-500/60 text-white font-medium text-sm tracking-wide hover:bg-amber-500/10 transition-all duration-300"
            >
              Explore Ecosystem
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Z-30: Mountains layer (standard parallax) */}
      <div
        ref={mountainsRef}
        className="absolute inset-0 z-30 will-change-transform"
      >
        <img
          src="/hero/layer_1_mountains.webp"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Z-40: Monolith layer (tight parallax + amber aura) */}
      <div
        ref={monolithRef}
        className="absolute inset-0 z-40 will-change-transform"
      >
        {/* Inner amber aura glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 45%, rgba(212,175,55,0.18) 0%, transparent 50%)",
          }}
        />
        <img
          src="/hero/layer_2_monolith.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Z-50: Foreground rocks (anchor layer — no parallax) */}
      <div
        ref={rocksRef}
        className="absolute inset-x-0 bottom-0 z-50 will-change-transform"
      >
        <img
          src="/hero/layer_3_foreground_rocks.png"
          alt=""
          aria-hidden="true"
          className="w-full h-auto object-cover"
        />
      </div>
    </section>
  );
}
