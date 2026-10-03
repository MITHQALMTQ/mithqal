import { SiteHeader } from "@/components/home/site-header";
import { HeroSection } from "@/components/home/hero-section";
import { CapabilityRail } from "@/components/home/capability-rail";
import { InstitutionalDashboard } from "@/components/institutional-dashboard";
import { SiteFooter } from "@/components/site-footer";

/**
 * MITHQAL master homepage.
 *
 * A reference-faithful, institutional, cinematic marketing surface:
 *   1. SiteHeader — absolute dark glass header (78px) overlaying the hero.
 *   2. HeroSection — full-screen hero with the institutional background
 *      image, eyebrow, three-line headline, description and dual CTAs,
 *      and the 5-capability rail anchored to its base.
 *   3. Platform section — the preserved Institutional Command Center
 *      dashboard (the existing client component), reachable via the
 *      "Explore the Platform" CTA through the #platform anchor.
 *   4. SiteFooter — pinned to the viewport bottom on short content,
 *      pushed naturally on long content (per layout.tsx flex column).
 *
 * This page is a server component. The dashboard and logo are client
 * islands that hydrate independently.
 *
 * BUILD_MODE = FROZEN. productionAuthorized = false.
 * institutionallyValidated = false. No backend changes, no secrets,
 * no fake operational functionality. Institutional language only.
 */

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection>
          <CapabilityRail />
        </HeroSection>
        <section id="platform" className="mithqal-platform-section">
          <InstitutionalDashboard />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
