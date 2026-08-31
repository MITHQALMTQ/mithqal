"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { LOCALE_META, LOCALES, translate, type Locale } from "@/lib/i18n/messages";

/**
 * LanguageProvider — client-side React context that:
 *   - Reads the user's preferred locale from localStorage via useSyncExternalStore
 *     (so SSR renders "en" and the client hydrates to the stored value without
 *     calling setState inside an effect).
 *   - Exposes `locale`, `setLocale`, and a `t(key)` translation helper
 *   - Reflects the locale on <html lang> + <html dir> so RTL languages
 *     (Arabic) render correctly without requiring a Next.js middleware.
 *
 * This is the minimal infrastructure for the audit-recommended multi-language
 * support. A full next-intl wiring (with i18n routing + RSC translations) is
 * tracked as a follow-up task; this provider lets the language switcher work
 * immediately and translates the main nav items + action buttons.
 */

const STORAGE_KEY = "mithqal.locale";
const CHANGE_EVENT = "mithqal:locale-change";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): Locale {
  const v = window.localStorage.getItem(STORAGE_KEY);
  return LOCALES.includes(v as Locale) ? (v as Locale) : "en";
}

function getServerSnapshot(): Locale {
  return "en";
}

function writeLocale(l: Locale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, l);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = useCallback((l: Locale) => {
    writeLocale(l);
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  // Reflect the locale on <html lang> + <html dir> for RTL languages.
  // This is a DOM side-effect (not a setState call), so it's safe inside an
  // effect — it doesn't trigger cascading renders.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = LOCALE_META[locale].dir;
  }, [locale]);

  const value = useMemo<LanguageContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Outside of provider — return a no-op default so components render
    // with English strings even if the provider is missing (e.g. tests).
    return {
      locale: "en",
      setLocale: () => {},
      t: (key: string) => translate("en", key),
    };
  }
  return ctx;
}
