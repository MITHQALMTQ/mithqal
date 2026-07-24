import { cn } from "@/lib/utils";

/**
 * Mithqal brand mark — the official gold MTQ monogram on its dark background.
 * Replaces the procedural SVG Seal (which caused a hydration mismatch due to
 * floating-point coordinate drift between server and client renders).
 *
 * The logo PNG blends seamlessly into the always-on dark theme (bg-ink).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/mithqal-logo.png"
      alt="Mithqal"
      width={120}
      height={120}
      className={cn("rounded-full object-contain", className)}
      draggable={false}
    />
  );
}
