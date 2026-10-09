"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * SettlementFlowSimulator — Interactive 7-step settlement state machine.
 *
 * ALGORITHMIC DESIGN:
 * Users click through the 7 settlement phases and see:
 *   1. The state transition (animated)
 *   2. What evidence is generated at each step
 *   3. The finality status (pending → irrevocable)
 *   4. The reconciliation result
 *
 * This makes the abstract settlement architecture TANGIBLE —
 * users don't just read about the workflow, they EXPERIENCE it.
 *
 * The state machine uses a directed graph:
 *   Request → Validate → Authorize → Finality → Settle → Reconcile → Evidence
 * Each node has: name, description, evidence generated, finality status, color.
 */

interface SettlementStep {
  id: number;
  name: string;
  icon: string;
  description: string;
  evidence: string;
  finality: "pending" | "conditional" | "irrevocable";
  color: string;
}

const STEPS: SettlementStep[] = [
  { id: 0, name: "Request", icon: "📝", description: "Institutional participant submits a settlement request with participant identity, corridor, and amount.", evidence: "Request ID + Participant signature + Timestamp", finality: "pending", color: "#64748b" },
  { id: 1, name: "Validate", icon: "🔍", description: "MITHQAL validates participant eligibility, corridor authorization, and available backing.", evidence: "Eligibility proof + Encumbrance check + Backing availability", finality: "pending", color: "#3b82f6" },
  { id: 2, name: "Authorize", icon: "🛡", description: "Policy engine checks authorization matrix, risk controls, and jurisdictional compliance.", evidence: "Policy decision + Risk assessment + Authorization signature", finality: "conditional", color: "#8b5cf6" },
  { id: 3, name: "Finality", icon: "⚡", description: "Three-layer finality gate: technical + legal/institutional + control conditions all satisfied.", evidence: "Technical finality hash + Legal finality proof + Control gate pass", finality: "irrevocable", color: "#f59e0b" },
  { id: 4, name: "Settle", icon: "✅", description: "Settlement executed on the approved rail. Positions updated in all three books.", evidence: "Settlement receipt + Three-book entries + Rail confirmation", finality: "irrevocable", color: "#10b981" },
  { id: 5, name: "Reconcile", icon: "📊", description: "Automated reconciliation across Book A (MITHQAL), Book B (Bank), Book C (Participant).", evidence: "Reconciliation report + Three-book match proof + Discrepancy check", finality: "irrevocable", color: "#06b6d4" },
  { id: 6, name: "Evidence", icon: "🔐", description: "Immutable evidence layer: audit trail, attestation, and traceability sealed.", evidence: "Evidence hash + Attestation signature + Audit trail sealed", finality: "irrevocable", color: "#D4AF37" },
];

export default function SettlementFlowSimulator() {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = not started, 0-6 = active step, 7 = completed
  const [history, setHistory] = useState<number[]>([]);

  const handleStepClick = (stepId: number) => {
    if (stepId === currentStep + 1 || stepId === 0) {
      setCurrentStep(stepId);
      setHistory((prev) => [...prev, stepId]);
    }
  };

  const handleReset = () => {
    setCurrentStep(-1);
    setHistory([]);
  };

  const handleAutoRun = () => {
    setCurrentStep(-1);
    setHistory([]);
    STEPS.forEach((step, i) => {
      setTimeout(() => {
        setCurrentStep(step.id);
        setHistory((prev) => [...prev, step.id]);
      }, (i + 1) * 800);
    });
  };

  const activeStep = currentStep >= 0 && currentStep < STEPS.length ? STEPS[currentStep] : null;
  const isComplete = currentStep === STEPS.length - 1;

  return (
    <div className="bg-white/5 border border-amber-500/10 rounded-2xl p-8 stagger-card">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Settlement Flow Simulator</h3>
        <p className="text-sm text-[#94a3b8]">Click each step to walk through the settlement state machine</p>
      </div>

      {/* Step nodes */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {STEPS.map((step, i) => {
          const isDone = history.includes(step.id);
          const isActive = currentStep === step.id;
          const isNext = step.id === currentStep + 1 || (currentStep === -1 && step.id === 0);
          return (
            <div key={step.id} className="flex items-center">
              <motion.button
                onClick={() => isNext && handleStepClick(step.id)}
                disabled={!isNext}
                whileHover={isNext ? { scale: 1.1 } : {}}
                whileTap={isNext ? { scale: 0.95 } : {}}
                className={`relative w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl transition-all duration-300 ${
                  isActive
                    ? "border-amber-400 bg-amber-500/20 scale-110 shadow-lg shadow-amber-500/30"
                    : isDone
                      ? "border-emerald-500/60 bg-emerald-500/10"
                      : isNext
                        ? "border-amber-400/50 bg-amber-500/5 cursor-pointer hover:border-amber-400"
                        : "border-slate-600/40 bg-slate-700/20 cursor-not-allowed opacity-40"
                }`}
              >
                {isDone && !isActive ? "✓" : step.icon}
                {isNext && !isActive && (
                  <motion.div
                    className="absolute -inset-1 rounded-full border-2 border-amber-400/40"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.button>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 mx-1 transition-all duration-300 ${isDone ? "bg-emerald-500/60" : "bg-slate-600/40"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Active step details */}
      <AnimatePresence mode="wait">
        {activeStep && (
          <motion.div
            key={activeStep.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-black/30 backdrop-blur-md border border-amber-500/10 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{activeStep.icon}</span>
              <div>
                <div className="text-xs font-semibold text-amber-400 tracking-[0.1em]">STEP {activeStep.id + 1} / {STEPS.length}</div>
                <h4 className="text-lg font-semibold text-white">{activeStep.name}</h4>
              </div>
              <div className={`ml-auto px-3 py-1 rounded-full text-xs font-medium border ${
                activeStep.finality === "irrevocable"
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
                  : activeStep.finality === "conditional"
                    ? "border-amber-500/40 text-amber-400 bg-amber-500/5"
                    : "border-slate-500/40 text-slate-400 bg-slate-500/5"
              }`}>
                {activeStep.finality === "irrevocable" ? "🔒 IRREVOCABLE" : activeStep.finality === "conditional" ? "⏳ CONDITIONAL" : "⏸ PENDING"}
              </div>
            </div>
            <p className="text-sm text-[#cbd5e1] leading-loose mb-4">{activeStep.description}</p>
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-4">
              <div className="text-xs font-semibold text-amber-400 tracking-[0.18em] uppercase mb-2">Evidence Generated</div>
              <p className="text-sm text-[#cbd5e1] font-mono">{activeStep.evidence}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion state */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center mb-6"
        >
          <div className="text-4xl mb-2">🎉</div>
          <h4 className="text-lg font-semibold text-emerald-400 mb-2">Settlement Complete</h4>
          <p className="text-sm text-[#cbd5e1]">All 7 phases executed. Finality is irrevocable. Evidence is sealed and auditable.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <span className="text-xs px-3 py-1 rounded-full border border-emerald-500/30 text-emerald-400/80 bg-emerald-500/5">FINALITY: IRREVOCABLE</span>
            <span className="text-xs px-3 py-1 rounded-full border border-amber-500/30 text-amber-400/80 bg-amber-500/5">EVIDENCE: SEALED</span>
            <span className="text-xs px-3 py-1 rounded-full border border-amber-500/30 text-amber-400/80 bg-amber-500/5">RECONCILIATION: MATCHED</span>
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleAutoRun}
          disabled={currentStep !== -1 && !isComplete}
          className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 btn-press disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ▶ Auto-Run Simulation
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 rounded-full border-2 border-amber-400/50 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/10 transition-all duration-300 btn-press"
        >
          ↺ Reset
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-6 h-1 bg-slate-700/40 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-200"
          animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}
