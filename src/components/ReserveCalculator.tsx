"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

/**
 * ReserveCalculator — Interactive reserve backing calculator.
 *
 * ALGORITHMIC DESIGN:
 * Users drag sliders for Recognized, Encumbered, and Allocated amounts.
 * The calculator computes "Available Backing" in real-time:
 *   Available = Recognized − Encumbered − Allocated
 *
 * Visual feedback:
 *   - Animated bars that resize in real-time
 *   - Color-coded: gold (recognized), red (encumbered), amber (allocated), emerald (available)
 *   - 130% backing ratio indicator (green if ≥130%, red if <130%)
 *   - Over-encumbrance warning if Available < 0
 *
 * This makes the mathematical reserve specification TANGIBLE —
 * users can experiment with different scenarios and understand
 * why the 130% backing specification exists.
 */

export default function ReserveCalculator() {
  const [recognized, setRecognized] = useState(130);
  const [encumbered, setEncumbered] = useState(45);
  const [allocated, setAllocated] = useState(26);

  const available = useMemo(() => recognized - encumbered - allocated, [recognized, encumbered, allocated]);
  const backingRatio = recognized > 0 ? (available / 100) * 100 : 0; // ratio against a 100M baseline
  const isOverencumbered = available < 0;
  const isHealthy = available >= 30; // 30% available = healthy (130% backing)

  const maxVal = 200; // max slider value

  const barWidth = (val: number) => `${Math.min(Math.max(val / maxVal * 100, 2), 100)}%`;

  return (
    <div className="bg-white/5 border border-amber-500/10 rounded-2xl p-8 stagger-card">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Reserve Backing Calculator</h3>
        <p className="text-sm text-[#94a3b8]">Adjust the sliders to see how backing availability is computed</p>
      </div>

      {/* Formula display */}
      <div className="bg-black/30 backdrop-blur-md border border-amber-500/10 rounded-xl p-6 mb-8 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2 text-lg font-mono">
          <span className="text-amber-400">{recognized}M</span>
          <span className="text-slate-500">−</span>
          <span className="text-red-400">{encumbered}M</span>
          <span className="text-slate-500">−</span>
          <span className="text-amber-400">{allocated}M</span>
          <span className="text-slate-500">=</span>
          <motion.span
            key={available}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`font-bold ${isOverencumbered ? "text-red-400" : "text-emerald-400"}`}
          >
            {available}M
          </motion.span>
        </div>
        <div className="text-xs text-[#94a3b8] mt-2 uppercase tracking-[0.18em]">Recognized − Encumbered − Allocated = Available Backing</div>
      </div>

      {/* Animated bars */}
      <div className="space-y-4 mb-8">
        {/* Recognized */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-amber-400">Recognized Reserve</span>
            <span className="text-sm font-bold text-amber-400">${recognized}M</span>
          </div>
          <div className="h-8 bg-slate-700/30 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" animate={{ width: barWidth(recognized) }} transition={{ duration: 0.3 }} />
          </div>
          <input type="range" min="0" max={maxVal} value={recognized} onChange={(e) => setRecognized(Number(e.target.value))} className="w-full mt-2 accent-amber-400 cursor-pointer" />
        </div>

        {/* Encumbered */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-red-400">Encumbered</span>
            <span className="text-sm font-bold text-red-400">${encumbered}M</span>
          </div>
          <div className="h-8 bg-slate-700/30 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" animate={{ width: barWidth(encumbered) }} transition={{ duration: 0.3 }} />
          </div>
          <input type="range" min="0" max={maxVal} value={encumbered} onChange={(e) => setEncumbered(Number(e.target.value))} className="w-full mt-2 accent-red-400 cursor-pointer" />
        </div>

        {/* Allocated */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-amber-400">Allocated</span>
            <span className="text-sm font-bold text-amber-400">${allocated}M</span>
          </div>
          <div className="h-8 bg-slate-700/30 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full" animate={{ width: barWidth(allocated) }} transition={{ duration: 0.3 }} />
          </div>
          <input type="range" min="0" max={maxVal} value={allocated} onChange={(e) => setAllocated(Number(e.target.value))} className="w-full mt-2 accent-amber-500 cursor-pointer" />
        </div>

        {/* Available */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-medium ${isOverencumbered ? "text-red-400" : "text-emerald-400"}`}>Available Backing</span>
            <motion.span key={available} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className={`text-sm font-bold ${isOverencumbered ? "text-red-400" : "text-emerald-400"}`}>
              ${available}M
            </motion.span>
          </div>
          <div className="h-8 bg-slate-700/30 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isOverencumbered ? "bg-gradient-to-r from-red-600 to-red-400" : "bg-gradient-to-r from-emerald-600 to-emerald-400"}`}
              animate={{ width: barWidth(Math.abs(available)) }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {isOverencumbered ? (
          <span className="text-xs px-4 py-2 rounded-full border border-red-500/40 text-red-400 bg-red-500/5">⚠ OVER-ENCUMBERED — Available backing is negative</span>
        ) : isHealthy ? (
          <span className="text-xs px-4 py-2 rounded-full border border-emerald-500/40 text-emerald-400 bg-emerald-500/5">✓ HEALTHY — Available backing ≥ 30% (130% specification met)</span>
        ) : (
          <span className="text-xs px-4 py-2 rounded-full border border-amber-500/40 text-amber-400 bg-amber-500/5">⚠ MARGINAL — Available backing &lt; 30% (below 130% specification)</span>
        )}
        <span className="text-xs px-4 py-2 rounded-full border border-amber-500/30 text-amber-400/80 bg-amber-500/5">Backing Ratio: {backingRatio.toFixed(0)}%</span>
      </div>

      {/* Note */}
      <p className="text-xs text-[#94a3b8] text-center mt-6 leading-loose">
        Evidence must not be reused across multiple backing claims. The 130% backing specification requires Available ≥ 30% of the baseline.
      </p>
    </div>
  );
}
