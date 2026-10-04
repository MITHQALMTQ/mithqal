import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[78px] border-b border-white/8 bg-[#000611]/68 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1380px] items-center justify-between px-[6vw]">
        <Link href="/" className="flex items-center gap-[18px]" aria-label="MITHQAL home">
          <Logo className="h-[41px] w-[41px]" />
          <span className="text-[27px] font-normal tracking-[0.27em] text-[#F5F4F1]">MITHQAL</span>
        </Link>
        <nav className="hidden items-center gap-[41px] md:flex" aria-label="Primary navigation">
          <Link href="/" className="relative py-[30px] text-[14px] text-white after:absolute after:bottom-[18px] after:left-0 after:right-0 after:h-px after:scale-x-100 after:bg-[#E7BA78] after:transition-transform">Home</Link>
          <Link href="/#platform" className="py-[30px] text-[14px] text-white/86 hover:text-white transition-colors">Features</Link>
          <Link href="/#platform" className="py-[30px] text-[14px] text-white/86 hover:text-white transition-colors">Ecosystem</Link>
          <Link href="/#platform" className="py-[30px] text-[14px] text-white/86 hover:text-white transition-colors">Roadmap</Link>
          <Link href="/#platform" className="py-[30px] text-[14px] text-white/86 hover:text-white transition-colors">About</Link>
        </nav>
        <Link href="/#platform" className="flex h-[38px] min-w-[157px] items-center justify-center gap-[10px] rounded-full border border-[#E7BA78]/90 px-5 text-[14px] text-white transition hover:bg-[#E7BA78]/8 hover:shadow-[0_0_24px_rgba(231,186,120,0.10)] hover:-translate-y-px">
          <span>Explore Platform</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </header>
  );
}
