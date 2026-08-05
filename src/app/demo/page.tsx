"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Film,
  Play,
  Github,
  ExternalLink,
  Download,
  LayoutDashboard,
  Camera,
  Clapperboard,
  FileText,
  CheckCircle2,
  CircleDashed,
  Music,
  Package,
  Layers,
  ListChecks,
  ScrollText,
  Clock,
  Mic,
  Scale,
  Sparkles,
  FileJson,
  FileType,
  Route,
  Link2,
  AlertTriangle,
  Check,
  CircleDot,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                          */
/* ------------------------------------------------------------------ */

const DASHBOARD_URL = "https://mithqal.vercel.app";
const GITHUB_URL = "https://github.com/MITHQALMTQ/mithqal";
const EXPLORER_BASE = "https://testnet.monadexplorer.com/address";
const CHAIN_ID = "10143";

type ContractRef = {
  name: string;
  address: string;
};

const CONTRACTS: ContractRef[] = [
  { name: "MTQ.sol", address: "0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD" },
  { name: "Governance.sol", address: "0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66" },
  { name: "Algorithm.sol", address: "0x8839ce50e8D414005518769999c0A5b961D00CB2" },
  { name: "Reserve.sol", address: "0x1bbCd78E4DEF79b7a3B77242770cbAefAC816177" },
  { name: "Mint.sol", address: "0x197e9CB28216dfe18a199b4c2930F74C2F460809" },
  { name: "Redeem.sol", address: "0x963201C0Fa258033CCDdFcDceb8B5E3bc2b435a4" },
  { name: "Oracle.sol", address: "0xDfcA66ac0450C9AB86307af1942E157C5A4DB713" },
  { name: "Takaful.sol", address: "0x3eC27BB283644eF0A98B9961E9FBED0583a02f19" },
  { name: "MockOracle.sol", address: "(test only — not in production deployment set)" },
];

const TREASURY = "0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0";

/* ------------------------------------------------------------------ */
/*  STORYBOARD DATA (10 scenes)                                        */
/* ------------------------------------------------------------------ */

type Scene = {
  num: number;
  name: string;
  objective: string;
  duration: string;
  start: string;
  end: string;
  visuals: string;
  camera: string;
  animation: string;
  voiceOver: string;
  assets: string;
  transition: string;
  status: "Approved" | "Drafted" | "Pending";
};

const SCENES: Scene[] = [
  {
    num: 1,
    name: "The Problem",
    objective:
      "Establish the pain of cross-border settlement: slow, expensive, fragmented. Anchor the viewer in the problem before introducing the solution.",
    duration: "10s",
    start: "0:00",
    end: "0:10",
    visuals:
      "Dark navy background. Three large statistics animate in sequence: '3–5 Days to settle', '3–7% Total cost', '5+ Intermediaries'. A thin gold divider line draws itself across the frame.",
    camera: "Static center frame; no pan. Subtle 2% scale-up on each statistic as it appears.",
    animation:
      "Fade-in statistics with staggered timing (300ms apart). Gold underline draws left-to-right over 600ms using clip-path animation.",
    voiceOver:
      "Cross-border settlement remains slow, expensive, and fragmented. [PAUSE] Despite decades of innovation, international trade still relies on correspondent banking and systems never designed for real-time settlement.",
    assets:
      "Stat cards (×3), gold divider SVG, navy gradient background, Inter typography kit.",
    transition: "Cross-dissolve to Scene 2 (400ms).",
    status: "Approved",
  },
  {
    num: 2,
    name: "Why Circle",
    objective:
      "Position USDC as the programmable, fully-reserved digital dollar that can serve as the operational liquidity layer for institutional settlement.",
    duration: "15s",
    start: "0:10",
    end: "0:25",
    visuals:
      "Vertical stack of five pillars, each with a Circle-blue badge icon and a label: 'USDC — Programmable Digital Dollar', 'Operational Liquidity', 'Institutional Settlement', 'Transparency', 'Programmability'.",
    camera: "Slow vertical dolly from top pillar to bottom (15s total), each pillar locking into place as it enters frame.",
    animation:
      "Pillars slide in from the right with 150ms stagger. Badge icons pulse softly (opacity 0.8→1.0) on lock.",
    voiceOver:
      "Circle's USDC provides a programmable, fully reserved digital dollar that settles near-instantly. [PAUSE] MITHQAL explores how USDC can serve as the operational liquidity layer for institutional settlement — combining blockchain transparency with the stability of dollar reserves.",
    assets:
      "Pillar cards (×5), Circle-blue badge icons, navy gradient background.",
    transition: "Wipe right-to-left to Scene 3 (350ms).",
    status: "Approved",
  },
  {
    num: 3,
    name: "What is MITHQAL",
    objective:
      "Explain the architecture and the constitutional invariants that make MITHQAL a settlement institution, not a platform.",
    duration: "20s",
    start: "0:25",
    end: "0:45",
    visuals:
      "Horizontal flow diagram: Participant → USDC → MTQ Mint → Settlement → Redeem → USDC. Below the flow, three invariant checkmarks: '100% Reserve Ratio', 'No Lending', 'Redemption Never Pauses'.",
    camera: "Static. Flow nodes highlight in sequence left-to-right as the narrator names each step.",
    animation:
      "Nodes pop in with scale 0.9→1.0 (200ms each, 250ms stagger). Connecting arrows draw with stroke-dashoffset animation. Checkmarks fade in last.",
    voiceOver:
      "MITHQAL is a constitutional monetary settlement institution. [PAUSE] Participants deposit eligible reserves, including USDC, and receive MTQ — a settlement unit backed by a diversified reserve portfolio. MTQ can be transferred globally and redeemed at any time.",
    assets:
      "Flow node cards (×6), arrow connectors, invariant check badges, navy gradient background.",
    transition: "Cross-dissolve to Scene 4 (400ms).",
    status: "Approved",
  },
  {
    num: 4,
    name: "Live Dashboard",
    objective:
      "Prove the platform is live. Show the real dashboard with live NAV, reserve ratio, supply, and oracle-derived values — not hardcoded mockups.",
    duration: "45s",
    start: "0:45",
    end: "1:30",
    visuals:
      "Screen recording of mithqal.vercel.app. Six metric cards overlay the recording: 108% Reserve Ratio, $1.10 NAV (Dynamic), 54M MTQ Supply, $4,162 Gold Price (Live), 9 Verified Contracts, 20/20 Stress Tests Passed.",
    camera: "Screen recording. Slow zoom from 100% to 115% on the reserve ratio card over 8s, then pan across the dashboard.",
    animation:
      "Metric cards fade in with staggered timing. Gold accent ring pulses once on each card as it appears. Live values count up from 0 using a 1.2s ease-out.",
    voiceOver:
      "This is the live MITHQAL platform. [PAUSE] The dashboard shows real-time reserve data: a reserve ratio of 108%, a dynamic NAV of $1.10, live gold and silver prices, and nine verified smart contracts on Monad Testnet. [PAUSE] Every value is computed from live oracle data — not hardcoded.",
    assets:
      "Screen recording (45s), six metric overlay cards, gold accent ring SVG, count-up animation rig.",
    transition: "Cross-dissolve to Scene 5 (400ms).",
    status: "Approved",
  },
  {
    num: 5,
    name: "Monad Explorer",
    objective:
      "Demonstrate verifiability: every contract is deployed and independently verifiable on the Monad Testnet block explorer.",
    duration: "25s",
    start: "1:30",
    end: "1:55",
    visuals:
      "Grid of nine contract cards, each showing contract name, truncated address, and a green 'Verified' badge. Footer reads 'Monad Testnet — Chain ID 10143'.",
    camera: "Static grid. Each card highlights in sequence as the narrator names it.",
    animation:
      "Cards fade in 3×3 grid with 120ms stagger. 'Verified' badges pop in with scale 1.2→1.0 after each card settles.",
    voiceOver:
      "The protocol consists of nine Solidity smart contracts deployed on Monad Testnet, Chain ID 10143. [PAUSE] Each contract is independently verifiable on the block explorer: MTQ token, mint, redeem, reserve, oracle, governance, algorithm, and Takaful risk protection.",
    assets:
      "Contract cards (×9), green verified badge, chain-ID footer chip, navy gradient background.",
    transition: "Cross-dissolve to Scene 6 (400ms).",
    status: "Approved",
  },
  {
    num: 6,
    name: "GitHub",
    objective:
      "Establish open-source credibility. Show the repository structure and the depth of documentation.",
    duration: "20s",
    start: "1:55",
    end: "2:15",
    visuals:
      "Repo URL 'github.com/MITHQALMTQ/mithqal' centered. Below, four folder chips: 'foundry/src/', 'docs/', 'foundry/test/', 'foundry/certora/'.",
    camera: "Static. Folder chips highlight in sequence.",
    animation:
      "URL types out character-by-character (40ms/char). Folder chips slide up from below with 150ms stagger.",
    voiceOver:
      "The entire codebase is open source on GitHub. [PAUSE] The repository includes the constitutional blueprint, smart contract source code, a comprehensive test suite, formal verification specifications, and full documentation.",
    assets:
      "Typed URL component, folder chips (×4), navy gradient background.",
    transition: "Cross-dissolve to Scene 7 (400ms).",
    status: "Approved",
  },
  {
    num: 7,
    name: "Security",
    objective:
      "Present the layered security posture honestly — including what is complete and what is pending. No exaggeration.",
    duration: "20s",
    start: "2:15",
    end: "2:35",
    visuals:
      "Six horizontal security layers stacked vertically. Each shows a shield icon, layer name, and status. Three are green (implemented), three are gold (pending).",
    camera: "Static. Layers highlight top-to-bottom in sequence.",
    animation:
      "Layers slide in from left with 200ms stagger. Status text fades in 400ms after each layer.",
    voiceOver:
      "Security is layered. [PAUSE] Certora formal verification specifications are complete for MTQ and Oracle contracts. Foundry invariant tests are in place. Input validation guards protect against negative amounts, dust attacks, and oracle manipulation.",
    assets:
      "Layer rows (×6), shield icons, green/gold status chips, navy gradient background.",
    transition: "Cross-dissolve to Scene 8 (400ms).",
    status: "Approved",
  },
  {
    num: 8,
    name: "Circle Integration",
    objective:
      "Split-screen the honest state of Circle integration: what is implemented today versus what is on the roadmap. Critical for hackathon integrity.",
    duration: "20s",
    start: "2:35",
    end: "2:55",
    visuals:
      "Two columns. LEFT (green, 'Implemented'): USDC as Tier 4 Reserve, Testnet Mint/Redeem, 10-Currency Support, Dynamic NAV, Live Dashboard. RIGHT (gold, 'Planned'): Circle Programmable Wallets, Payments API, Gas Station, Mainnet, Multi-Custodian.",
    camera: "Static split. Left column populates first, then right.",
    animation:
      "Left items check in with green checkmark pop. Right items slide in with gold 'Planned' badge.",
    voiceOver:
      "MITHQAL currently uses regulated stablecoins, including USDC, as part of its Tier 4 operational liquidity layer — implemented and tested. [PAUSE] On the roadmap: Circle Programmable Wallets, Payments API, and Gas Station. These are planned integrations, not yet implemented.",
    assets:
      "Two-column layout, green check icons, gold 'Planned' badges, navy gradient background.",
    transition: "Cross-dissolve to Scene 9 (400ms).",
    status: "Approved",
  },
  {
    num: 9,
    name: "Technology",
    objective:
      "Show the technology stack at a glance. Circle USDC highlighted as the operational liquidity layer.",
    duration: "15s",
    start: "2:55",
    end: "3:10",
    visuals:
      "3×3 grid of technology tiles: Solidity, Monad, Foundry, Next.js, OpenZeppelin, Certora, Halmos, Slither, Circle USDC. Circle USDC tile is highlighted with a Circle-blue border.",
    camera: "Static grid. Tiles light up in sequence.",
    animation:
      "Tiles fade in with 100ms stagger. Circle USDC tile gets a blue glow ring after all others settle.",
    voiceOver:
      "The technology stack: Solidity on Monad, Foundry for testing, Next.js for the dashboard, OpenZeppelin for secure standards, Certora for formal verification, and Circle USDC as operational liquidity.",
    assets:
      "Technology tiles (×9), Circle-blue glow ring, navy gradient background.",
    transition: "Cross-dissolve to Scene 10 (500ms).",
    status: "Approved",
  },
  {
    num: 10,
    name: "Closing",
    objective:
      "Land the thesis and direct viewers to the live platform. End on the MITHQAL mark and URL.",
    duration: "20s",
    start: "3:10",
    end: "3:30",
    visuals:
      "Centered MITHQAL hexagonal mark (gold stroke). Below: 'MITHQAL' wordmark, tagline 'Constitutional Monetary Settlement Institution', gold divider, and URL 'mithqal.vercel.app'.",
    camera: "Static. Mark scales from 0.8→1.0 over 800ms at start, holds, then slowly fades.",
    animation:
      "Mark scales in with ease-out. Wordmark fades up. Divider draws left-to-right. URL fades in last and holds for 4s.",
    voiceOver:
      "MITHQAL explores how Circle's USDC can serve as the operational liquidity layer for transparent, fully reserved institutional settlement. [PAUSE] By combining programmable digital dollars with constitutional governance and formally verified smart contracts, MITHQAL aims to help modernize cross-border trade settlement.",
    assets:
      "Hexagonal mark SVG, wordmark, tagline, divider, URL chip, navy gradient background.",
    transition: "Fade to black (600ms) — end of video.",
    status: "Approved",
  },
];

/* ------------------------------------------------------------------ */
/*  VIDEO SCRIPT (narration with pause + emphasis markers)            */
/* ------------------------------------------------------------------ */

type ScriptLine = {
  scene: number;
  title: string;
  time: string;
  text: string;
  words: number;
  readTime: string;
};

function countWords(s: string): number {
  return s
    .replace(/\[PAUSE\]/g, "")
    .replace(/\*\*/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

const RAW_SCRIPT: { scene: number; title: string; time: string; text: string }[] = [
  {
    scene: 1,
    title: "The Problem",
    time: "0:00–0:10",
    text: "Cross-border settlement remains **slow, expensive, and fragmented**. [PAUSE] Despite decades of innovation, international trade still relies on correspondent banking and systems never designed for real-time settlement.",
  },
  {
    scene: 2,
    title: "Why Circle",
    time: "0:10–0:25",
    text: "Circle's USDC provides a **programmable, fully reserved digital dollar** that settles near-instantly. [PAUSE] MITHQAL explores how USDC can serve as the **operational liquidity layer** for institutional settlement — combining blockchain transparency with the stability of dollar reserves.",
  },
  {
    scene: 3,
    title: "What is MITHQAL",
    time: "0:25–0:45",
    text: "MITHQAL is a **constitutional monetary settlement institution**. [PAUSE] Participants deposit eligible reserves, including USDC, and receive MTQ — a settlement unit backed by a diversified reserve portfolio. MTQ can be transferred globally and **redeemed at any time**.",
  },
  {
    scene: 4,
    title: "Live Dashboard",
    time: "0:45–1:30",
    text: "This is the **live MITHQAL platform**. [PAUSE] The dashboard shows real-time reserve data: a reserve ratio of **108%**, a dynamic NAV of **$1.10**, live gold and silver prices, and **nine verified smart contracts** on Monad Testnet. [PAUSE] Every value is computed from **live oracle data** — not hardcoded.",
  },
  {
    scene: 5,
    title: "Monad Explorer",
    time: "1:30–1:55",
    text: "The protocol consists of **nine Solidity smart contracts** deployed on Monad Testnet, Chain ID 10143. [PAUSE] Each contract is **independently verifiable** on the block explorer: MTQ token, mint, redeem, reserve, oracle, governance, algorithm, and Takaful risk protection.",
  },
  {
    scene: 6,
    title: "GitHub",
    time: "1:55–2:15",
    text: "The entire codebase is **open source on GitHub**. [PAUSE] The repository includes the constitutional blueprint, smart contract source code, a comprehensive test suite, formal verification specifications, and full documentation.",
  },
  {
    scene: 7,
    title: "Security",
    time: "2:15–2:35",
    text: "Security is **layered**. [PAUSE] Certora formal verification specifications are complete for MTQ and Oracle contracts. Foundry invariant tests are in place. Input validation guards protect against **negative amounts, dust attacks, and oracle manipulation**.",
  },
  {
    scene: 8,
    title: "Circle Integration",
    time: "2:35–2:55",
    text: "MITHQAL currently uses regulated stablecoins, including USDC, as part of its **Tier 4 operational liquidity layer** — implemented and tested. [PAUSE] On the roadmap: **Circle Programmable Wallets, Payments API, and Gas Station**. These are planned integrations, not yet implemented.",
  },
  {
    scene: 9,
    title: "Technology",
    time: "2:55–3:10",
    text: "The technology stack: **Solidity on Monad**, Foundry for testing, Next.js for the dashboard, OpenZeppelin for secure standards, Certora for formal verification, and **Circle USDC** as operational liquidity.",
  },
  {
    scene: 10,
    title: "Closing",
    time: "3:10–3:30",
    text: "MITHQAL explores how Circle's USDC can serve as the **operational liquidity layer** for transparent, fully reserved institutional settlement. [PAUSE] By combining programmable digital dollars with **constitutional governance** and formally verified smart contracts, MITHQAL aims to help modernize cross-border trade settlement.",
  },
];

const VIDEO_SCRIPT: ScriptLine[] = RAW_SCRIPT.map((s) => {
  const words = countWords(s.text);
  const secs = Math.max(1, Math.round(words / 2.5));
  const mm = Math.floor(secs / 60);
  const ss = secs % 60;
  return {
    scene: s.scene,
    title: s.title,
    time: s.time,
    text: s.text,
    words,
    readTime: `${mm}:${ss.toString().padStart(2, "0")}`,
  };
});

const TOTAL_WORDS = VIDEO_SCRIPT.reduce((a, s) => a + s.words, 0);
const TOTAL_READ_SECS = Math.round(TOTAL_WORDS / 2.5);

/* ------------------------------------------------------------------ */
/*  SHOT LIST                                                          */
/* ------------------------------------------------------------------ */

type Shot = {
  scene: string;
  camera: string;
  screenRecording: boolean;
  zoom: string;
  pan: string;
  transition: string;
  duration: string;
  notes: string;
};

const SHOT_LIST: Shot[] = [
  { scene: "1 — The Problem", camera: "Static motion graphic", screenRecording: false, zoom: "None", pan: "None", transition: "Cross-dissolve 400ms", duration: "10s", notes: "Stats stagger 300ms; gold underline draws 600ms." },
  { scene: "2 — Why Circle", camera: "Vertical dolly (simulated)", screenRecording: false, zoom: "None", pan: "Top→bottom over 15s", transition: "Wipe R→L 350ms", duration: "15s", notes: "5 pillars, 150ms stagger; badge pulse on lock." },
  { scene: "3 — What is MITHQAL", camera: "Static", screenRecording: false, zoom: "None", pan: "None", transition: "Cross-dissolve 400ms", duration: "20s", notes: "Flow nodes scale-in 0.9→1.0; arrows draw via stroke-dashoffset." },
  { scene: "4 — Live Dashboard", camera: "Screen recording", screenRecording: true, zoom: "100%→115% over 8s on RR card", pan: "Pan across dashboard after zoom", transition: "Cross-dissolve 400ms", duration: "45s", notes: "Capture at 30fps, 1920×1080. Live values count-up 1.2s ease-out." },
  { scene: "5 — Monad Explorer", camera: "Static grid", screenRecording: false, zoom: "None", pan: "None", transition: "Cross-dissolve 400ms", duration: "25s", notes: "9 cards 3×3, 120ms stagger; verified badges pop 1.2→1.0." },
  { scene: "6 — GitHub", camera: "Static", screenRecording: false, zoom: "None", pan: "None", transition: "Cross-dissolve 400ms", duration: "20s", notes: "URL types 40ms/char; folder chips slide up 150ms stagger." },
  { scene: "7 — Security", camera: "Static", screenRecording: false, zoom: "None", pan: "None", transition: "Cross-dissolve 400ms", duration: "20s", notes: "6 layers slide-in left, 200ms stagger; status fades 400ms after." },
  { scene: "8 — Circle Integration", camera: "Static split", screenRecording: false, zoom: "None", pan: "None", transition: "Cross-dissolve 400ms", duration: "20s", notes: "Left column first (green checks), then right (gold Planned badges)." },
  { scene: "9 — Technology", camera: "Static grid", screenRecording: false, zoom: "None", pan: "None", transition: "Cross-dissolve 500ms", duration: "15s", notes: "9 tiles 100ms stagger; Circle USDC tile blue-glow ring after settle." },
  { scene: "10 — Closing", camera: "Static", screenRecording: false, zoom: "Mark 0.8→1.0 over 800ms", pan: "None", transition: "Fade to black 600ms", duration: "20s", notes: "Mark scales in; wordmark fades up; URL holds 4s." },
];

/* ------------------------------------------------------------------ */
/*  SCREEN CAPTURE CHECKLIST                                           */
/* ------------------------------------------------------------------ */

type CaptureItem = {
  id: string;
  label: string;
  detail: string;
  status: "Pending" | "Recorded" | "Approved";
};

const SCREEN_CAPTURE: CaptureItem[] = [
  { id: "dashboard", label: "Live Dashboard", detail: "mithqal.vercel.app — NAV, RR, supply, oracle values", status: "Recorded" },
  { id: "github", label: "GitHub Repository", detail: "github.com/MITHQALMTQ/mithqal — repo + folder structure", status: "Recorded" },
  { id: "explorer", label: "Monad Explorer", detail: "testnet.monadexplorer.com — 9 contract address pages", status: "Pending" },
  { id: "contracts", label: "Contract Source", detail: "foundry/src/ — verified Solidity source per contract", status: "Pending" },
  { id: "docs", label: "Documentation", detail: "docs/ — constitutional blueprint + CONTRACT_REGISTRY", status: "Pending" },
  { id: "verification", label: "Verification Status", detail: "/api/onchain-test — 15/15 on-chain checks PASS", status: "Recorded" },
  { id: "reserve", label: "Reserve Page", detail: "Dashboard reserve composition + tier breakdown", status: "Pending" },
  { id: "architecture", label: "Architecture Diagram", detail: "Reserve tiers + flow: Participant → USDC → MTQ → Redeem", status: "Approved" },
];

/* ------------------------------------------------------------------ */
/*  MOTION GRAPHICS ASSETS                                             */
/* ------------------------------------------------------------------ */

type MotionAsset = {
  name: string;
  description: string;
  usedIn: string;
  format: string;
};

const MOTION_GRAPHICS: MotionAsset[] = [
  { name: "Architecture Flow Animation", description: "Animated horizontal flow: Participant → USDC → MTQ Mint → Settlement → Redeem → USDC with drawing arrows.", usedIn: "Scene 3", format: "SVG + CSS / Lottie" },
  { name: "Flow Arrows", description: "Reusable gold arrow connectors that draw via stroke-dashoffset; configurable direction and length.", usedIn: "Scenes 3, 8", format: "SVG" },
  { name: "Reserve Tier Layers", description: "Stacked tier visualization (Tier 1 Cash → Tier 4 Stablecoin) with reveal animation.", usedIn: "Scene 8", format: "SVG + CSS" },
  { name: "USDC Animation", description: "Circle-blue dollar badge with subtle pulse; used wherever USDC is named.", usedIn: "Scenes 2, 8, 9", format: "SVG + CSS" },
  { name: "Mint / Redeem Animation", description: "Two-state cycle showing USDC in → MTQ out and MTQ in → USDC out.", usedIn: "Scene 3", format: "SVG + CSS" },
  { name: "Oracle Animation", description: "Multi-source price consensus graphic with TWAP fallback indicator.", usedIn: "Scene 7", format: "SVG + CSS" },
  { name: "Statistics Count-Up Rig", description: "Reusable component animating a number from 0 to target over a configurable duration with ease-out.", usedIn: "Scene 4", format: "React + TS" },
  { name: "Gold Divider Draw", description: "Thin gold line that draws left-to-right using clip-path; used as a section separator.", usedIn: "Scenes 1, 10", format: "SVG + CSS" },
  { name: "Verified Badge Pop", description: "Green check badge that scales 1.2→1.0 with a soft shadow ring.", usedIn: "Scene 5", format: "SVG + CSS" },
  { name: "Hexagonal Mark Reveal", description: "MITHQAL hexagonal logo scaling in from 0.8→1.0 with gold stroke.", usedIn: "Scene 10", format: "SVG + CSS" },
  { name: "Typed URL Component", description: "Types a string character-by-character at a configurable rate; blinking cursor.", usedIn: "Scene 6", format: "React + TS" },
  { name: "Tech Tile Grid", description: "3×3 responsive grid of technology tiles with staggered fade-in and highlight ring.", usedIn: "Scene 9", format: "React + TS + CSS" },
];

/* ------------------------------------------------------------------ */
/*  ASSETS LIBRARY                                                     */
/* ------------------------------------------------------------------ */

type AssetItem = {
  category: string;
  name: string;
  format: string;
  available: boolean;
  path: string;
};

const ASSETS: AssetItem[] = [
  { category: "Logos", name: "MITHQAL Hexagonal Mark", format: "SVG", available: true, path: "/video/mithqal-motion-graphics.html (inline SVG)" },
  { category: "Logos", name: "MITHQAL Wordmark", format: "SVG", available: true, path: "Scene 10 inline" },
  { category: "Backgrounds", name: "Deep Navy Gradient", format: "CSS", available: true, path: "linear-gradient(#0A0E1A, #111726)" },
  { category: "Backgrounds", name: "Card Surface", format: "CSS", available: true, path: "#111726 with white/10 border" },
  { category: "Icons", name: "Lucide Icon Set", format: "SVG", available: true, path: "lucide-react" },
  { category: "Icons", name: "Circle Blue Badge", format: "SVG", available: true, path: "Scene 2 inline" },
  { category: "Icons", name: "Green Verified Badge", format: "SVG", available: true, path: "Scene 5 inline" },
  { category: "Animations", name: "Motion Graphics Reel", format: "HTML", available: true, path: "/video/mithqal-motion-graphics.html" },
  { category: "Animations", name: "Demo Video Player", format: "React", available: true, path: "/video" },
  { category: "Overlays", name: "Transparent Stat Card", format: "PNG/SVG", available: false, path: "Generate from Scene 1" },
  { category: "Overlays", name: "Transparent Metric Card", format: "PNG/SVG", available: false, path: "Generate from Scene 4" },
  { category: "Lower Thirds", name: "Scene Title Lower Third", format: "PNG/SVG", available: false, path: "Generate (gold bar + title)" },
  { category: "Lower Thirds", name: "Speaker Lower Third", format: "PNG/SVG", available: false, path: "Generate (placeholder)" },
  { category: "End Cards", name: "Closing End Card", format: "PNG/SVG", available: false, path: "Generate from Scene 10" },
  { category: "Thumbnail", name: "Video Thumbnail", format: "PNG", available: true, path: "/video/thumbnail.png (1344×768)" },
  { category: "Subtitles", name: "Subtitle Track", format: "SRT", available: true, path: "/video/mithqal-demo-subtitles.srt" },
];

/* ------------------------------------------------------------------ */
/*  EVIDENCE PANEL                                                     */
/* ------------------------------------------------------------------ */

type Evidence = {
  claim: string;
  type: "Live API" | "On-chain" | "Repository" | "Documentation" | "Dashboard" | "Unsupported";
  repo?: string;
  address?: string;
  dashboard?: string;
  docs?: string;
  supported: boolean;
};

const EVIDENCE: Evidence[] = [
  {
    claim: "Reserve ratio is 108% on the live dashboard",
    type: "Live API",
    repo: "src/app/api/nav/route.ts",
    dashboard: `${DASHBOARD_URL}/api/nav`,
    supported: true,
  },
  {
    claim: "Dynamic NAV is $1.10, computed from live oracle data",
    type: "Live API",
    repo: "src/lib/monetary-engine-v19.ts",
    dashboard: `${DASHBOARD_URL}/api/nav`,
    supported: true,
  },
  {
    claim: "54M MTQ supply on Monad Testnet",
    type: "On-chain",
    address: CONTRACTS[0].address,
    dashboard: `${DASHBOARD_URL}/api/contract/info`,
    supported: true,
  },
  {
    claim: "9 verified smart contracts on Monad Testnet (Chain ID 10143)",
    type: "On-chain",
    repo: "docs/contracts/CONTRACT_REGISTRY.md",
    dashboard: `${DASHBOARD_URL}/api/onchain-test`,
    supported: true,
  },
  {
    claim: "MTQ token contract is deployed and verified",
    type: "On-chain",
    address: CONTRACTS[0].address,
    repo: "foundry/src/MTQ.sol",
    supported: true,
  },
  {
    claim: "Mint contract allows testnet mint with USDC",
    type: "On-chain",
    address: CONTRACTS[4].address,
    repo: "foundry/src/Mint.sol",
    supported: true,
  },
  {
    claim: "Redeem contract never suspends (§36.3)",
    type: "On-chain",
    address: CONTRACTS[5].address,
    repo: "foundry/src/Redeem.sol",
    docs: "docs/contracts/CONTRACT_REGISTRY.md",
    supported: true,
  },
  {
    claim: "Reserve contract manages the tiered reserve portfolio",
    type: "On-chain",
    address: CONTRACTS[3].address,
    repo: "foundry/src/Reserve.sol",
    supported: true,
  },
  {
    claim: "Oracle contract provides multi-source price consensus",
    type: "On-chain",
    address: CONTRACTS[6].address,
    repo: "foundry/src/Oracle.sol",
    supported: true,
  },
  {
    claim: "10-currency reserve basket support",
    type: "Documentation",
    repo: "src/lib/monetary-engine-v19.ts",
    dashboard: `${DASHBOARD_URL}/api/nav`,
    supported: true,
  },
  {
    claim: "Certora formal verification — specifications complete",
    type: "Repository",
    repo: "foundry/certora/",
    docs: "docs/verification/formal-verification-report.md",
    supported: true,
  },
  {
    claim: "Certora Prover execution — all 9 contracts verified",
    type: "Unsupported",
    supported: false,
  },
  {
    claim: "Foundry invariant tests in place",
    type: "Repository",
    repo: "foundry/test/",
    supported: true,
  },
  {
    claim: "20/20 institutional stress tests passed",
    type: "Repository",
    repo: "src/lib/tests/institutional-stress-tests.ts",
    supported: true,
  },
  {
    claim: "Safe Multi-Sig Treasury deployed",
    type: "On-chain",
    address: TREASURY,
    supported: true,
  },
  {
    claim: "Circle Programmable Wallets integration",
    type: "Unsupported",
    supported: false,
  },
  {
    claim: "Circle Payments API integration",
    type: "Unsupported",
    supported: false,
  },
  {
    claim: "Circle Gas Station integration",
    type: "Unsupported",
    supported: false,
  },
  {
    claim: "Mainnet deployment",
    type: "Unsupported",
    supported: false,
  },
  {
    claim: "Multi-custodian diversification",
    type: "Unsupported",
    supported: false,
  },
];

/* ------------------------------------------------------------------ */
/*  IMPLEMENTED vs PLANNED                                             */
/* ------------------------------------------------------------------ */

const IMPLEMENTED: { label: string; detail: string }[] = [
  { label: "USDC as Tier 4 Reserve Asset", detail: "Regulated stablecoins, including USDC, integrated into the reserve tier structure." },
  { label: "Testnet Mint / Redeem with USDC", detail: "Live mint and redeem primitives on Monad Testnet (Chain ID 10143)." },
  { label: "10-Currency Reserve Support", detail: "Diversified reserve basket computed dynamically by the v19 monetary engine." },
  { label: "Dynamic NAV Calculation", detail: "NAV derived from live oracle prices — not hardcoded." },
  { label: "Live Reserve Dashboard", detail: "Real-time dashboard at mithqal.vercel.app showing RR, NAV, supply, prices." },
  { label: "9 Verified Smart Contracts", detail: "All protocol contracts deployed and verified on Monad Testnet." },
  { label: "Foundry Invariant Tests", detail: "Invariant test suite in foundry/test/." },
  { label: "20/20 Stress Tests Passed", detail: "Institutional stress tests across 13 scenarios + 7-cyberattack vectors." },
];

const PLANNED: { label: string; detail: string }[] = [
  { label: "Circle Programmable Wallets", detail: "Custodial wallet abstraction for participant onboarding. Roadmap." },
  { label: "Circle Payments API", detail: "Fiat on/off-ramp integration for institutional flows. Roadmap." },
  { label: "Circle Gas Station", detail: "Sponsored gas for participant transactions. Roadmap." },
  { label: "Mainnet Deployment", detail: "Migration from Monad Testnet to mainnet post-audit. Roadmap." },
  { label: "Multi-Custodian Diversification", detail: "Reduce single-custodian concentration below constitutional limits. Roadmap." },
  { label: "External Security Audit", detail: "Big-4 / OpenZeppelin / Trail of Bits audit. Pending." },
  { label: "Certora Prover Execution", detail: "Specification complete — execution pending (CVL specs for MTQ + Oracle)." },
  { label: "Legal & Regulatory Opinion", detail: "MTQ regulatory classification opinion. Pending." },
];

/* ------------------------------------------------------------------ */
/*  VIDEO TIMELINE (editing)                                           */
/* ------------------------------------------------------------------ */

type TimelineRow = {
  time: string;
  scene: string;
  audio: string;
  voice: string;
  animation: string;
  transition: string;
  music: string;
};

const TIMELINE: TimelineRow[] = [
  { time: "0:00–0:10", scene: "1 — The Problem", audio: "VO + bed", voice: "Narrator", animation: "Stats fade-in stagger", transition: "Cross-dissolve", music: "Ambient pad in" },
  { time: "0:10–0:25", scene: "2 — Why Circle", audio: "VO + bed", voice: "Narrator", animation: "Pillars slide-in", transition: "Wipe R→L", music: "Pad holds" },
  { time: "0:25–0:45", scene: "3 — What is MITHQAL", audio: "VO + bed", voice: "Narrator", animation: "Flow nodes + arrows draw", transition: "Cross-dissolve", music: "Pad + sub-bass" },
  { time: "0:45–1:30", scene: "4 — Live Dashboard", audio: "VO + bed + UI", voice: "Narrator", animation: "Metric count-up + zoom", transition: "Cross-dissolve", music: "Pad, light percussion in" },
  { time: "1:30–1:55", scene: "5 — Monad Explorer", audio: "VO + bed", voice: "Narrator", animation: "Grid + verified badges pop", transition: "Cross-dissolve", music: "Percussion holds" },
  { time: "1:55–2:15", scene: "6 — GitHub", audio: "VO + bed", voice: "Narrator", animation: "Typed URL + folder chips", transition: "Cross-dissolve", music: "Percussion holds" },
  { time: "2:15–2:35", scene: "7 — Security", audio: "VO + bed", voice: "Narrator", animation: "Layers slide-in left", transition: "Cross-dissolve", music: "Pad swells" },
  { time: "2:35–2:55", scene: "8 — Circle Integration", audio: "VO + bed", voice: "Narrator", animation: "Split columns populate", transition: "Cross-dissolve", music: "Pad + pulse" },
  { time: "2:55–3:10", scene: "9 — Technology", audio: "VO + bed", voice: "Narrator", animation: "Tech tiles + blue glow", transition: "Cross-dissolve", music: "Percussion out" },
  { time: "3:10–3:30", scene: "10 — Closing", audio: "VO + bed", voice: "Narrator", animation: "Mark scale-in + URL hold", transition: "Fade to black", music: "Pad resolve + out" },
];

/* ------------------------------------------------------------------ */
/*  AUDIO RECOMMENDATIONS                                              */
/* ------------------------------------------------------------------ */

type Track = {
  title: string;
  style: string;
  tempo: string;
  mood: string;
  source: string;
};

const AUDIO_RECS: Track[] = [
  { title: "Institutional Calm", style: "Minimal ambient / cinematic", tempo: "70 BPM", mood: "Steady, trustworthy, reserved", source: "Royalty-free library (e.g. Artlist, Epidemic Sound)" },
  { title: "Constitutional Resolve", style: "Modern orchestral / piano + strings", tempo: "80 BPM", mood: "Composed, dignified, forward-moving", source: "Royalty-free library" },
  { title: "Operational Clarity", style: "Electronic ambient / soft synth pad", tempo: "90 BPM", mood: "Clear, optimistic, technical", source: "Royalty-free library" },
  { title: "Quiet Momentum", style: "Underscore / pulsing pad + sub-bass", tempo: "75 BPM", mood: "Patient, building, institutional", source: "Royalty-free library" },
  { title: "Settlement", style: "Cinematic resolve / piano outro", tempo: "60 BPM", mood: "Resolved, final, confident", source: "Royalty-free library" },
];

/* ------------------------------------------------------------------ */
/*  EXPORT CENTER                                                      */
/* ------------------------------------------------------------------ */

type ExportItem = {
  title: string;
  description: string;
  format: string;
  kind: "file" | "blob-md" | "blob-json" | "print";
  href?: string;
  icon: typeof FileText;
};

const EXPORTS: ExportItem[] = [
  { title: "Storyboard PDF", description: "All 10 scenes with visuals, camera, animation, VO, assets, transitions.", format: "PDF", kind: "print", icon: FileText },
  { title: "Voice Script PDF", description: "Full narration with pause markers, emphasis, word count, read time.", format: "PDF", kind: "print", icon: Mic },
  { title: "Subtitle SRT", description: "Existing subtitle track (10 scenes, 3:35).", format: "SRT", kind: "file", href: "/video/mithqal-demo-subtitles.srt", icon: ScrollText },
  { title: "Shot List MD", description: "Markdown shot list table for the production team.", format: "MD", kind: "blob-md", icon: ListChecks },
  { title: "Demo Center JSON", description: "Machine-readable export of all storyboard + script data.", format: "JSON", kind: "blob-json", icon: FileJson },
  { title: "Video Thumbnail", description: "Existing thumbnail (1344×768 PNG).", format: "PNG", kind: "file", href: "/video/thumbnail.png", icon: Camera },
];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function fmtTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function statusBadge(status: string) {
  if (status === "Approved" || status === "Recorded") {
    return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">{status}</Badge>;
  }
  if (status === "Pending") {
    return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20">{status}</Badge>;
  }
  return <Badge className="bg-white/10 text-white/60 border-white/20 hover:bg-white/15">{status}</Badge>;
}

function shortAddr(a: string): string {
  if (a.startsWith("(")) return a;
  return `${a.slice(0, 10)}…${a.slice(-6)}`;
}

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

export default function DemoPage() {
  const [tab, setTab] = useState("overview");

  const captureDone = SCREEN_CAPTURE.filter((s) => s.status !== "Pending").length;
  const capturePct = Math.round((captureDone / SCREEN_CAPTURE.length) * 100);

  const evidenceSupported = EVIDENCE.filter((e) => e.supported).length;
  const evidencePct = Math.round((evidenceSupported / EVIDENCE.length) * 100);

  const implementedPct = Math.round(
    (IMPLEMENTED.length / (IMPLEMENTED.length + PLANNED.length)) * 100
  );

  const goTab = (t: string) => setTab(t);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-6">
          {/* Tab bar */}
          <div className="sticky top-0 z-20 -mx-4 bg-[#0A0E1A]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:border-white/10 sm:px-3">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 overflow-x-auto bg-white/5 p-1.5">
              <TabsTrigger value="overview" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />Overview</TabsTrigger>
              <TabsTrigger value="storyboard" className="gap-1.5"><Clapperboard className="h-3.5 w-3.5" />Storyboard</TabsTrigger>
              <TabsTrigger value="script" className="gap-1.5"><Mic className="h-3.5 w-3.5" />Video Script</TabsTrigger>
              <TabsTrigger value="shots" className="gap-1.5"><Camera className="h-3.5 w-3.5" />Shot List</TabsTrigger>
              <TabsTrigger value="capture" className="gap-1.5"><ListChecks className="h-3.5 w-3.5" />Capture</TabsTrigger>
              <TabsTrigger value="motion" className="gap-1.5"><Layers className="h-3.5 w-3.5" />Motion Graphics</TabsTrigger>
              <TabsTrigger value="assets" className="gap-1.5"><Package className="h-3.5 w-3.5" />Assets</TabsTrigger>
              <TabsTrigger value="evidence" className="gap-1.5"><Scale className="h-3.5 w-3.5" />Evidence</TabsTrigger>
              <TabsTrigger value="matrix" className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Implemented vs Planned</TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1.5"><Clock className="h-3.5 w-3.5" />Timeline</TabsTrigger>
              <TabsTrigger value="audio" className="gap-1.5"><Music className="h-3.5 w-3.5" />Audio</TabsTrigger>
              <TabsTrigger value="export" className="gap-1.5"><Download className="h-3.5 w-3.5" />Export</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <Overview onNavigate={goTab} />
          </TabsContent>
          <TabsContent value="storyboard">
            <Storyboard />
          </TabsContent>
          <TabsContent value="script">
            <VideoScript />
          </TabsContent>
          <TabsContent value="shots">
            <ShotList />
          </TabsContent>
          <TabsContent value="capture">
            <CaptureChecklist done={captureDone} total={SCREEN_CAPTURE.length} pct={capturePct} />
          </TabsContent>
          <TabsContent value="motion">
            <MotionGraphics />
          </TabsContent>
          <TabsContent value="assets">
            <AssetsLibrary />
          </TabsContent>
          <TabsContent value="evidence">
            <EvidencePanel supported={evidenceSupported} total={EVIDENCE.length} pct={evidencePct} />
          </TabsContent>
          <TabsContent value="matrix">
            <Matrix implementedPct={implementedPct} />
          </TabsContent>
          <TabsContent value="timeline">
            <VideoTimeline />
          </TabsContent>
          <TabsContent value="audio">
            <AudioRecommendations />
          </TabsContent>
          <TabsContent value="export">
            <ExportCenter />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HEADER + FOOTER                                                    */
/* ------------------------------------------------------------------ */

function Header() {
  return (
    <header className="border-b border-white/10 bg-[#0A0E1A]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to MITHQAL
        </Link>
        <div className="flex items-center gap-2 text-sm font-medium text-[#C9A961]">
          <Film className="h-4 w-4" />
          Circle Hackathon Demo Center
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0A0E1A] px-6 py-6 text-center text-xs text-white/40">
      <div className="mx-auto w-full max-w-7xl">
        <p>
          MITHQAL — Constitutional Monetary Settlement Institution ·{" "}
          <a
            href={DASHBOARD_URL}
            className="text-[#C9A961] transition hover:text-[#E8C97A]"
            target="_blank"
            rel="noopener noreferrer"
          >
            mithqal.vercel.app
          </a>
        </p>
        <p className="mt-1 text-white/25">
          Demo Center · Task 16-a · Every claim verified against the live MVP
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION WRAPPERS                                                   */
/* ------------------------------------------------------------------ */

function SectionShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-in fade-in duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-3xl text-sm text-white/50">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function PanelCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-white/10 bg-[#111726] p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  1. OVERVIEW                                                        */
/* ------------------------------------------------------------------ */

function Overview({ onNavigate }: { onNavigate: (t: string) => void }) {
  return (
    <SectionShell
      title="Overview"
      subtitle="A presentation center for Circle Hackathon judges — every section is grounded in the current MVP."
    >
      <PanelCard className="mb-6 overflow-hidden">
        <div className="flex flex-col items-start gap-6">
          <div className="flex items-center gap-2">
            <Badge className="border-[#2775CA]/40 bg-[#2775CA]/15 text-[#7FB3F0] hover:bg-[#2775CA]/20">
              <CircleDot className="mr-1 h-3 w-3" /> Circle Hackathon Submission
            </Badge>
            <Badge className="border-[#C9A961]/40 bg-[#C9A961]/15 text-[#C9A961] hover:bg-[#C9A961]/20">
              Monad Testnet · Chain ID {CHAIN_ID}
            </Badge>
          </div>

          <div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              MITHQAL —{" "}
              <span className="text-[#C9A961]">Constitutional USDC</span>{" "}
              Settlement Infrastructure
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/60 sm:text-lg">
              MITHQAL is a constitutional, fully-reserved monetary settlement
              institution that explores how Circle&rsquo;s USDC can serve as the
              operational liquidity layer for transparent, programmable,
              institutional cross-border settlement. The platform is live on
              Monad Testnet with 9 verified smart contracts, a dynamic NAV
              computed from real oracle data, and a public dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/video">
              <Button className="bg-[#C9A961] text-[#0A0E1A] hover:bg-[#E8C97A]">
                <Play className="mr-2 h-4 w-4 fill-[#0A0E1A]" />
                Watch Demo
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => onNavigate("storyboard")}
            >
              <Clapperboard className="mr-2 h-4 w-4" />
              Storyboard
            </Button>
            <Button
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => onNavigate("assets")}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Assets
            </Button>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </a>
            <a href={DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
              <Button className="bg-[#2775CA] text-white hover:bg-[#1F5BA0]">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Live Dashboard
              </Button>
            </a>
          </div>
        </div>
      </PanelCard>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile value="9" label="Verified Contracts" />
        <StatTile value="108%" label="Reserve Ratio" />
        <StatTile value="$1.10" label="Dynamic NAV" />
        <StatTile value="54M" label="MTQ Supply" />
        <StatTile value="20/20" label="Stress Tests" />
        <StatTile value="3:30" label="Demo Runtime" />
      </div>

      <PanelCard>
        <h3 className="mb-4 text-sm font-semibold text-[#C9A961]">
          Explore the Demo Center
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { t: "storyboard", label: "Storyboard", icon: Clapperboard, desc: "10 scenes, expandable" },
            { t: "script", label: "Video Script", icon: Mic, desc: "Full narration" },
            { t: "shots", label: "Shot List", icon: Camera, desc: "Production table" },
            { t: "capture", label: "Capture Checklist", icon: ListChecks, desc: "Screen recordings" },
            { t: "motion", label: "Motion Graphics", icon: Layers, desc: "Reusable assets" },
            { t: "assets", label: "Assets Library", icon: Package, desc: "SVG, PNG, icons" },
            { t: "evidence", label: "Evidence Panel", icon: Scale, desc: "Every claim sourced" },
            { t: "matrix", label: "Implemented vs Planned", icon: CheckCircle2, desc: "Honest split" },
          ].map((q) => (
            <button
              key={q.t}
              onClick={() => onNavigate(q.t)}
              className="flex flex-col items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition hover:border-[#C9A961]/40 hover:bg-white/10"
            >
              <q.icon className="h-5 w-5 text-[#C9A961]" />
              <span className="text-sm font-medium text-white">{q.label}</span>
              <span className="text-xs text-white/40">{q.desc}</span>
            </button>
          ))}
        </div>
      </PanelCard>
    </SectionShell>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <Card className="items-center gap-1 bg-[#111726] px-4 py-4 text-center text-white">
      <div className="text-2xl font-bold tabular-nums text-[#C9A961]">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  2. STORYBOARD                                                      */
/* ------------------------------------------------------------------ */

function Storyboard() {
  return (
    <SectionShell
      title="Storyboard"
      subtitle="10 scenes · total runtime 3:30 · each scene expandable with objective, visuals, camera, animation, voice-over, assets, and transition."
    >
      <Accordion type="single" collapsible className="flex flex-col gap-3">
        {SCENES.map((s) => (
          <AccordionItem
            key={s.num}
            value={`scene-${s.num}`}
            className="overflow-hidden rounded-xl border border-white/10 bg-[#111726] px-4 sm:px-6"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex w-full items-center gap-4 pr-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#C9A961]/40 bg-[#C9A961]/10 text-sm font-bold text-[#C9A961]">
                  {s.num}
                </div>
                <div className="flex flex-1 flex-col items-start gap-1 text-left sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-base font-semibold text-white">
                    {s.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Clock className="h-3 w-3" />
                    <span className="font-mono">
                      {s.start}–{s.end}
                    </span>
                    <span className="text-white/30">·</span>
                    <span className="font-mono">{s.duration}</span>
                  </div>
                </div>
                {statusBadge(s.status)}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="grid gap-4 pb-4 sm:grid-cols-2">
                <Field label="Objective" value={s.objective} />
                <Field label="Duration" value={`${s.duration} (${s.start}–${s.end})`} mono />
                <Field label="Visuals" value={s.visuals} />
                <Field label="Camera" value={s.camera} />
                <Field label="Animation" value={s.animation} />
                <Field label="Transition" value={s.transition} />
                <Field label="Assets Required" value={s.assets} />
                <Field label="Voice Over" value={s.voiceOver} />
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                <Checkbox checked={s.status === "Approved"} disabled />
                <span className="text-xs text-white/40">
                  Status: {s.status}
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionShell>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#C9A961]">
        {label}
      </div>
      <div
        className={`text-sm leading-relaxed text-white/70 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  3. VIDEO SCRIPT                                                    */
/* ------------------------------------------------------------------ */

function VideoScript() {
  return (
    <SectionShell
      title="Video Script"
      subtitle="Full narration for all 10 scenes. Markers: [PAUSE] = beat, **bold** = emphasis."
    >
      <PanelCard className="mb-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ScriptStat label="Scenes" value={String(VIDEO_SCRIPT.length)} />
          <ScriptStat label="Total Words" value={TOTAL_WORDS.toLocaleString()} />
          <ScriptStat label="Read Time" value={fmtTime(TOTAL_READ_SECS)} />
          <ScriptStat label="Video Runtime" value="3:30" />
        </div>
      </PanelCard>

      <div className="flex flex-col gap-4">
        {VIDEO_SCRIPT.map((line) => (
          <PanelCard key={line.scene}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9A961]/40 bg-[#C9A961]/10 text-xs font-bold text-[#C9A961]">
                  {line.scene}
                </span>
                <span className="text-base font-semibold text-white">
                  {line.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="font-mono">{line.time}</span>
                <span className="text-white/20">·</span>
                <span>{line.words} words</span>
                <span className="text-white/20">·</span>
                <span>read {line.readTime}</span>
              </div>
            </div>
            <ScriptText text={line.text} />
          </PanelCard>
        ))}
      </div>
    </SectionShell>
  );
}

function ScriptStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-bold tabular-nums text-[#C9A961]">{value}</div>
      <div className="mt-1 text-xs text-white/50">{label}</div>
    </div>
  );
}

function ScriptText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[PAUSE\])/g);
  return (
    <p className="text-base leading-relaxed text-white/80">
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-[#C9A961]">
              {p.slice(2, -2)}
            </strong>
          );
        }
        if (p === "[PAUSE]") {
          return (
            <span
              key={i}
              className="mx-1 inline-flex items-center rounded border border-white/20 bg-white/5 px-1.5 py-0.5 align-middle font-mono text-[10px] text-white/50"
            >
              PAUSE
            </span>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  4. SHOT LIST                                                       */
/* ------------------------------------------------------------------ */

function ShotList() {
  return (
    <SectionShell
      title="Shot List"
      subtitle="Production shot list — one row per scene, ready for the camera operator and editor."
    >
      <PanelCard className="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Scene</TableHead>
                <TableHead className="text-white/50">Camera</TableHead>
                <TableHead className="text-white/50">Screen Rec</TableHead>
                <TableHead className="text-white/50">Zoom</TableHead>
                <TableHead className="text-white/50">Pan</TableHead>
                <TableHead className="text-white/50">Transition</TableHead>
                <TableHead className="text-white/50">Duration</TableHead>
                <TableHead className="hidden text-white/50 lg:table-cell">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SHOT_LIST.map((shot) => (
                <TableRow
                  key={shot.scene}
                  className="border-white/5 text-white/70"
                >
                  <TableCell className="font-medium text-white">
                    {shot.scene}
                  </TableCell>
                  <TableCell>{shot.camera}</TableCell>
                  <TableCell>
                    {shot.screenRecording ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <Check className="h-3 w-3" /> Yes
                      </span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-white/50">{shot.zoom}</TableCell>
                  <TableCell className="text-white/50">{shot.pan}</TableCell>
                  <TableCell className="text-white/50">{shot.transition}</TableCell>
                  <TableCell className="font-mono text-[#C9A961]">{shot.duration}</TableCell>
                  <TableCell className="hidden text-xs text-white/40 lg:table-cell">
                    {shot.notes}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PanelCard>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  5. SCREEN CAPTURE CHECKLIST                                        */
/* ------------------------------------------------------------------ */

function CaptureChecklist({
  done,
  total,
  pct,
}: {
  done: number;
  total: number;
  pct: number;
}) {
  return (
    <SectionShell
      title="Screen Capture Checklist"
      subtitle="Every screen that must be recorded for the demo. Status: Pending → Recorded → Approved."
    >
      <PanelCard className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/50">Capture progress</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-[#C9A961]">
              {done} / {total}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/50">Complete</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-white">{pct}%</div>
          </div>
        </div>
        <Progress value={pct} className="mt-4 h-2 bg-white/10" />
      </PanelCard>

      <div className="grid gap-3 sm:grid-cols-2">
        {SCREEN_CAPTURE.map((item) => (
          <PanelCard key={item.id} className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox checked={item.status !== "Pending"} disabled className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">{item.label}</span>
                  {statusBadge(item.status)}
                </div>
                <p className="mt-1 text-xs text-white/50">{item.detail}</p>
              </div>
            </div>
          </PanelCard>
        ))}
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  6. MOTION GRAPHICS                                                 */
/* ------------------------------------------------------------------ */

function MotionGraphics() {
  return (
    <SectionShell
      title="Motion Graphics"
      subtitle="Reusable animated assets used across scenes. Each asset is composable and configurable."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOTION_GRAPHICS.map((m) => (
          <PanelCard key={m.name} className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#C9A961]/30 bg-[#C9A961]/10">
                <Layers className="h-5 w-5 text-[#C9A961]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{m.name}</div>
                <div className="mt-1 text-xs text-white/50">{m.description}</div>
              </div>
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
              <Badge className="border-[#2775CA]/30 bg-[#2775CA]/10 text-[#7FB3F0] hover:bg-[#2775CA]/15">
                {m.format}
              </Badge>
              <span className="text-xs text-white/40">Used in: {m.usedIn}</span>
            </div>
          </PanelCard>
        ))}
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  7. ASSETS LIBRARY                                                  */
/* ------------------------------------------------------------------ */

function AssetsLibrary() {
  const categories = useMemo(
    () => Array.from(new Set(ASSETS.map((a) => a.category))),
    []
  );
  return (
    <SectionShell
      title="Assets Library"
      subtitle="Brand, backgrounds, icons, animations, overlays, lower thirds, end cards, and thumbnail."
    >
      <div className="flex flex-col gap-6">
        {categories.map((cat) => (
          <div key={cat}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#C9A961]">
              <Package className="h-4 w-4" />
              {cat}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ASSETS.filter((a) => a.category === cat).map((a) => (
                <PanelCard key={a.name} className="flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white">{a.name}</span>
                    {a.available ? (
                      <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20">
                        <Check className="mr-1 h-3 w-3" /> Available
                      </Badge>
                    ) : (
                      <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-400 hover:bg-amber-500/20">
                        <CircleDashed className="mr-1 h-3 w-3" /> To generate
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="border-white/20 text-white/60">
                      {a.format}
                    </Badge>
                    <span className="truncate font-mono text-white/40">{a.path}</span>
                  </div>
                  {a.available && a.href && (
                    <a
                      href={a.href}
                      download
                      className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A961] transition hover:text-[#E8C97A]"
                    >
                      <Download className="h-3 w-3" /> Download
                    </a>
                  )}
                </PanelCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  8. EVIDENCE PANEL                                                  */
/* ------------------------------------------------------------------ */

function EvidencePanel({
  supported,
  total,
  pct,
}: {
  supported: number;
  total: number;
  pct: number;
}) {
  return (
    <SectionShell
      title="Evidence Panel"
      subtitle="Every claim in the video is referenced to evidence. Unsupported claims are marked clearly."
    >
      <PanelCard className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/50">Claims supported</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">
              {supported} / {total}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/50">Evidence coverage</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-white">{pct}%</div>
          </div>
        </div>
        <Progress value={pct} className="mt-4 h-2 bg-white/10" />
      </PanelCard>

      <PanelCard className="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Claim</TableHead>
                <TableHead className="text-white/50">Type</TableHead>
                <TableHead className="text-white/50">Repository</TableHead>
                <TableHead className="text-white/50">Contract</TableHead>
                <TableHead className="text-white/50">Dashboard</TableHead>
                <TableHead className="text-white/50">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EVIDENCE.map((e, i) => (
                <TableRow key={i} className="border-white/5 align-top">
                  <TableCell className="max-w-xs font-medium text-white">
                    {e.claim}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-white/20 text-white/60">
                      {e.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-white/50">
                    {e.repo ? (
                      <a
                        href={`${GITHUB_URL}/blob/main/${e.repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[#C9A961] transition hover:text-[#E8C97A]"
                      >
                        <Link2 className="h-3 w-3" />
                        {e.repo}
                      </a>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {e.address ? (
                      <a
                        href={`${EXPLORER_BASE}/${e.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[#C9A961] transition hover:text-[#E8C97A]"
                      >
                        <Link2 className="h-3 w-3" />
                        {shortAddr(e.address)}
                      </a>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-white/50">
                    {e.dashboard ? (
                      <a
                        href={e.dashboard}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#7FB3F0] transition hover:text-[#A8CCEE]"
                      >
                        <ExternalLink className="h-3 w-3" />
                        API
                      </a>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {e.supported ? (
                      <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20">
                        <Check className="mr-1 h-3 w-3" /> Supported
                      </Badge>
                    ) : (
                      <Badge className="border-red-500/30 bg-red-500/15 text-red-400 hover:bg-red-500/20">
                        <AlertTriangle className="mr-1 h-3 w-3" /> Unsupported
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PanelCard>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  9. IMPLEMENTED vs PLANNED                                          */
/* ------------------------------------------------------------------ */

function Matrix({ implementedPct }: { implementedPct: number }) {
  return (
    <SectionShell
      title="Implemented vs Planned"
      subtitle="An honest split. Anything not yet built is labelled PLANNED or ROADMAP — never presented as shipped."
    >
      <PanelCard className="mb-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/50">
            Implemented share of total scope
          </div>
          <div className="text-2xl font-bold tabular-nums text-[#C9A961]">
            {implementedPct}%
          </div>
        </div>
        <Progress value={implementedPct} className="mt-3 h-2 bg-white/10" />
        <p className="mt-2 text-xs text-white/40">
          Implemented: {IMPLEMENTED.length} · Planned: {PLANNED.length}
        </p>
      </PanelCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <PanelCard>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Implemented</h3>
              <p className="text-xs text-white/40">Live on Monad Testnet today</p>
            </div>
          </div>
          <ul className="flex flex-col gap-3">
            {IMPLEMENTED.map((item) => (
              <li
                key={item.label}
                className="flex items-start gap-3 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-3"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <div>
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="mt-0.5 text-xs text-white/50">{item.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A961]/15">
              <Route className="h-5 w-5 text-[#C9A961]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Planned · Roadmap</h3>
              <p className="text-xs text-white/40">Not yet implemented</p>
            </div>
          </div>
          <ul className="flex flex-col gap-3">
            {PLANNED.map((item) => (
              <li
                key={item.label}
                className="flex items-start gap-3 rounded-lg border border-[#C9A961]/15 bg-[#C9A961]/[0.04] p-3"
              >
                <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A961]" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-white">{item.label}</span>
                    <Badge className="border-[#C9A961]/40 bg-[#C9A961]/15 text-[#C9A961] hover:bg-[#C9A961]/20">
                      PLANNED
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-white/50">{item.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  10. VIDEO TIMELINE                                                 */
/* ------------------------------------------------------------------ */

function VideoTimeline() {
  return (
    <SectionShell
      title="Video Timeline"
      subtitle="Editing timeline — one row per scene with audio, voice, animation, transition, and music cue."
    >
      <PanelCard className="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Time</TableHead>
                <TableHead className="text-white/50">Scene</TableHead>
                <TableHead className="text-white/50">Audio</TableHead>
                <TableHead className="text-white/50">Voice</TableHead>
                <TableHead className="text-white/50">Animation</TableHead>
                <TableHead className="text-white/50">Transition</TableHead>
                <TableHead className="text-white/50">Music</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TIMELINE.map((row) => (
                <TableRow key={row.time} className="border-white/5 text-white/70">
                  <TableCell className="font-mono text-[#C9A961]">{row.time}</TableCell>
                  <TableCell className="font-medium text-white">{row.scene}</TableCell>
                  <TableCell className="text-white/50">{row.audio}</TableCell>
                  <TableCell className="text-white/50">{row.voice}</TableCell>
                  <TableCell className="text-xs text-white/50">{row.animation}</TableCell>
                  <TableCell className="text-xs text-white/50">{row.transition}</TableCell>
                  <TableCell className="text-xs text-white/50">{row.music}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PanelCard>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  11. AUDIO RECOMMENDATIONS                                          */
/* ------------------------------------------------------------------ */

function AudioRecommendations() {
  return (
    <SectionShell
      title="Audio Recommendations"
      subtitle="Five royalty-free track directions. Institutional, restrained — no crypto hype."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {AUDIO_RECS.map((track, i) => (
          <PanelCard key={track.title} className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#C9A961]/30 bg-[#C9A961]/10 text-lg font-bold text-[#C9A961]">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-white">{track.title}</h3>
                <Badge variant="outline" className="border-white/20 text-white/60">
                  <Music className="mr-1 h-3 w-3" /> {track.tempo}
                </Badge>
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-1.5 text-xs">
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-white/40">Style:</dt>
                  <dd className="text-white/70">{track.style}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-white/40">Mood:</dt>
                  <dd className="text-white/70">{track.mood}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-white/40">Source:</dt>
                  <dd className="text-white/70">{track.source}</dd>
                </div>
              </dl>
            </div>
          </PanelCard>
        ))}
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  12. EXPORT CENTER                                                  */
/* ------------------------------------------------------------------ */

function ExportCenter() {
  const handleExport = (item: ExportItem) => {
    if (item.kind === "blob-json") {
      const data = {
        generatedAt: new Date().toISOString(),
        scenes: SCENES,
        script: VIDEO_SCRIPT,
        shotList: SHOT_LIST,
        screenCapture: SCREEN_CAPTURE,
        motionGraphics: MOTION_GRAPHICS,
        evidence: EVIDENCE,
        implemented: IMPLEMENTED,
        planned: PLANNED,
        timeline: TIMELINE,
        audio: AUDIO_RECS,
      };
      downloadText(
        "mithqal-demo-center.json",
        JSON.stringify(data, null, 2),
        "application/json"
      );
      return;
    }
    if (item.kind === "blob-md") {
      const md = buildShotListMarkdown();
      downloadText("mithqal-shot-list.md", md, "text/markdown");
      return;
    }
    if (item.kind === "print") {
      if (item.title === "Storyboard PDF") {
        openPrintView("MITHQAL — Storyboard", buildStoryboardHTML());
      } else if (item.title === "Voice Script PDF") {
        openPrintView("MITHQAL — Voice Script", buildScriptHTML());
      }
      return;
    }
  };

  return (
    <SectionShell
      title="Export Center"
      subtitle="Download the storyboard, voice script, subtitles, shot list, and full data export."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORTS.map((item) => {
          const Icon = item.icon;
          if (item.kind === "file" && item.href) {
            return (
              <a key={item.title} href={item.href} download className="block">
                <PanelCard className="h-full transition hover:border-[#C9A961]/40 hover:bg-white/[0.06]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#C9A961]/30 bg-[#C9A961]/10">
                      <Icon className="h-5 w-5 text-[#C9A961]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{item.title}</span>
                        <Badge variant="outline" className="border-white/20 text-white/60">
                          {item.format}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-white/50">{item.description}</p>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A961]">
                        <Download className="h-3 w-3" /> Download
                      </span>
                    </div>
                  </div>
                </PanelCard>
              </a>
            );
          }
          return (
            <button key={item.title} onClick={() => handleExport(item)} className="block text-left">
              <PanelCard className="h-full transition hover:border-[#C9A961]/40 hover:bg-white/[0.06]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#C9A961]/30 bg-[#C9A961]/10">
                    <Icon className="h-5 w-5 text-[#C9A961]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{item.title}</span>
                      <Badge variant="outline" className="border-white/20 text-white/60">
                        {item.format}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-white/50">{item.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A961]">
                      <Download className="h-3 w-3" /> {item.kind === "print" ? "Open print view" : "Generate"}
                    </span>
                  </div>
                </div>
              </PanelCard>
            </button>
          );
        })}
      </div>

      <PanelCard className="mt-6">
        <div className="flex items-start gap-3">
          <FileType className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A961]" />
          <div>
            <h3 className="text-sm font-semibold text-[#C9A961]">Export notes</h3>
            <ul className="mt-2 space-y-1 text-xs text-white/60">
              <li>• Storyboard PDF and Voice Script PDF open a print-optimized view — use your browser&rsquo;s &ldquo;Save as PDF&rdquo;.</li>
              <li>• JSON and Shot List MD are generated client-side from the live data on this page.</li>
              <li>• Subtitle SRT and Thumbnail PNG link to the existing production assets in <code className="font-mono text-white/50">/video/</code>.</li>
            </ul>
          </div>
        </div>
      </PanelCard>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  EXPORT HELPERS (client-side generation)                            */
/* ------------------------------------------------------------------ */

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openPrintView(title: string, html: string) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups to export the print view.");
    return;
  }
  win.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>${title}</title>
  <style>
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#0A0E1A; color:#fff; margin:0; padding:40px; }
    h1 { color:#C9A961; font-size:24px; border-bottom:1px solid #C9A961; padding-bottom:8px; }
    h2 { color:#C9A961; font-size:16px; margin-top:24px; }
    .scene { border:1px solid #222; border-radius:8px; padding:16px; margin:12px 0; background:#111726; }
    .field { margin:6px 0; font-size:13px; }
    .field b { color:#C9A961; }
    .meta { color:#888; font-size:12px; font-family:monospace; }
    @media print { body { background:#fff; color:#000; } h1,h2 { color:#1a1a1a; } .scene { border-color:#ccc; background:#fff; } .field b { color:#000; } .meta { color:#444; } }
  </style></head><body>${html}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

function buildStoryboardHTML(): string {
  const rows = SCENES.map(
    (s) => `
    <div class="scene">
      <h2>Scene ${s.num} — ${s.name} <span class="meta">(${s.start}–${s.end} · ${s.duration})</span></h2>
      <div class="field"><b>Objective:</b> ${escapeHtml(s.objective)}</div>
      <div class="field"><b>Visuals:</b> ${escapeHtml(s.visuals)}</div>
      <div class="field"><b>Camera:</b> ${escapeHtml(s.camera)}</div>
      <div class="field"><b>Animation:</b> ${escapeHtml(s.animation)}</div>
      <div class="field"><b>Voice Over:</b> ${escapeHtml(s.voiceOver)}</div>
      <div class="field"><b>Assets:</b> ${escapeHtml(s.assets)}</div>
      <div class="field"><b>Transition:</b> ${escapeHtml(s.transition)}</div>
      <div class="field"><b>Status:</b> ${s.status}</div>
    </div>`
  ).join("");
  return `<h1>MITHQAL — Storyboard (10 scenes · 3:30)</h1>${rows}`;
}

function buildScriptHTML(): string {
  const rows = VIDEO_SCRIPT.map(
    (l) => `
    <div class="scene">
      <h2>Scene ${l.scene} — ${l.title} <span class="meta">(${l.time} · ${l.words} words · read ${l.readTime})</span></h2>
      <div class="field">${escapeHtml(l.text)}</div>
    </div>`
  ).join("");
  return `<h1>MITHQAL — Voice Script (${TOTAL_WORDS} words · ${fmtTime(TOTAL_READ_SECS)} read)</h1>${rows}`;
}

function buildShotListMarkdown(): string {
  const header = `# MITHQAL — Shot List\n\n| Scene | Camera | Screen Rec | Zoom | Pan | Transition | Duration | Notes |\n|---|---|---|---|---|---|---|---|\n`;
  const rows = SHOT_LIST.map(
    (s) =>
      `| ${s.scene} | ${s.camera} | ${s.screenRecording ? "Yes" : "—"} | ${s.zoom} | ${s.pan} | ${s.transition} | ${s.duration} | ${s.notes.replace(/\|/g, "/")} |`
  ).join("\n");
  return `${header}${rows}\n`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
