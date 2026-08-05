// Vercel deployment trigger
import { ArrowLeft, ExternalLink, Download, Play, Film } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "MITHQAL — Circle Hackathon Demo Video",
  description: "Professional demo video package for Circle Hackathon submission",
};

const voiceOvers = [
  { id: "01", title: "The Problem", file: "vo-01-problem.wav", duration: "0:00–0:15" },
  { id: "02", title: "Why Circle", file: "vo-02-circle.wav", duration: "0:15–0:35" },
  { id: "03", title: "What is MITHQAL", file: "vo-03-mithqal.wav", duration: "0:35–0:55" },
  { id: "04", title: "Live MVP", file: "vo-04-dashboard.wav", duration: "0:55–1:40" },
  { id: "05", title: "Smart Contracts", file: "vo-05-contracts.wav", duration: "1:40–2:05" },
  { id: "06", title: "GitHub", file: "vo-06-github.wav", duration: "2:05–2:25" },
  { id: "07", title: "Security", file: "vo-07-security.wav", duration: "2:25–2:45" },
  { id: "08", title: "Circle Integration", file: "vo-08-circle-integration.wav", duration: "2:45–3:05" },
  { id: "09", title: "Technology Stack", file: "vo-09-techstack.wav", duration: "3:05–3:20" },
  { id: "10", title: "Closing", file: "vo-10-closing.wav", duration: "3:20–3:35" },
];

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
      <header className="border-b border-white/10 px-8 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" />
            Back to MITHQAL
          </Link>
          <div className="flex items-center gap-2 text-sm text-[#C9A961]">
            <Film className="h-4 w-4" />
            Circle Hackathon Demo
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-light tracking-wide">
            MITHQAL Demo Video
          </h1>
          <p className="text-lg text-white/50">
            Circle Hackathon Submission — 3 minutes 35 seconds
          </p>
        </div>

        {/* Thumbnail */}
        <div className="mb-12 overflow-hidden rounded-2xl border border-[#C9A961]/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/video/thumbnail.png"
            alt="MITHQAL Demo Video Thumbnail"
            className="w-full"
          />
        </div>

        {/* Motion Graphics Viewer */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-[#C9A961]">
            <Play className="h-5 w-5" />
            Motion Graphics Presentation
          </h2>
          <p className="mb-4 text-sm text-white/50">
            Screen-recordable HTML presentation with 10 animated scenes. Use arrow keys to navigate. Record at 1920×1080.
          </p>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <iframe
              src="/video/mithqal-motion-graphics.html"
              className="h-[600px] w-full"
              title="MITHQAL Motion Graphics"
            />
          </div>
          <div className="mt-3 flex gap-4">
            <a
              href="/video/mithqal-motion-graphics.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[#C9A961] hover:text-[#E8C97A] transition"
            >
              <ExternalLink className="h-4 w-4" />
              Open in full screen
            </a>
          </div>
        </section>

        {/* Scene Breakdown */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-[#C9A961]">Scene Breakdown</h2>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Scene</th>
                  <th className="px-4 py-3 text-left font-medium">Time</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {scenes.map((scene) => (
                  <tr key={scene.num} className="border-t border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-[#C9A961] font-mono">{scene.num}</td>
                    <td className="px-4 py-3 font-medium">{scene.title}</td>
                    <td className="px-4 py-3 text-white/50 font-mono">{scene.time}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                        scene.type === "Screen Recording"
                          ? "bg-[#C9A961]/20 text-[#C9A961]"
                          : "bg-white/10 text-white/60"
                      }`}>
                        {scene.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50">{scene.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Voice-over Audio Players */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-[#C9A961]">Voice-over Audio</h2>
          <p className="mb-6 text-sm text-white/50">
            Professional narration (English, institutional tone). 10 segments covering all scenes.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {voiceOvers.map((vo) => (
              <div
                key={vo.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-[#C9A961]">{vo.id}</span>
                    <span className="text-sm font-medium">{vo.title}</span>
                  </div>
                  <span className="text-xs text-white/40 font-mono">{vo.duration}</span>
                </div>
                <audio controls className="w-full" preload="none">
                  <source src={`/video/${vo.file}`} type="audio/wav" />
                </audio>
              </div>
            ))}
          </div>
        </section>

        {/* Downloads */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-[#C9A961]">Production Assets</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <a
              href="/video/mithqal-demo-subtitles.srt"
              download
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <Download className="h-5 w-5 text-[#C9A961]" />
              <div>
                <div className="text-sm font-medium">Subtitles (SRT)</div>
                <div className="text-xs text-white/40">10 scenes, 3:35 total</div>
              </div>
            </a>
            <a
              href="/video/thumbnail.png"
              download
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <Download className="h-5 w-5 text-[#C9A961]" />
              <div>
                <div className="text-sm font-medium">Thumbnail (PNG)</div>
                <div className="text-xs text-white/40">1344×768</div>
              </div>
            </a>
            <a
              href="/video/mithqal-motion-graphics.html"
              download
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <Download className="h-5 w-5 text-[#C9A961]" />
              <div>
                <div className="text-sm font-medium">Motion Graphics (HTML)</div>
                <div className="text-xs text-white/40">Self-contained, screen-recordable</div>
              </div>
            </a>
            <a
              href="/video/PRODUCTION-PACKAGE.md"
              download
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <Download className="h-5 w-5 text-[#C9A961]" />
              <div>
                <div className="text-sm font-medium">Production Package (MD)</div>
                <div className="text-xs text-white/40">Full storyboard, shot list, timeline</div>
              </div>
            </a>
          </div>
        </section>

        {/* Quality Note */}
        <section className="rounded-xl border border-[#C9A961]/20 bg-[#C9A961]/5 p-6">
          <h3 className="mb-3 text-lg font-semibold text-[#C9A961]">Accuracy Guarantee</h3>
          <ul className="space-y-2 text-sm text-white/60">
            <li>✓ Every claim verified against the live MITHQAL platform</li>
            <li>✓ Circle APIs (Programmable Wallets, Payments API, Gas Station) clearly labeled "Planned"</li>
            <li>✓ Certora shown as "Specification Complete — Execution Pending"</li>
            <li>✓ No exaggerated claims or fake integrations</li>
            <li>✓ Live dashboard values (NAV, RR, supply) shown from real API</li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-white/10 px-8 py-6 text-center text-sm text-white/30">
        MITHQAL — Constitutional Monetary Settlement Institution ·{" "}
        <a href="https://mithqal.vercel.app" className="text-[#C9A961] hover:text-[#E8C97A]">
          mithqal.vercel.app
        </a>
      </footer>
    </div>
  );
}
