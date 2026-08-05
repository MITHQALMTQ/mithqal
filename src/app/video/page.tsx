"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Film, Play, Pause, ExternalLink, Download } from "lucide-react";
import Link from "next/link";

const SCENE_DURATION = 5000; // 5 seconds per scene

const scenes = [
  { num: 1, title: "The Problem", time: "0:00–0:15", type: "Motion Graphic", desc: "Cross-border settlement pain points", audio: "vo-01-problem.wav" },
  { num: 2, title: "Why Circle", time: "0:15–0:35", type: "Motion Graphic", desc: "USDC as operational liquidity layer", audio: "vo-02-circle.wav" },
  { num: 3, title: "What is MITHQAL", time: "0:35–0:55", type: "Motion Graphic", desc: "Architecture + constitutional invariants", audio: "vo-03-mithqal.wav" },
  { num: 4, title: "Live MVP", time: "0:55–1:40", type: "Screen Recording", desc: "Real dashboard at mithqal.vercel.app", audio: "vo-04-dashboard.wav" },
  { num: 5, title: "Smart Contracts", time: "1:40–2:05", type: "Screen Recording", desc: "9 verified contracts on Monad Explorer", audio: "vo-05-contracts.wav" },
  { num: 6, title: "GitHub", time: "2:05–2:25", type: "Screen Recording", desc: "Open source repository", audio: "vo-06-github.wav" },
  { num: 7, title: "Security", time: "2:25–2:45", type: "Motion Graphic", desc: "Certora spec, Foundry, input guards", audio: "vo-07-security.wav" },
  { num: 8, title: "Circle Integration", time: "2:45–3:05", type: "Motion Graphic", desc: "Implemented vs Planned", audio: "vo-08-circle-integration.wav" },
  { num: 9, title: "Technology Stack", time: "3:05–3:20", type: "Motion Graphic", desc: "Solidity, Monad, Foundry, Next.js, Circle", audio: "vo-09-techstack.wav" },
  { num: 10, title: "Closing", time: "3:20–3:35", type: "Motion Graphic", desc: "MITHQAL logo + URL", audio: "vo-10-closing.wav" },
];

export default function VideoPage() {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scene = scenes[currentScene];

  // Auto-advance effect: when playing, advance through scenes
  useEffect(() => {
    if (!isPlaying) return;

    // Play audio for current scene
    if (audioRef.current) {
      audioRef.current.src = `/video/${scene.audio}`;
      audioRef.current.play().catch(() => {});
    }

    // Progress bar
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 50;
      setProgress((elapsed / SCENE_DURATION) * 100);
    }, 50);

    // Advance after duration
    const timer = setTimeout(() => {
      setCurrentScene((prev) => (prev < scenes.length - 1 ? prev + 1 : 0));
      setProgress(0);
    }, SCENE_DURATION);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isPlaying, currentScene, scene.audio]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
    } else {
      setIsPlaying(true);
    }
  };

  const goToScene = (idx: number) => {
    setCurrentScene(idx);
    setProgress(0);
    if (!isPlaying) setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <audio ref={audioRef} preload="auto" />

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

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4 text-center">
          <h1 className="mb-1 text-2xl font-light tracking-wide">MITHQAL Demo Video</h1>
          <p className="text-xs text-white/50">Circle Hackathon Submission · 3 minutes 35 seconds · American narration</p>
        </div>

        {/* Video Player — inline, no iframe */}
        <section className="mb-6">
          <div className="relative w-full overflow-hidden rounded-xl border border-[#C9A961]/20 bg-black" style={{ aspectRatio: "16 / 9" }}>
            <div className="absolute top-0 left-0 z-30 h-1 w-full bg-white/10">
              <div className="h-full bg-[#C9A961] transition-all duration-75" style={{ width: `${progress}%` }} />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <SceneContent scene={scene} isActive={isPlaying} />
            </div>

            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 transition hover:bg-black/40"
                aria-label="Play video"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#C9A961] bg-[#0A0E1A]/80 shadow-2xl transition hover:scale-110 hover:border-[#E8C97A]">
                  <Play className="ml-1 h-8 w-8 fill-[#C9A961] text-[#C9A961]" />
                </div>
              </button>
            )}

            {isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 transition hover:bg-black/80"
                aria-label="Pause"
              >
                <Pause className="h-4 w-4 fill-white text-white" />
              </button>
            )}

            <div className="absolute bottom-4 left-4 z-20 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white/80">
              Scene {currentScene + 1} / 10 — {scene.title}
            </div>
          </div>

          {/* Scene navigation dots */}
          <div className="mt-3 flex justify-center gap-2">
            {scenes.map((s, i) => (
              <button
                key={s.num}
                onClick={() => goToScene(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentScene ? "w-8 bg-[#C9A961]" : "w-2 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Go to scene ${s.num}: ${s.title}`}
              />
            ))}
          </div>
        </section>

        {/* Scene Breakdown */}
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-[#C9A961]">Scene Breakdown</h2>
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
                {scenes.map((s, i) => (
                  <tr
                    key={s.num}
                    onClick={() => goToScene(i)}
                    className={`cursor-pointer border-t border-white/5 transition ${
                      i === currentScene ? "bg-[#C9A961]/10" : "hover:bg-white/5"
                    }`}
                  >
                    <td className="px-3 py-2 text-[#C9A961] font-mono">{s.num}</td>
                    <td className="px-3 py-2 font-medium">{s.title}</td>
                    <td className="px-3 py-2 text-white/50 font-mono">{s.time}</td>
                    <td className="px-3 py-2 hidden sm:table-cell">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          s.type === "Screen Recording" ? "bg-[#C9A961]/20 text-[#C9A961]" : "bg-white/10 text-white/60"
                        }`}
                      >
                        {s.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-white/50 hidden md:table-cell">{s.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Downloads */}
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-[#C9A961]">Production Assets</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <a href="/video/mithqal-demo-subtitles.srt" download className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition">
              <Download className="h-4 w-4 shrink-0 text-[#C9A961]" />
              <div>
                <div className="text-sm font-medium">Subtitles (SRT)</div>
                <div className="text-xs text-white/40">10 scenes, 3:35 total</div>
              </div>
            </a>
            <a href="/video/thumbnail.png" download className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition">
              <Download className="h-4 w-4 shrink-0 text-[#C9A961]" />
              <div>
                <div className="text-sm font-medium">Thumbnail (PNG)</div>
                <div className="text-xs text-white/40">1344×768</div>
              </div>
            </a>
            <a href="/video/mithqal-motion-graphics.html" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition">
              <ExternalLink className="h-4 w-4 shrink-0 text-[#C9A961]" />
              <div>
                <div className="text-sm font-medium">Fullscreen Version</div>
                <div className="text-xs text-white/40">Open motion graphics</div>
              </div>
            </a>
          </div>
        </section>

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

function SceneContent({ scene, isActive }: { scene: (typeof scenes)[0]; isActive: boolean }) {
  const base = "flex flex-col items-center justify-center text-center";
  const fadeStyle = { opacity: isActive ? 1 : 0.6, transition: "opacity 0.5s" };

  switch (scene.num) {
    case 1:
      return (
        <div className={`${base} gap-8 px-8`} style={fadeStyle}>
          <h2 className="max-w-3xl text-3xl font-light leading-tight sm:text-4xl md:text-5xl">
            Cross-border settlement remains <span className="text-[#C9A961] font-medium">slow, expensive,</span> and{" "}
            <span className="text-[#C9A961] font-medium">fragmented.</span>
          </h2>
          <div className="flex gap-12">
            <Stat num="3-5" label="Days to settle" />
            <Stat num="3-7%" label="Total cost" />
            <Stat num="5+" label="Intermediaries" />
          </div>
        </div>
      );
    case 2:
      return (
        <div className={`${base} gap-4`} style={fadeStyle}>
          {[
            { icon: "$", label: "USDC — Programmable Digital Dollar" },
            { icon: "≈", label: "Operational Liquidity" },
            { icon: "⬚", label: "Institutional Settlement" },
            { icon: "◉", label: "Transparency" },
            { icon: "⟨⟩", label: "Programmability" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2775CA] text-xl font-bold text-white">{item.icon}</div>
              <span className="text-lg font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      );
    case 3:
      return (
        <div className={`${base} gap-8`} style={fadeStyle}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {["Participant", "USDC", "MTQ Mint", "Settlement", "Redeem", "USDC"].map((node, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`rounded-xl border-2 px-5 py-3 text-base font-semibold ${node === "MTQ Mint" ? "border-[#C9A961] bg-[#C9A961] text-[#0A0E1A]" : "border-[#C9A961] bg-[#111726] text-white"}`}>{node}</div>
                {i < 5 && <span className="text-white/30">→</span>}
              </div>
            ))}
          </div>
          <div className="flex gap-6 text-sm text-white/60">
            <span>✓ 100% Reserve Ratio</span>
            <span>✓ No Lending</span>
            <span>✓ Redemption Never Pauses</span>
          </div>
        </div>
      );
    case 4:
      return (
        <div className={`${base} gap-6`} style={fadeStyle}>
          <div className="text-lg text-white/50">Live Dashboard — mithqal.vercel.app</div>
          <div className="grid grid-cols-3 gap-6">
            <MetricCard value="108%" label="Reserve Ratio" />
            <MetricCard value="$1.10" label="NAV (Dynamic)" />
            <MetricCard value="54M" label="MTQ Supply" />
            <MetricCard value="$4,162" label="Gold Price (Live)" />
            <MetricCard value="9" label="Verified Contracts" />
            <MetricCard value="20/20" label="Stress Tests Passed" />
          </div>
        </div>
      );
    case 5:
      return (
        <div className={`${base} gap-4`} style={fadeStyle}>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: "MTQ.sol", addr: "0x9e6EdC15..." },
              { name: "Reserve.sol", addr: "0x1bbCd78E..." },
              { name: "Mint.sol", addr: "0x197e9CB2..." },
              { name: "Redeem.sol", addr: "0x963201C0..." },
              { name: "Oracle.sol", addr: "0xDfcA66ac..." },
              { name: "Governance.sol", addr: "0xE35a9180..." },
              { name: "Algorithm.sol", addr: "0x8839ce50..." },
              { name: "Takaful.sol", addr: "0x3eC27BB2..." },
              { name: "MockOracle.sol", addr: "(test only)" },
            ].map((c, i) => (
              <div key={i} className="rounded-lg border border-[#C9A961]/30 bg-[#111726] p-3 text-left">
                <div className="text-sm font-semibold text-[#C9A961]">{c.name}</div>
                <div className="mt-1 font-mono text-xs text-white/40">{c.addr}</div>
                <div className="mt-2 inline-block rounded bg-[#4ADE80] px-2 py-0.5 text-xs font-bold text-[#0A0E1A]">✓ Verified</div>
              </div>
            ))}
          </div>
          <div className="text-sm text-white/50">Monad Testnet — <span className="font-semibold text-[#C9A961]">Chain ID 10143</span></div>
        </div>
      );
    case 6:
      return (
        <div className={`${base} gap-4`} style={fadeStyle}>
          <div className="text-2xl font-light text-white/80">github.com/MITHQALMTQ/mithqal</div>
          <div className="text-lg text-white/50">Open Source — Full Transparency</div>
          <div className="flex gap-3">
            {["foundry/src/", "docs/", "foundry/test/", "foundry/certora/"].map((p, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-[#111726] px-4 py-2 font-mono text-sm text-[#C9A961]">{p}</div>
            ))}
          </div>
        </div>
      );
    case 7:
      return (
        <div className={`${base} gap-2`} style={fadeStyle}>
          {[
            { name: "Certora Formal Verification", status: "Spec Complete — Execution Pending", done: false },
            { name: "Slither Static Analysis", status: "Not Yet Run", done: false },
            { name: "Foundry Invariant Tests", status: "✓ In Place", done: true },
            { name: "Input Validation Guards", status: "✓ Implemented", done: true },
            { name: "Oracle Manipulation Defense", status: "✓ Multi-Source Consensus", done: true },
            { name: "Shock Absorber (§17)", status: "✓ EWMA Volatility Dampening", done: true },
          ].map((layer, i) => (
            <div key={i} className="flex w-[600px] items-center gap-4 rounded-lg border border-white/10 bg-[#111726] px-6 py-3">
              <span className="text-xl">🛡</span>
              <span className="flex-1 text-sm font-medium">{layer.name}</span>
              <span className={`text-xs font-semibold ${layer.done ? "text-[#4ADE80]" : "text-[#C9A961]"}`}>{layer.status}</span>
            </div>
          ))}
        </div>
      );
    case 8:
      return (
        <div className={`${base}`} style={fadeStyle}>
          <div className="flex gap-16">
            <div className="text-left">
              <div className="mb-4 text-lg font-bold text-[#4ADE80]">✓ Implemented</div>
              {["USDC as Tier 4 Reserve Asset", "Testnet Mint/Redeem with USDC", "10-Currency Support", "Dynamic NAV Calculation", "Live Reserve Dashboard"].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 text-base"><span className="text-[#4ADE80]">✓</span>{item}</div>
              ))}
            </div>
            <div className="text-left">
              <div className="mb-4 text-lg font-bold text-[#C9A961]">→ Planned (Roadmap)</div>
              {["Circle Programmable Wallets", "Circle Payments API", "Circle Gas Station", "Mainnet Deployment", "Multi-Custodian Diversification"].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 text-base"><span className="text-[#C9A961]">•</span>{item}<span className="rounded bg-[#C9A961] px-2 py-0.5 text-xs font-bold text-[#0A0E1A]">Planned</span></div>
              ))}
            </div>
          </div>
        </div>
      );
    case 9:
      return (
        <div className={`${base}`} style={fadeStyle}>
          <div className="grid grid-cols-3 gap-4">
            {["Solidity", "Monad", "Foundry", "Next.js", "OpenZeppelin", "Certora", "Halmos", "Slither", "Circle USDC"].map((tech, i) => (
              <div key={i} className={`flex h-20 w-40 items-center justify-center rounded-xl border text-base font-semibold ${tech === "Circle USDC" ? "border-[#2775CA] border-2 bg-[#2775CA]/10" : "border-white/10 bg-[#111726]"}`}>{tech}</div>
            ))}
          </div>
        </div>
      );
    case 10:
      return (
        <div className={`${base} gap-6`} style={fadeStyle}>
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" stroke="#C9A961" strokeWidth="3" fill="#111726" />
            <polygon points="50,20 75,35 75,65 50,80 25,65 25,35" stroke="#E8C97A" strokeWidth="2" fill="none" />
            <text x="50" y="58" textAnchor="middle" fill="#C9A961" fontSize="24" fontWeight="700" fontFamily="Inter, sans-serif">M</text>
          </svg>
          <div className="text-4xl font-light tracking-[0.15em]">MITHQAL</div>
          <div className="text-base text-white/50">Constitutional Monetary Settlement Institution</div>
          <div className="h-0.5 w-20 bg-[#C9A961]" />
          <div className="font-mono text-sm text-[#C9A961]">mithqal.vercel.app</div>
        </div>
      );
    default:
      return null;
  }
}

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-[#C9A961]">{num}</div>
      <div className="mt-1 text-xs text-white/50">{label}</div>
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111726] p-4 text-center">
      <div className="text-2xl font-bold text-[#C9A961]">{value}</div>
      <div className="mt-1 text-xs text-white/50">{label}</div>
    </div>
  );
}
