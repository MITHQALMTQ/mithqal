/**
 * Lightweight i18n message catalog for the Mithqal UI.
 *
 * The full v19.0 Constitution + auditing narrative is intentionally NOT
 * translated (only the public-facing navigation + key action labels are).
 * A full next-intl wiring (middleware + routing + RSC integration) is
 * tracked as a follow-up; this catalog lets the language switcher work
 * immediately and lets copy editors translate strings incrementally.
 *
 * Locales:
 *   en — English (default)
 *   ar — Arabic (RTL — Sharia audience, MENA trade corridor)
 *   fr — French (African trade corridor, West-Africa francophone audience)
 */

export type Locale = "en" | "ar" | "fr";

export const LOCALES: Locale[] = ["en", "ar", "fr"];

export const LOCALE_META: Record<Locale, { label: string; flag: string; dir: "ltr" | "rtl" }> = {
  en: { label: "English", flag: "EN", dir: "ltr" },
  ar: { label: "العربية", flag: "AR", dir: "rtl" },
  fr: { label: "Français", flag: "FR", dir: "ltr" },
};

/**
 * Translation dictionary. Keys are namespaced by feature (`nav.*`, `action.*`).
 * Missing keys fall back to the English string.
 */
type Messages = Record<string, string>;

const en: Messages = {
  "nav.institution": "Institution",
  "nav.transparency": "Transparency",
  "nav.engine": "Engine",
  "nav.infrastructure": "Infrastructure",
  "nav.constitution": "Constitution",
  "nav.testnet": "Testnet",
  "nav.os": "OS",
  "nav.audit": "Audit",
  "nav.deck": "Deck",
  "nav.playbook": "Playbook",
  "nav.admin": "Admin",
  "action.connectWallet": "Connect MetaMask",
  "action.mint": "Mint MTQ",
  "action.redeem": "Redeem MTQ",
  "action.transfer": "Transfer MTQ",
};

const ar: Messages = {
  "nav.institution": "المؤسسة",
  "nav.transparency": "الشفافية",
  "nav.engine": "المحرك",
  "nav.infrastructure": "البنية التحتية",
  "nav.constitution": "الدستور",
  "nav.testnet": "الشبكة التجريبية",
  "nav.os": "نظام التشغيل",
  "nav.audit": "التدقيق",
  "nav.deck": "العرض",
  "nav.playbook": "الكتيب",
  "nav.admin": "الإدارة",
  "action.connectWallet": "اتصال MetaMask",
  "action.mint": "سك MTQ",
  "action.redeem": "استرداد MTQ",
  "action.transfer": "تحويل MTQ",
};

const fr: Messages = {
  "nav.institution": "Institution",
  "nav.transparency": "Transparence",
  "nav.engine": "Moteur",
  "nav.infrastructure": "Infrastructure",
  "nav.constitution": "Constitution",
  "nav.testnet": "Testnet",
  "nav.os": "OS",
  "nav.audit": "Audit",
  "nav.deck": "Présentation",
  "nav.playbook": "Playbook",
  "nav.admin": "Admin",
  "action.connectWallet": "Connecter MetaMask",
  "action.mint": "Mint MTQ",
  "action.redeem": "Racheter MTQ",
  "action.transfer": "Transférer MTQ",
};

export const MESSAGES: Record<Locale, Messages> = { en, ar, fr };

/**
 * Translate a key in the given locale. Falls back to the English string
 * when the key is missing from the requested locale.
 */
export function translate(locale: Locale, key: string): string {
  return MESSAGES[locale]?.[key] ?? MESSAGES.en[key] ?? key;
}
