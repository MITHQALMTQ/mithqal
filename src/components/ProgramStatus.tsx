"use client";

export interface StatusMetric {
  label: string;
  value: string;
  status: "blocked" | "conditional" | "pass" | "unknown";
}

export interface StatusData {
  title: string;
  badge: string;
  badgeColor: "red" | "amber" | "green" | "slate";
  metrics: StatusMetric[];
  blockers?: string[];
  note?: string;
}

const badgeColors: Record<string, string> = {
  red: "border-red-500/40 text-red-400 bg-red-500/5",
  amber: "border-amber-500/40 text-amber-400 bg-amber-500/5",
  green: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5",
  slate: "border-slate-500/40 text-slate-400 bg-slate-500/5",
};

const metricColors: Record<string, string> = {
  blocked: "text-red-400",
  conditional: "text-amber-400",
  pass: "text-emerald-400",
  unknown: "text-slate-400",
};

export default function ProgramStatus({ data }: { data: StatusData }) {
  return (
    <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 border-t border-white/5 scroll-reveal">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-4">
          <span className="w-px h-4 bg-amber-400" />
          <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">{data.title}</span>
        </div>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${badgeColors[data.badgeColor]}`}>
          <span className="w-2 h-2 rounded-full bg-current" />
          <span className="text-sm font-semibold tracking-wide">{data.badge}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        {data.metrics.map((metric) => (
          <div key={metric.label} className="bg-white/5 border border-amber-500/10 rounded-2xl p-6 text-center stagger-card">
            <div className={`text-2xl font-bold mb-2 ${metricColors[metric.status]}`}>{metric.value}</div>
            <div className="text-xs text-[#94a3b8] tracking-wide uppercase">{metric.label}</div>
          </div>
        ))}
      </div>
      {data.blockers && data.blockers.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-8 mb-8">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-red-400 mb-4">Critical Blockers</div>
          <ul className="space-y-2">
            {data.blockers.map((blocker, i) => (
              <li key={i} className="text-sm text-[#cbd5e1] flex items-start gap-2">
                <span className="text-red-400 mt-0.5">⚠</span>
                <span>{blocker}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.note && (
        <div className="text-center text-sm text-[#94a3b8] max-w-2xl mx-auto leading-loose">{data.note}</div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <span className="text-xs px-3 py-1 rounded-full border border-red-500/30 text-red-400/80 bg-red-500/5">NOT PRODUCTION-AUTHORIZED</span>
        <span className="text-xs px-3 py-1 rounded-full border border-amber-500/30 text-amber-400/80 bg-amber-500/5">BUILD_MODE = FROZEN</span>
        <span className="text-xs px-3 py-1 rounded-full border border-amber-500/30 text-amber-400/80 bg-amber-500/5">MTQ DISABLED</span>
      </div>
    </section>
  );
}
