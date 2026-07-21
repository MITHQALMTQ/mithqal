"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Users,
  Crown,
  Building2,
  Handshake,
  Wrench,
  Inbox,
  Download,
  RefreshCw,
  ExternalLink,
  Loader2,
  ShieldCheck,
  LogOut,
  Lock,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";

type Role = "investor" | "advisor" | "anchor" | "council-nominee" | "partner" | "other";

interface Row {
  id: string;
  fullName: string;
  email: string;
  org: string;
  role: Role;
  message: string;
  createdAt: string;
}

interface Payload {
  total: number;
  byRole: Record<string, number>;
  filtered: number;
  rows: Row[];
  error?: string;
}

const ROLE_META: Record<Role, { label: string; icon: typeof Users; tone: string }> = {
  investor: { label: "Investor", icon: Crown, tone: "border-gold/40 bg-gold/10 text-gold" },
  advisor: { label: "Advisor", icon: ShieldCheck, tone: "border-reserve/40 bg-reserve/10 text-reserve" },
  anchor: { label: "Anchor", icon: Building2, tone: "border-gold/40 bg-gold/10 text-gold" },
  "council-nominee": { label: "Council nominee", icon: Crown, tone: "border-reserve/40 bg-reserve/10 text-reserve" },
  partner: { label: "Partner", icon: Handshake, tone: "border-line bg-ink-card text-foreground" },
  other: { label: "Other", icon: Wrench, tone: "border-line bg-ink-card text-fg-muted" },
};

const ALL_ROLES: (Role | "all")[] = [
  "all",
  "investor",
  "advisor",
  "anchor",
  "council-nominee",
  "partner",
  "other",
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return Math.max(1, Math.round(diff / 1000)) + "s ago";
  if (diff < 3_600_000) return Math.round(diff / 60_000) + "m ago";
  if (diff < 86_400_000) return Math.round(diff / 3_600_000) + "h ago";
  return Math.round(diff / 86_400_000) + "d ago";
}

function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export default function AdminConsole() {
  const { data: session, status } = useSession();
  const [loggingIn, setLoggingIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (status === "loading") {
    return (
      <div className="grain-bg flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!session) {
    return (
      <LoginCard
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loggingIn={loggingIn}
        onSubmit={async () => {
          setLoggingIn(true);
          const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          setLoggingIn(false);
          if (res?.error) {
            // toast via a fresh hook instance is awkward here; the login card
            // shows its own error state. We could wire useToast but keep it simple.
          }
        }}
      />
    );
  }

  return <Console email={session.user?.email ?? "operator"} />;
}

/* ------------------------------------------------------------------ */
/*  Login card                                                         */
/* ------------------------------------------------------------------ */

function LoginCard({
  email,
  setEmail,
  password,
  setPassword,
  loggingIn,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loggingIn: boolean;
  onSubmit: () => void;
}) {
  const { toast } = useToast();
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoggingIn(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error || !res?.ok) {
        setError("Invalid credentials. Check the operator email and password.");
        toast({ title: "Sign-in failed", description: "Invalid credentials.", variant: "destructive" });
      } else {
        toast({ title: "Signed in", description: "Welcome back, Operator." });
        // NextAuth v4 signIn({redirect:false}) does not auto-refresh the
        // useSession hook. A full reload re-initialises the SessionProvider
        // against the newly-set session cookie.
        setTimeout(() => window.location.reload(), 600);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      toast({ title: "Sign-in error", description: String(err), variant: "destructive" });
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="grain-bg flex min-h-screen items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-line bg-ink-soft p-7 sm:p-9">
          <div className="flex flex-col items-center text-center">
            <Logo className="h-16 w-16" />
            <h1 className="font-display mt-5 text-2xl text-foreground sm:text-3xl">
              Operator sign-in
            </h1>
            <p className="mt-2 text-sm text-fg-muted">
              The Formation Committee pipeline is private. Authenticate to continue.
            </p>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                Email
              </span>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coo@mithqal.io"
                  autoComplete="email"
                  className="w-full rounded-md border border-line bg-ink py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                Password
              </span>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-md border border-line bg-ink py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </label>

            {error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-gold text-ink hover:bg-gold-soft disabled:opacity-50"
            >
              {loggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Sign in
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-fg-muted">
            Operator access is env-defined. The public Formation Committee intake
            remains open at the Institution view — submissions captured there
            appear here after sign-in.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Authenticated console                                              */
/* ------------------------------------------------------------------ */

function Console({ email }: { email: string }) {
  const { toast } = useToast();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Role | "all">("all");

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/admin/interests" : `/api/admin/interests?role=${filter}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 401) {
        // session expired
        signOut({ redirect: false });
        throw new Error("Session expired. Please sign in again.");
      }
      const json = (await res.json()) as Payload;
      if (!res.ok) throw new Error(json.error || "load failed");
      setData(json);
    } catch (e) {
      toast({
        title: "Could not load submissions",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const exportCsv = () => {
    if (!data?.rows.length) return;
    const header = ["Name", "Email", "Organisation", "Role", "Submitted (ISO)", "Message"];
    const lines = data.rows.map((r) =>
      [r.fullName, r.email, r.org, ROLE_META[r.role].label, r.createdAt, r.message]
        .map(csvEscape)
        .join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mithqal-formation-committee-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${data.rows.length} submissions → CSV.` });
  };

  const byRole = data?.byRole ?? {};
  const total = data?.total ?? 0;
  const filtered = data?.filtered ?? 0;
  const rows = data?.rows ?? [];

  const stats = useMemo(() => {
    const investors = byRole.investor ?? 0;
    const advisors = byRole.advisor ?? 0;
    const anchors = byRole.anchor ?? 0;
    const nominees = byRole["council-nominee"] ?? 0;
    return [
      { label: "Total submissions", value: total, icon: Inbox, tone: "text-foreground" },
      { label: "Investors", value: investors, icon: Crown, tone: "text-gold" },
      { label: "Advisors", value: advisors, icon: ShieldCheck, tone: "text-reserve" },
      { label: "Anchor participants", value: anchors, icon: Building2, tone: "text-gold" },
      { label: "Council nominees", value: nominees, icon: Users, tone: "text-reserve" },
    ];
  }, [byRole, total]);

  return (
    <div className="grain-bg min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-line/60 px-5 py-10 sm:px-8 sm:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--gold)_10%,transparent),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="flex items-center gap-2">
              <Badge className="border-gold/40 bg-gold/10 text-gold hover:bg-gold/10">
                Operator console
              </Badge>
              <Badge className="border-reserve/40 bg-reserve/10 text-reserve hover:bg-reserve/10">
                <ShieldCheck className="mr-1 h-3 w-3" /> Authenticated
              </Badge>
            </div>
            <h1 className="font-display mt-4 text-3xl leading-tight sm:text-5xl">
              Formation Committee <span className="gold-text">pipeline</span>
            </h1>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm text-fg-muted sm:text-base">
                Every submission to the Formation Committee intake — investors, advisors, anchor
                participants and Council nominees. Filter, review and export. This is your
                private operator view; never linked from the public site.
              </p>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-fg-muted">{email}</span>
                <button
                  onClick={() => signOut({ redirect: false })}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-ink-card px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[92px] rounded-xl" />
              ))
            : stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-xl border border-line bg-ink-soft p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                        {s.label}
                      </span>
                      <Icon className={`h-4 w-4 ${s.tone}`} />
                    </div>
                    <div className={`font-display mt-2 text-3xl ${s.tone}`}>{s.value}</div>
                  </div>
                );
              })}
        </div>

        {/* Toolbar */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {ALL_ROLES.map((r) => {
              const active = filter === r;
              const label = r === "all" ? "All" : ROLE_META[r].label;
              const count = r === "all" ? total : byRole[r] ?? 0;
              return (
                <button
                  key={r}
                  onClick={() => setFilter(r)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-gold/50 bg-gold/15 text-gold"
                      : "border-line bg-ink-card text-fg-muted hover:text-foreground"
                  }`}
                >
                  {label}
                  <span className="rounded-full bg-ink px-1.5 py-0.5 text-[10px] text-fg-muted">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchList}
              className="border-line bg-ink-card text-foreground hover:text-gold"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button
              onClick={exportCsv}
              disabled={!rows.length}
              className="bg-gold text-ink hover:bg-gold-soft disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-line">
          <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="sticky top-0 z-10 bg-ink-card text-left text-[10px] uppercase tracking-wider text-fg-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Organisation</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-4">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <Inbox className="mx-auto h-8 w-8 text-fg-muted" />
                      <p className="mt-3 text-sm text-fg-muted">
                        No submissions yet for this filter.
                      </p>
                      <p className="mt-1 text-xs text-fg-muted">
                        The pipeline fills as the Formation Committee intake is exercised.
                      </p>
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const meta = ROLE_META[r.role];
                    const Icon = meta.icon;
                    return (
                      <tr key={r.id} className="hover:bg-ink-card/50">
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-fg-muted">
                          <div>{timeAgo(r.createdAt)}</div>
                          <div className="text-[10px] opacity-70">{fmtDate(r.createdAt)}</div>
                        </td>
                        <td className="px-4 py-4 font-medium text-foreground">{r.fullName}</td>
                        <td className="px-4 py-4 text-fg-muted">
                          {r.org || <span className="text-fg-muted/50">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={`${meta.tone} hover:opacity-90`}>
                            <Icon className="mr-1 h-3 w-3" /> {meta.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <a
                            href={`mailto:${r.email}`}
                            className="text-gold hover:underline"
                          >
                            {r.email}
                          </a>
                        </td>
                        <td className="max-w-[320px] px-4 py-4 text-xs text-fg-muted">
                          {r.message ? (
                            <span className="line-clamp-3">{r.message}</span>
                          ) : (
                            <span className="text-fg-muted/50">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Separator className="my-8 bg-line" />
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-ink-soft/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <span>
              Showing <span className="text-foreground">{filtered}</span> of{" "}
              <span className="text-foreground">{total}</span> submissions
              {filter !== "all" ? ` · filtered to ${ROLE_META[filter].label}` : null}.
            </span>
          </div>
          <a
            href="https://x.com/MithqalMTQ"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-fg-muted transition hover:text-gold"
          >
            <ExternalLink className="h-3.5 w-3.5" /> @MithqalMTQ
          </a>
        </div>
      </div>
    </div>
  );
}
