import type { ReactNode } from "react";
import { CapabilityRail } from "@/components/home/capability-rail";

/**
 * MITHQAL home — hero section.
 *
 * Full-screen hero (min-height: 100svh) layered over the institutional
 * hero background image at /assets/mithqal-hero-background.png. A
 * left-to-right dark gradient overlay preserves text legibility on the
 * left ~54% of the viewport where the hero copy lives.
 *
 * Composition (left side, ~50-54% width):
 *   1. Eyebrow — gold vertical rule + "THE INSTITUTIONAL SETTLEMENT
 *      CONTROL PLANE" (12px / 600 / 0.30em / uppercase / gold).
 *   2. Headline — three short institutional lines; the final word
 *      "Controlled." is rendered in bright gold (#F1C978).
 *   3. Description — single paragraph of institutional positioning copy.
 *   4. CTAs — primary filled gold pill + secondary outlined pill.
 *
 * The CapabilityRail is rendered as the last child of the hero so it can
 * anchor to the bottom of the section on desktop, then flow naturally
 * below the hero copy on small screens.
 *
 * Responsive breakpoints: 1200px / 900px / 620px.
 *
 * Server component — no client interactivity required. Honors
 * prefers-reduced-motion via the global stylesheet.
 */

type HeroSectionProps = {
  /** Optional override for the capability rail (defaults to <CapabilityRail />). */
  children?: ReactNode;
};

export function HeroSection({ children }: HeroSectionProps = {}) {
  return (
    <section className="mithqal-hero" id="home" aria-labelledby="mithqal-hero-title">
      {/* Background image (decorative) */}
      <div
        className="mithqal-hero-bg"
        role="img"
        aria-label="Institutional settlement control plane — abstract dark navy backdrop with gold accent geometry"
      />
      {/* Readability overlay (decorative) */}
      <div className="mithqal-hero-overlay" aria-hidden="true" />

      <div className="mithqal-hero-container">
        <div className="mithqal-hero-content">
          {/* Eyebrow */}
          <div className="mithqal-eyebrow">
            <span className="mithqal-eyebrow-rule" aria-hidden="true" />
            <span>The Institutional Settlement Control Plane</span>
          </div>

          {/* Headline */}
          <h1 id="mithqal-hero-title" className="mithqal-headline">
            Institutional Settlement.
            <br />
            Unified. Observable.
            <br />
            <span className="mithqal-gold-bright">Controlled.</span>
          </h1>

          {/* Description */}
          <p className="mithqal-hero-desc">
            MITHQAL coordinates settlement workflows, policy controls,
            reconciliation and audit-ready evidence across legally
            recognized financial rails — with institutional control,
            continuity and measurable operational visibility at the core.
          </p>

          {/* CTAs */}
          <div className="mithqal-hero-ctas">
            <a href="#platform" className="mithqal-cta-primary">
              <span>Explore the Platform</span>
              <span aria-hidden="true" className="mithqal-cta-arrow">
                →
              </span>
            </a>
            <a href="#platform" className="mithqal-cta-secondary">
              View Institutional Architecture
            </a>
          </div>
        </div>
      </div>

      {/* Capability rail (bottom-anchored on desktop, in-flow on mobile) */}
      {children ?? <CapabilityRail />}
    </section>
  );
}
