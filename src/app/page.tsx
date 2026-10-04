import { SiteHeader } from "@/components/home/site-header";
import { HeroSection } from "@/components/home/hero-section";
import { CapabilityRail } from "@/components/home/capability-rail";
import { InstitutionalDashboard } from "@/components/institutional-dashboard";
import { SiteFooter } from "@/components/home/site-footer";

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection>
          <CapabilityRail />
        </HeroSection>
        <section id="platform" className="relative z-10 bg-[#000611]">
          <InstitutionalDashboard />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
