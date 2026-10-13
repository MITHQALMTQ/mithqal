const CAPABILITIES = [
  { num: "01", title: "Settlement Orchestration", desc: "Coordinate settlement workflows across controlled institutional rails.", icon: "layers" },
  { num: "02", title: "Policy & Risk Controls", desc: "Apply deterministic policy, eligibility and risk controls to workflows.", icon: "shield" },
  { num: "03", title: "Reconciliation & Evidence", desc: "Maintain reconciliation, traceability and audit-ready evidence.", icon: "document" },
  { num: "04", title: "Multi-Rail Interoperability", desc: "Coordinate workflows across distinct financial and settlement rails.", icon: "nodes" },
  { num: "05", title: "Continuity & Replay", desc: "Support controlled recovery, failure handling, replay and operational continuity.", icon: "cycle" },
] as const;

const ICONS: Record<string, React.ReactElement> = {
  layers: (<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>),
  shield: (<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/></svg>),
  document: (<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>),
  nodes: (<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M7 17l3-4M17 17l-3-4"/></svg>),
  cycle: (<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>),
};

export function CapabilityRail() {
  return (
    <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-5" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.10) 100%)' }}>
      {CAPABILITIES.map((cap, i) => (
        <article key={cap.num} className={`grid grid-cols-[47px_1fr] gap-[17px] border-r border-white/22 p-[2px_32px_0] last:border-r-0 first:pl-0 last:pr-0 ${i === 4 ? 'max-sm:border-b-0' : 'max-sm:border-b'}`}>
          <div className="flex h-[42px] w-[42px] items-center justify-center text-[#E7BA78]">{ICONS[cap.icon]}</div>
          <div>
            <h2 className="mb-[7px] text-[16px] font-medium leading-[1.1] tracking-[-0.01em] text-white">{cap.title}</h2>
            <p className="max-w-[180px] text-[12.5px] leading-[1.55] text-white/76">{cap.desc}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
