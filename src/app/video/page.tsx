"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, ExternalLink } from "lucide-react";
import Link from "next/link";

const SCENE_DURATION = 5000;

const scenes = [
  { num: 1, title: "The Problem" },
  { num: 2, title: "Why Circle" },
  { num: 3, title: "What is MITHQAL" },
  { num: 4, title: "Reserve Architecture" },
  { num: 5, title: "How MTQ Works with Circle" },
  { num: 6, title: "Live Dashboard" },
  { num: 7, title: "Smart Contracts" },
  { num: 8, title: "Open Source" },
  { num: 9, title: "Security" },
  { num: 10, title: "Circle Integration" },
  { num: 11, title: "Technology Stack" },
  { num: 12, title: "Closing" },
];

export default function VideoPage() {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [progress, setProgress] = useState(0);

  const scene = scenes[currentScene];

  useEffect(() => {
    if (!isPlaying) return;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 50;
      setProgress((elapsed / SCENE_DURATION) * 100);
    }, 50);
    const timer = setTimeout(() => {
      if (currentScene < scenes.length - 1) {
        setCurrentScene((p) => p + 1);
        setProgress(0);
      } else {
        setIsPlaying(false);
        setIsFinished(true);
        setProgress(100);
      }
    }, SCENE_DURATION);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [isPlaying, currentScene]);

  const togglePlay = () => {
    if (isPlaying) { setIsPlaying(false); }
    else { setIsPlaying(true); setIsFinished(false); }
  };
  const replay = () => { setCurrentScene(0); setProgress(0); setIsFinished(false); setIsPlaying(true); };
  const goToScene = (i: number) => { setCurrentScene(i); setProgress(0); setIsFinished(false); if (!isPlaying) setIsPlaying(true); };

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0E1A] text-white">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" className="shrink-0">
              <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" stroke="#C9A961" strokeWidth="4" fill="#111726" />
              <text x="50" y="62" textAnchor="middle" fill="#C9A961" fontSize="32" fontWeight="700" fontFamily="Inter, sans-serif">M</text>
            </svg>
            <span className="text-sm font-medium tracking-wider text-white/80">MITHQAL</span>
          </Link>
          <Link href="/" className="text-xs text-white/40 transition hover:text-white/70">mithqal.vercel.app</Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-4xl">
          <div className="relative w-full overflow-hidden rounded-2xl border border-[#C9A961]/15 bg-black shadow-2xl" style={{ aspectRatio: "16 / 9" }}>
            <div className="absolute top-0 left-0 z-30 h-0.5 w-full bg-white/5">
              <div className="h-full bg-[#C9A961] transition-all duration-75" style={{ width: `${progress}%` }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <SceneContent sceneNum={scene.num} isActive={isPlaying} />
            </div>
            {!isPlaying && !isFinished && (
              <button onClick={togglePlay} className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 transition hover:bg-black/30" aria-label="Play">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#C9A961] bg-[#0A0E1A]/90 shadow-xl transition hover:scale-105 hover:border-[#E8C97A] sm:h-20 sm:w-20">
                  <Play className="ml-1 h-7 w-7 fill-[#C9A961] text-[#C9A961] sm:h-8 sm:w-8" />
                </div>
              </button>
            )}
            {isFinished && (
              <button onClick={replay} className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/60 transition hover:bg-black/40" aria-label="Replay">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#C9A961] bg-[#0A0E1A]/90 shadow-xl transition hover:scale-105 hover:border-[#E8C97A] sm:h-20 sm:w-20">
                  <RotateCcw className="h-7 w-7 text-[#C9A961] sm:h-8 sm:w-8" />
                </div>
                <span className="text-xs font-medium text-[#C9A961] sm:text-sm">Replay</span>
              </button>
            )}
            {isPlaying && (
              <button onClick={togglePlay} className="absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/50 transition hover:bg-black/70" aria-label="Pause">
                <Pause className="h-3.5 w-3.5 fill-white text-white" />
              </button>
            )}
            <div className="absolute bottom-3 left-3 z-20 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white/70">{currentScene + 1} / {scenes.length}</div>
          </div>

          <div className="mt-4 flex justify-center gap-1.5">
            {scenes.map((s, i) => (
              <button key={s.num} onClick={() => goToScene(i)} className={`h-1.5 rounded-full transition-all ${i === currentScene ? "w-6 bg-[#C9A961]" : "w-1.5 bg-white/15 hover:bg-white/30"}`} aria-label={`Scene ${s.num}`} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <h1 className="text-xl font-light tracking-wide text-white/90 sm:text-2xl">MITHQAL</h1>
            <p className="mt-1 text-sm text-white/40">Constitutional USDC Settlement Infrastructure</p>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-white/30">
              <Link href="/" className="transition hover:text-[#C9A961]">Dashboard</Link>
              <a href="https://github.com/MITHQALMTQ/mithqal" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 transition hover:text-[#C9A961]">GitHub<ExternalLink className="h-3 w-3" /></a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SceneContent({ sceneNum, isActive }: { sceneNum: number; isActive: boolean }) {
  const fs = { opacity: isActive ? 1 : 0.5, transition: "opacity 0.5s" };

  switch (sceneNum) {
    // Scene 1: The Problem
    case 1:
      return (
        <div className="flex flex-col items-center gap-6 px-8 text-center" style={fs}>
          <h2 className="max-w-2xl text-2xl font-light leading-snug sm:text-3xl md:text-4xl">
            Cross-border settlement remains <span className="text-[#C9A961] font-medium">slow, expensive,</span> and <span className="text-[#C9A961] font-medium">fragmented.</span>
          </h2>
          <div className="flex gap-8 sm:gap-12">
            <Stat num="3-5" label="Days to settle" /><Stat num="3-7%" label="Total cost" /><Stat num="5+" label="Intermediaries" />
          </div>
        </div>
      );

    // Scene 2: Why Circle
    case 2:
      return (
        <div className="flex flex-col items-center gap-3" style={fs}>
          {[
            { icon: "$", label: "USDC — Programmable Digital Dollar" },
            { icon: "≈", label: "Operational Liquidity" },
            { icon: "⬚", label: "Institutional Settlement" },
            { icon: "◉", label: "Transparency" },
            { icon: "⟨⟩", label: "Programmability" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2775CA] text-lg font-bold text-white">{item.icon}</div>
              <span className="text-sm font-medium sm:text-base">{item.label}</span>
            </div>
          ))}
        </div>
      );

    // Scene 3: What is MITHQAL
    case 3:
      return (
        <div className="flex flex-col items-center gap-6" style={fs}>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["Participant", "USDC", "MTQ Mint", "Settlement", "Redeem", "USDC"].map((node, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`rounded-lg border px-4 py-2 text-xs font-semibold sm:text-sm ${node === "MTQ Mint" ? "border-[#C9A961] bg-[#C9A961] text-[#0A0E1A]" : "border-[#C9A961]/50 bg-[#111726] text-white"}`}>{node}</div>
                {i < 5 && <span className="text-white/20">→</span>}
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-white/50 sm:gap-6 sm:text-sm">
            <span>✓ 100% Reserve Ratio</span><span>✓ No Lending</span><span>✓ Redemption Never Pauses</span>
          </div>
        </div>
      );

    // Scene 4: Reserve Architecture — NEW
    case 4:
      return (
        <div className="flex flex-col items-center gap-4" style={fs}>
          <div className="text-sm font-medium text-white/60 sm:text-base">Every MTQ is backed by a diversified reserve portfolio</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ReserveTier name="Cash" pct="52%" desc="Central-bank quality" color="#4ADE80" />
            <ReserveTier name="Sovereign" pct="23%" desc="T-bills ≤ 1yr" color="#60A5FA" />
            <ReserveTier name="Gold + Silver" pct="19%" desc="Allocated bullion" color="#C9A961" />
            <ReserveTier name="Stablecoin" pct="5%" desc="Regulated, USDC" color="#2775CA" />
          </div>
          <div className="mt-2 flex flex-col items-center gap-1 text-xs text-white/40">
            <span>Reserve Ratio: <span className="font-semibold text-[#C9A961]">108%</span> (≥100% constitutional minimum)</span>
            <span>NAV: <span className="font-semibold text-[#C9A961]">$1.11</span> (dynamic — floats with reserve value)</span>
            <span>Bullion Protection: <span className="font-semibold text-[#4ADE80]">Gold liquidated last</span></span>
          </div>
        </div>
      );

    // Scene 5: How MTQ Works with Circle — NEW
    case 5:
      return (
        <div className="flex flex-col items-center gap-3" style={fs}>
          <div className="text-sm font-medium text-white/60 sm:text-base">How MTQ works with Circle USDC</div>
          <div className="flex flex-col gap-2">
            {[
              { step: "1", text: "Participant deposits USDC", color: "#2775CA" },
              { step: "2", text: "MTQ minted at dynamic NAV ($1.11)", color: "#C9A961" },
              { step: "3", text: "USDC enters Tier 4 reserve", color: "#2775CA" },
              { step: "4", text: "Reserve rebalances → buys gold, silver, sovereigns", color: "#C9A961" },
              { step: "5", text: "MTQ now backed by diversified portfolio", color: "#4ADE80" },
              { step: "6", text: "Redeem MTQ → receive USDC at current NAV", color: "#2775CA" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#111726] px-4 py-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: item.color, color: "#0A0E1A" }}>{item.step}</div>
                <span className="text-xs font-medium sm:text-sm">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-1 text-xs text-white/40">USDC is the entry point. The reserve is the backbone.</div>
        </div>
      );

    // Scene 6: Live Dashboard
    case 6:
      return (
        <div className="flex flex-col items-center gap-4" style={fs}>
          <div className="text-sm text-white/40 sm:text-base">mithqal.vercel.app</div>
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            <Metric value="108%" label="Reserve Ratio" /><Metric value="$1.11" label="NAV" /><Metric value="54M" label="Supply" />
            <Metric value="$4,162" label="Gold / oz" /><Metric value="9" label="Contracts" /><Metric value="20/20" label="Stress Tests" />
          </div>
        </div>
      );

    // Scene 7: Smart Contracts
    case 7:
      return (
        <div className="flex flex-col items-center gap-3" style={fs}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { n: "MTQ.sol", a: "0x9e6EdC15..." }, { n: "Reserve.sol", a: "0x1bbCd78E..." }, { n: "Mint.sol", a: "0x197e9CB2..." },
              { n: "Redeem.sol", a: "0x963201C0..." }, { n: "Oracle.sol", a: "0xDfcA66ac..." }, { n: "Governance", a: "0xE35a9180..." },
              { n: "Algorithm", a: "0x8839ce50..." }, { n: "Takaful", a: "0x3eC27BB2..." }, { n: "MockOracle", a: "(test)" },
            ].map((c, i) => (
              <div key={i} className="rounded-lg border border-[#C9A961]/20 bg-[#111726] p-2.5 text-left">
                <div className="text-xs font-semibold text-[#C9A961]">{c.n}</div>
                <div className="mt-0.5 font-mono text-[10px] text-white/30">{c.a}</div>
                <div className="mt-1.5 inline-block rounded bg-[#4ADE80] px-1.5 py-0.5 text-[9px] font-bold text-[#0A0E1A]">✓</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-white/40">Monad Testnet · <span className="font-semibold text-[#C9A961]">Chain ID 10143</span></div>
        </div>
      );

    // Scene 8: Open Source
    case 8:
      return (
        <div className="flex flex-col items-center gap-3" style={fs}>
          <div className="text-lg font-light text-white/70 sm:text-xl">github.com/MITHQALMTQ/mithqal</div>
          <div className="text-sm text-white/40">Open Source</div>
          <div className="flex gap-2">
            {["foundry/src/", "docs/", "foundry/test/", "certora/"].map((p, i) => (
              <div key={i} className="rounded border border-white/10 bg-[#111726] px-3 py-1.5 font-mono text-xs text-[#C9A961]">{p}</div>
            ))}
          </div>
        </div>
      );

    // Scene 9: Security
    case 9:
      return (
        <div className="flex flex-col gap-1.5" style={fs}>
          {[
            { n: "Certora", s: "Spec Complete", done: false },
            { n: "Slither", s: "Not Yet Run", done: false },
            { n: "Foundry Invariants", s: "✓ In Place", done: true },
            { n: "Input Validation", s: "✓ Implemented", done: true },
            { n: "Oracle Defense", s: "✓ Multi-Source", done: true },
            { n: "Shock Absorber", s: "✓ EWMA", done: true },
          ].map((l, i) => (
            <div key={i} className="flex w-[280px] items-center gap-3 rounded border border-white/10 bg-[#111726] px-4 py-2 sm:w-[500px]">
              <span className="text-base">🛡</span>
              <span className="flex-1 text-xs font-medium sm:text-sm">{l.n}</span>
              <span className={`text-xs font-semibold ${l.done ? "text-[#4ADE80]" : "text-[#C9A961]"}`}>{l.s}</span>
            </div>
          ))}
        </div>
      );

    // Scene 10: Circle Integration
    case 10:
      return (
        <div className="flex gap-8 sm:gap-12" style={fs}>
          <div className="text-left">
            <div className="mb-3 text-sm font-bold text-[#4ADE80] sm:text-base">✓ Implemented</div>
            {["USDC as Tier 4 Reserve", "Testnet Mint/Redeem", "10-Currency Support", "Dynamic NAV", "Live Dashboard"].map((item, i) => (
              <div key={i} className="flex items-center gap-2 py-1 text-xs sm:text-sm"><span className="text-[#4ADE80]">✓</span>{item}</div>
            ))}
          </div>
          <div className="text-left">
            <div className="mb-3 text-sm font-bold text-[#C9A961] sm:text-base">→ Planned</div>
            {["Programmable Wallets", "Payments API", "Gas Station", "Mainnet", "Multi-Custodian"].map((item, i) => (
              <div key={i} className="flex items-center gap-2 py-1 text-xs sm:text-sm"><span className="text-[#C9A961]">•</span>{item}</div>
            ))}
          </div>
        </div>
      );

    // Scene 11: Technology Stack
    case 11:
      return (
        <div className="grid grid-cols-3 gap-3" style={fs}>
          {["Solidity", "Monad", "Foundry", "Next.js", "OpenZeppelin", "Certora", "Halmos", "Slither", "Circle USDC"].map((tech, i) => (
            <div key={i} className={`flex h-16 w-28 items-center justify-center rounded-lg border text-sm font-semibold sm:h-20 sm:w-36 ${tech === "Circle USDC" ? "border-[#2775CA] border-2 bg-[#2775CA]/10" : "border-white/10 bg-[#111726]"}`}>{tech}</div>
          ))}
        </div>
      );

    // Scene 12: Closing
    case 12:
      return (
        <div className="flex flex-col items-center gap-4" style={fs}>
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
            <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" stroke="#C9A961" strokeWidth="3" fill="#111726" />
            <polygon points="50,20 75,35 75,65 50,80 25,65 25,35" stroke="#E8C97A" strokeWidth="2" fill="none" />
            <text x="50" y="58" textAnchor="middle" fill="#C9A961" fontSize="24" fontWeight="700" fontFamily="Inter, sans-serif">M</text>
          </svg>
          <div className="text-3xl font-light tracking-[0.15em] sm:text-4xl">MITHQAL</div>
          <div className="text-sm text-white/40 sm:text-base">Constitutional Monetary Settlement Institution</div>
          <div className="h-0.5 w-16 bg-[#C9A961]" />
          <div className="font-mono text-xs text-[#C9A961] sm:text-sm">mithqal.vercel.app</div>
        </div>
      );

    default:
      return null;
  }
}

function Stat({ num, label }: { num: string; label: string }) {
  return (<div className="text-center"><div className="text-2xl font-bold text-[#C9A961] sm:text-3xl">{num}</div><div className="mt-0.5 text-xs text-white/40">{label}</div></div>);
}
function Metric({ value, label }: { value: string; label: string }) {
  return (<div className="rounded-lg border border-white/10 bg-[#111726] p-3 text-center"><div className="text-lg font-bold text-[#C9A961] sm:text-xl">{value}</div><div className="mt-0.5 text-[10px] text-white/40 sm:text-xs">{label}</div></div>);
}
function ReserveTier({ name, pct, desc, color }: { name: string; pct: string; desc: string; color: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#111726] p-3 text-center" style={{ borderColor: `${color}30` }}>
      <div className="text-sm font-bold" style={{ color }}>{name}</div>
      <div className="mt-1 text-lg font-bold text-white">{pct}</div>
      <div className="mt-0.5 text-[10px] text-white/40">{desc}</div>
    </div>
  );
}
