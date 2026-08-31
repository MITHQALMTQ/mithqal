"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/messages";

/**
 * LanguageSwitcher — compact dropdown that exposes the available locales.
 *
 * Renders a globe icon + the current locale's flag code (e.g. "EN") and a
 * small chevron. On click, expands a list of locale buttons; selecting one
 * dispatches `setLocale` via the LanguageProvider context. Closes on outside
 * click or Escape.
 */
export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change language (current: ${LOCALE_META[locale].label})`}
        title="Change language"
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium text-fg-muted transition hover:bg-ink-card/60 hover:text-foreground"
      >
        <Globe className="h-3 w-3" />
        <span className="hidden sm:inline">{LOCALE_META[locale].flag}</span>
        <ChevronDown className={`h-2.5 w-2.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-lg border border-line bg-ink/95 py-1 backdrop-blur-xl"
        >
          {LOCALES.map((l: Locale) => {
            const meta = LOCALE_META[l];
            const active = l === locale;
            return (
              <li key={l} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(l);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition ${
                    active ? "bg-gold/12 text-gold" : "text-fg-muted hover:bg-ink-card hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[10px] opacity-70">{meta.flag}</span>
                    <span>{meta.label}</span>
                  </span>
                  {active ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
