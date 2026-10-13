"use client";

import { motion } from "framer-motion";

/**
 * ReadinessDashboard — Institutional readiness circular gauges.
 *
 * ALGORITHMIC DESIGN:
 * Reads the REAL governance data from the institutional audit (prompts 1-77)
 * and displays it as animated circular progress rings:
 *
 *   - G0 Gate: 0/16 issues resolved (0%)
 *   - G1 Gate: 0/50 legal questions answered (0%)
 *   - Pilot Readiness: 0/18 conditions met (0%)
 *   - Provider Harmony: 5/5 providers live (100%)
 *   - Banks Contacted: 0/15 researched (0%)
 *   - Prompt Coverage: 1/77 verified (1.3%)
 *
 * Each ring animates from 0 to its actual value on scroll into view.
 * Color-coded: red (0-25%), amber (25-75%), green (75-100%).
 *
 * This makes the institutional governance data VISUAL —
 * visitors can instantly see where the program stands.
 */

interface Gauge {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}

const GAUGES: Gauge[] = [
  { label: "G0 Gate", value: 0, max: 16, unit: "issues resolved", color: "#ef4444" },
  { label: "G1 Gate", value: 0, max: 50, unit: "questions answered", color: "#ef4444" },
  { label: "Pilot Readiness", value: 0, max: 18, unit: "conditions met", color: "#ef4444" },
  { label: "Provider Harmony", value: 5, max: 5, unit: "providers live", color: "#10b981" },
  { label: "Banks Contacted", value: 0, max: 15, unit: "banks engaged", color: "#ef4444" },
  { label: "Prompt Coverage", value: 1, max: 77, unit: "verified complete", color: "#f59e0b" },
];

function CircularProgress({ gauge }: { gauge: Gauge }) {
  const percentage = gauge.max > 0 ? (gauge.value / gauge.max) * 100 : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 stagger-card">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background ring */}
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          {/* Progress ring */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={gauge.color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: gauge.color }}>
            {gauge.value}/{gauge.max}
          </span>
          <span className="text-xs text-[#94a3b8]">{percentage.toFixed(0)}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-white">{gauge.label}</div>
        <div className="text-xs text-[#94a3b8]">{gauge.unit}</div>
      </div>
    </div>
  );
}

export default function ReadinessDashboard() {
  const overallScore = GAUGES.reduce((sum, g) => {
    const pct = g.max > 0 ? (g.value / g.max) * 100 : 0;
    return sum + pct;
  }, 0) / GAUGES.length;

  return (
    <div className="bg-white/5 border border-amber-500/10 rounded-2xl p-8 scroll-reveal">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Institutional Readiness Dashboard</h3>
        <p className="text-sm text-[#94a3b8]">Live governance metrics from the MITHQAL institutional audit (prompts 1-77)</p>
      </div>

      {/* Overall score */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="text-center">
          <div className="text-5xl font-bold" style={{ color: overallScore > 75 ? "#10b981" : overallScore > 25 ? "#f59e0b" : "#ef4444" }}>
            {overallScore.toFixed(1)}%
          </div>
          <div className="text-xs text-[#94a3b8] uppercase tracking-[0.18em] mt-1">Overall Readiness</div>
        </div>
      </div>

      {/* Gauges grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
        {GAUGES.map((gauge) => (
          <CircularProgress key={gauge.label} gauge={gauge} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-6 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-[#94a3b8]">Blocked (0-25%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-[#94a3b8]">Marginal (25-75%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-[#94a3b8]">Healthy (75-100%)</span>
        </div>
      </div>

      {/* State markers */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <span className="text-xs px-3 py-1 rounded-full border border-red-500/30 text-red-400/80 bg-red-500/5">NOT PRODUCTION-AUTHORIZED</span>
        <span className="text-xs px-3 py-1 rounded-full border border-amber-500/30 text-amber-400/80 bg-amber-500/5">BUILD_MODE = FROZEN</span>
        <span className="text-xs px-3 py-1 rounded-full border border-amber-500/30 text-amber-400/80 bg-amber-500/5">MTQ DISABLED</span>
      </div>
    </div>
  );
}
