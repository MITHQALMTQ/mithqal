import { ArrowLeft, ExternalLink, Download, Film, Maximize2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "MITHQAL — Circle Hackathon Demo",
  description: "Professional demo video package for Circle Hackathon submission",
};

const scenes = [
  { num: 1, title: "The Problem", time: "0:00–0:15", type: "Motion Graphic", desc: "Cross-border settlement pain points" },
  { num: 2, title: "Why Circle", time: "0:15–0:35", type: "Motion Graphic", desc: "USDC as operational liquidity layer" },
  { num: 3, title: "What is MITHQAL", time: "0:35–0:55", type: "Motion Graphic", desc: "Architecture + constitutional invariants" },
  { num: 4, title: "Live MVP", time: "0:55–1:40", type: "Screen Recording", desc: "Real dashboard at mithqal.vercel.app" },
  { num: 5, title: "Smart Contracts", time: "1:40–2:05", type: "Screen Recording", desc: "9 verified contracts on Monad Explorer" },
  { num: 6, title: "GitHub", time: "2:05–2:25", type: "Screen Recording", desc: "Open source repository" },
  { num: 7, title: "Security", time: "2:25–2:45", type: "Motion Graphic", desc: "Certora spec, Foundry, input guards" },
  { num: 8, title: "Circle Integration", time: "2:45–3:05", type: "Motion Graphic", desc: "Implemented ✓ vs Planned →" },
  { num: 9, title: "Technology Stack", time: "3:05–3:20", type: "Motion Graphic", desc: "Solidity, Monad, Foundry, Next.js, Circle" },
  { num: 10, title: "Closing", time: "3:20–3:35", type: "Motion Graphic", desc: "MITHQAL logo + URL" },
];

export default function VideoPage() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" />
            Back to MITHQAL
          </Link>
          <div className="flex items-center gap-2 text-sm text-[#C9A961]">
            <Film className="h-4 w-4" />
            Circle Hackathon Demo
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-light tracking-wide">
            MITHQAL Demo Video
          </h1>
          <p className="text-sm text-white/50">
            Circle Hackathon Submission — 3 minutes 35 seconds
          </p>
        </div>

        {/* Auto-playing Motion Graphics — fills the viewport */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#C9A961]">
              <Maximize2 className="h-4 w-4" />
              Motion Graphics — Auto-playing
            </h2>
            <a
              href="/video/mithqal-motion-graphics.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#C9A961] hover:text-[#E8C97A] transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open full screen
            </a>
          </div>
          {/* Responsive 16:9 container that fits the viewport */}
          <div className="relative w-full overflow-hidden rounded-xl border border-[#C9A961]/20 bg-black"
               style={{ aspectRatio: "16 / 9" }}>
            <iframe
              src="/video/mithqal-motion-graphics.html"
              className="absolute inset-0 h-full w-full"
              title="MITHQAL Motion Graphics"
              allow="autoplay"
            />
          </div>
          <p className="mt-2 text-center text-xs text-white/40">
            10 scenes · auto-advancing every 4 seconds · click fullscreen for best viewing
          </p>
        </section>

        {/* Scene Breakdown */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-[#C9A961]">Scene Breakdown</h2>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-white/5 text-white/40">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Scene</th>
                  <th className="px-3 py-2 text-left font-medium">Time</th>
                  <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Type</th>
                  <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Description</th>
                </tr>
              </thead>
              <tbody>
                {scenes.map((scene) => (
                  <tr key={scene.num} className="border-t border-white/5 hover:bg-white/5 transition">
                    <td className="px-3 py-2 text-[#C9A961] font-mono">{scene.num}</td>
                    <td className="px-3 py-2 font-medium">{scene.title}</td>
                    <td className="px-3 py-2 text-white/50 font-mono">{scene.time}</td>
                    <td className="px-3 py-2 hidden sm:table-cell">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                        scene.type === "Screen Recording"
                          ? "bg-[#C9A961]/20 text-[#C9A961]"
                          : "bg-white/10 text-white/60"
                      }`}>
                        {scene.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-white/50 hidden md:table-cell">{scene.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Downloads */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-[#C9A961]">Production Assets</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="/video/mithqal-demo-subtitles.srt"
              download
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
            >
              <Download className="h-4 w-4 shrink-0 text-[#C9A961]" />
              <div>
                <div className="text-sm font-medium">Subtitles (SRT)</div>
                <div className="text-xs text-white/40">10 scenes, 3:35 total</div>
              </div>
            </a>
            <a
              href="/video/thumbnail.png"
              download
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
            >
              <Download className="h-4 w-4 shrink-0 text-[#C9A961]" />
              <div>
                <div className="text-sm font-medium">Thumbnail (PNG)</div>
                <div className="text-xs text-white/40">1344×768</div>
              </div>
            </a>
            <a
              href="/video/mithqal-motion-graphics.html"
              download
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
            >
              <Download className="h-4 w-4 shrink-0 text-[#C9A961]" />
              <div>
                <div className="text-sm font-medium">Motion Graphics (HTML)</div>
                <div className="text-xs text-white/40">Auto-playing, screen-recordable</div>
              </div>
            </a>
          </div>
        </section>

        {/* Accuracy Note */}
        <section className="rounded-xl border border-[#C9A961]/20 bg-[#C9A961]/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-[#C9A961]">Accuracy Guarantee</h3>
          <ul className="space-y-1 text-xs text-white/60">
            <li>✓ Every claim verified against the live MITHQAL platform</li>
            <li>✓ Circle APIs (Programmable Wallets, Payments API, Gas Station) clearly labeled &ldquo;Planned&rdquo;</li>
            <li>✓ Certora shown as &ldquo;Specification Complete — Execution Pending&rdquo;</li>
            <li>✓ No exaggerated claims or fake integrations</li>
            <li>✓ Live dashboard values (NAV, RR, supply) shown from real API</li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/30">
        MITHQAL — Constitutional Monetary Settlement Institution ·{" "}
        <a href="https://mithqal.vercel.app" className="text-[#C9A961] hover:text-[#E8C97A]">
          mithqal.vercel.app
        </a>
      </footer>
    </div>
  );
}
