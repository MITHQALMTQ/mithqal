import { ReactNode } from "react";

export function HeroSection({ children }: { children?: ReactNode }) {
  return (
    <section className="relative flex min-h-[100svh] items-stretch overflow-hidden" aria-labelledby="hero-title">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/mithqal-hero-background.png)' }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-[5]" style={{ background: 'linear-gradient(90deg, rgba(0,6,17,0.90) 0%, rgba(0,6,17,0.67) 28%, rgba(0,6,17,0.30) 51%, rgba(0,6,17,0.04) 74%, transparent 100%)' }} aria-hidden="true" />
      <div className="absolute inset-0 -z-[4]" style={{ background: 'linear-gradient(180deg, rgba(0,6,17,0.42) 0%, transparent 22%, transparent 70%, rgba(0,6,17,0.88) 100%)' }} aria-hidden="true" />
      <div className="relative z-10 mx-auto w-[min(calc(100%-clamp(48px,11.8vw,182px)),1380px)] pt-[clamp(170px,18vh,200px)] pb-[250px]">
        <div className="mb-[31px] flex items-center gap-[23px]">
          <span className="inline-block h-[20px] w-[3px] bg-[#E7BA78]" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.30em] text-[#E7BA78]">The Institutional Settlement Control Plane</span>
        </div>
        <h1 id="hero-title" className="m-0 max-w-[700px] text-[clamp(55px,5vw,78px)] font-normal leading-[0.98] tracking-[-0.045em] text-[#F5F4F1]">
          Institutional Settlement.
          <span className="block">Unified. Observable.</span>
          <span className="block text-[#F1C978]">Controlled.</span>
        </h1>
        <p className="mt-[41px] max-w-[585px] text-[clamp(16px,1.18vw,19px)] leading-[1.62] tracking-[-0.01em] text-white/90">
          MITHQAL coordinates settlement workflows, policy controls, reconciliation and audit-ready evidence across legally recognized financial rails — with institutional control, continuity and measurable operational visibility at the core.
        </p>
        <div className="mt-[31px] flex items-center gap-[19px]">
          <a href="#platform" className="inline-flex min-h-[46px] items-center justify-center gap-[11px] rounded-full bg-[#E7BA78] px-[29px] text-[14px] font-medium text-[#0a0a0a] shadow-[0_10px_35px_rgba(231,186,120,0.14)] transition hover:-translate-y-0.5 hover:bg-[#F1C978] hover:shadow-[0_14px_42px_rgba(231,186,120,0.24)]">
            Explore the Platform <span aria-hidden="true">→</span>
          </a>
          <a href="#platform" className="inline-flex min-h-[46px] items-center justify-center gap-[11px] rounded-full border border-[#E7BA78]/80 bg-[#040a12]/25 px-[29px] text-[14px] font-medium text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#E7BA78]/6">
            View Institutional Architecture
          </a>
        </div>
      </div>
      {children && (
        <div className="absolute bottom-[39px] left-1/2 z-20 w-[min(calc(100%-11.8vw),1380px)] -translate-x-1/2">
          {children}
        </div>
      )}
    </section>
  );
}
