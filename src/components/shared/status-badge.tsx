import { Badge } from "@/components/ui/badge";
export function StatusBadge({ status }: { status: string }) {
  const c = status === "VERIFIED" || status === "PASS" || status === "CLOSED" ? "text-emerald-400 border-emerald-500/40" : status === "NOT AUTHORIZED" || status === "FAIL" ? "text-red-400 border-red-500/40" : "text-amber-400 border-amber-500/40";
  return <Badge variant="outline" className={`font-mono text-xs ${c}`}>{status}</Badge>;
}
