"use client";

/**
 * Reusable "Download as PDF" button.
 *
 * Triggers `window.print()` after marking the document body with a
 * `data-pdf-target` attribute carrying the desired filename. Print-only
 * CSS (added to globals.css) hides `.no-print` chrome, forces a white
 * background + black text, and uses the filename via CSS for the print
 * job title (browsers honor the document title for the default save-as
 * filename, so we set `document.title` temporarily for the duration of
 * the print job).
 *
 * Usage:
 *   <PdfDownload label="Download Deck as PDF" filename="mithqal-deck.pdf" />
 *
 * Props:
 *   - label:    button label (string, required)
 *   - filename: default save-as filename (string, required)
 *   - size?:    "sm" | "md" (default "sm") — button height
 *   - className?: optional className passthrough
 */

import { useCallback } from "react";
import { Download, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PdfDownloadProps {
  label: string;
  filename: string;
  size?: "sm" | "md";
  className?: string;
  /** Optional icon override (defaults to <Download />) */
  Icon?: typeof Download;
  /** Variant — "outline" (default) or "solid" */
  variant?: "outline" | "solid";
}

export function PdfDownload({
  label,
  filename,
  size = "sm",
  className,
  Icon = Download,
  variant = "outline",
}: PdfDownloadProps) {
  const handlePrint = useCallback(() => {
    if (typeof window === "undefined") return;

    // Tag the document with the desired filename so any print-CSS hooks
    // (or future client-side print-to-PDF libraries) can pick it up.
    document.body.dataset.pdfTarget = filename;

    // Browsers use `document.title` as the default save-as filename when
    // printing to PDF. Temporarily swap it for the duration of the print
    // job, then restore on `afterprint`.
    const prevTitle = document.title;
    document.title = filename.replace(/\.pdf$/i, "");

    const cleanup = () => {
      document.title = prevTitle;
      delete document.body.dataset.pdfTarget;
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    // Defer the print call by one tick so the title swap + dataset
    // attribute have time to apply before the print dialog renders.
    window.setTimeout(() => window.print(), 0);
  }, [filename]);

  const sizeCls =
    size === "md"
      ? "h-10 px-4 text-[13px]"
      : "h-9 px-3 text-[12px]";

  const variantCls =
    variant === "solid"
      ? "border border-gold/50 bg-gold font-semibold text-ink hover:bg-gold-soft"
      : "border border-line/70 bg-ink-card text-foreground hover:border-gold/50 hover:text-gold";

  return (
    <button
      type="button"
      onClick={handlePrint}
      aria-label={`${label} (opens browser print dialog — save as ${filename})`}
      title={`${label} · save as ${filename}`}
      className={cn(
        "no-print inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm font-medium transition-colors",
        sizeCls,
        variantCls,
        className,
      )}
    >
      {variant === "solid" ? (
        <Printer className="h-4 w-4" aria-hidden />
      ) : (
        <Icon className="h-3.5 w-3.5" aria-hidden />
      )}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden" aria-hidden>
        PDF
      </span>
    </button>
  );
}

export default PdfDownload;
