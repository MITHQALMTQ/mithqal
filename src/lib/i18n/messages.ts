/**
 * Comprehensive i18n message catalog for the Mithqal UI.
 *
 * Covers all public-facing strings: navigation, actions, institution
 * section headings, legal section, formation intake, status board,
 * testnet, transparency, and common UI labels.
 *
 * Locales:
 *   en — English (default)
 *   ar — Arabic (RTL — Sharia audience, MENA trade corridor)
 *   fr — French (African trade corridor, West-Africa francophone audience)
 *   de — German (DACH institutional audience)
 *   es — Spanish (LATAM + Iberian institutional audience)
 *   zh — Chinese (Greater China institutional audience)
 *
 * Translation standards:
 *   - Professional institutional tone (not colloquial)
 *   - Economic/tokenomics terminology uses the accepted academic/professional
 *     equivalent in each language (e.g. "reserve ratio" → "مع ratio الاحتياطي"
 *     is wrong; "نسبة الاحتياطي" is correct)
 *   - Proper nouns (Mithqal, MTQ, JOZOUR, Monad) are NOT translated
 *   - Acronyms (NAV, LCR, CRI, SDP, MTQ) are kept in Latin script even in
 *     Arabic / Chinese (standard practice in financial literature)
 */

export type Locale = "en" | "ar" | "fr" | "de" | "es" | "zh";

export const LOCALES: Locale[] = ["en", "ar", "fr", "de", "es", "zh"];

export const LOCALE_META: Record<Locale, { label: string; flag: string; dir: "ltr" | "rtl" }> = {
  en: { label: "English", flag: "EN", dir: "ltr" },
  ar: { label: "العربية", flag: "AR", dir: "rtl" },
  fr: { label: "Français", flag: "FR", dir: "ltr" },
  de: { label: "Deutsch", flag: "DE", dir: "ltr" },
  es: { label: "Español", flag: "ES", dir: "ltr" },
  zh: { label: "中文", flag: "ZH", dir: "ltr" },
};

type Messages = Record<string, string>;

const en: Messages = {
  // ---- Navigation ----
  "nav.institution": "Institution",
  "nav.transparency": "Transparency",
  "nav.engine": "Engine",
  "nav.infrastructure": "Infrastructure",
  "nav.constitution": "Constitution",
  "nav.testnet": "Testnet",
  "nav.os": "OS",
  "nav.audit": "Audit",
  "nav.deck": "Deck",
  "nav.faq": "FAQ",
  "nav.playbook": "Playbook",
  "nav.admin": "Admin",

  // ---- Actions ----
  "action.connectWallet": "Connect Wallet",
  "action.mint": "Mint MTQ",
  "action.redeem": "Redeem MTQ",
  "action.transfer": "Transfer MTQ",
  "action.expressInterest": "Express Interest",
  "action.whatIsMithqal": "What is Mithqal",
  "action.reservesBreakdown": "Reserves Breakdown",
  "action.viewOnMonadScan": "View on MonadScan",
  "action.submit": "Submit",
  "action.tryAgain": "Try Again",
  "action.reloadPage": "Reload Page",
  "action.returnHome": "Return to the Institution",

  // ---- Institution hero ----
  "hero.eyebrow": "Constitutional Settlement Institution · Est. under the v19.0.3 Constitution",
  "hero.title": "Mithqal",
  "hero.subtitle": "A constitutional settlement institution.",
  "hero.description": "Mithqal is a neutral, fully-reserved settlement infrastructure for international trade. It is not a token, a platform, a bank, or a DeFi protocol. It is a monetary institution — governed by an immutable Constitution designed to endure beyond any single technology or market cycle.",
  "hero.liveMonetaryState": "Live monetary state",
  "hero.liveAutoRefresh": "LIVE · AUTO-REFRESH 30S",
  "hero.updated": "updated",
  "hero.now": "now",
  "hero.totalSupply": "Total Supply",
  "hero.mintBurn": "Mint − Burn · ERC-20 MTQ",
  "hero.navMarket": "NAV (Market)",
  "hero.navCaption": "Mark-to-market NAV per MTQ",
  "hero.reserveRatio": "Reserve Ratio",
  "hero.ratioAboveFloor": "Above 100% floor",
  "hero.ratioBelowFloor": "BELOW FLOOR — paused",
  "hero.goldPrice": "Gold Price",
  "hero.goldCaption": "Live spot · XAU/USD",
  "hero.source": "Source",
  "hero.onChainReserves": "on-chain reserves + live oracle prices",

  // ---- The Institution section ----
  "institution.eyebrow": "The Institution",
  "institution.heading": "A monetary authority, not a platform",
  "institution.body": "The Institution is not a software project, a blockchain application, or a product. It is a constitutional entity whose sole function is to issue and redeem a fully-reserved settlement unit. If the underlying technology is replaced, the Institution persists — because it is an institution, not a technology.",
  "institution.is.title": "Mithqal is",
  "institution.is.1": "A constitutional monetary institution",
  "institution.is.2": "A fully-reserved settlement unit (MTQ)",
  "institution.is.3": "Complementary to sovereign currencies & CBDCs",
  "institution.is.4": "Infrastructure for banks and trade-finance platforms",
  "institution.isnot.title": "Mithqal is not",
  "institution.isnot.1": "Not a bank, exchange, or payment processor",
  "institution.isnot.2": "Not a speculative asset or DeFi protocol",
  "institution.isnot.3": "Not dependent on any specific blockchain",
  "institution.isnot.4": "Not a replacement for sovereign currencies",

  // ---- Objectives section ----
  "objectives.eyebrow": "Article I — Constitutional Objectives",
  "objectives.heading": "Six objectives the Institution is bound to pursue",

  // ---- Invariants section ----
  "invariants.eyebrow": "Priority 1 — Constitutional Invariants",
  "invariants.heading": "Five rules that can never be broken",

  // ---- Anti-platform section ----
  "antiplatform.eyebrow": "Article V — Anti-Platform",
  "antiplatform.heading": "Constitutionally non-platform.",

  // ---- Reserves section ----
  "reserves.eyebrow": "Reserves & Transparency",
  "reserves.heading": "100%+ reserves, verifiable on-chain",

  // ---- Monetary engine section ----
  "engine.eyebrow": "Article VI — The Monetary Engine",
  "engine.heading": "Eight currencies, one anchor: gold",
  "engine.explore": "Explore the full interactive engine",

  // ---- Governance section ----
  "governance.eyebrow": "Governance",
  "governance.heading": "Governed by Council, not by capital",

  // ---- Lifecycle section ----
  "lifecycle.eyebrow": "Article XIV — Institutional Lifecycle",
  "lifecycle.heading": "From formation to perpetuity",

  // ---- Eligibility section ----
  "eligibility.eyebrow": "Who Mithqal serves",
  "eligibility.heading": "Institutional participants, not speculators",

  // ---- Status board section ----
  "status.eyebrow": "Build in public",
  "status.heading": "Current status — Phase 0: Formation",
  "status.done": "Complete",
  "status.inProgress": "In Progress",
  "status.scheduled": "Scheduled",
  "status.planned": "Planned",
  "status.pending": "Pending",

  // ---- Layer 0 section ----
  "layer0.eyebrow": "Layer 0 — The Institutional Foundation",
  "layer0.heading": "The philosophical bedrock",

  // ---- Legal status section ----
  "legal.eyebrow": "Legal & Regulatory Status",
  "legal.heading": "Two-Entity Architecture",
  "legal.description": "Per Constitution Article VIII (Yield Separation), the Mithqal ecosystem comprises two legally separate entities. The settlement function (non-profit) and the yield function (for-profit) are absolutely separate — no assets, liabilities, or risks cross between them.",
  "legal.entityA.name": "Entity A — The Mithqal Institution",
  "legal.entityA.type": "Non-profit constitutional settlement institution",
  "legal.entityA.currentOperator": "Current operator",
  "legal.entityA.targetStructure": "Target structure",
  "legal.entityB.name": "Entity B — Mithqal Yield Vehicle",
  "legal.entityB.type": "For-profit regulated investment fund",
  "legal.entityB.status": "Status",
  "legal.entityB.mtqExposure": "MTQ exposure",
  "legal.articleVIII": "Article VIII — Yield Separation",
  "legal.constitutionalVersion": "Constitutional Version",
  "legal.constitutionalStatus": "Status",

  // ---- Formation committee intake ----
  "intake.eyebrow": "Formation Committee",
  "intake.heading": "Express interest in joining the Formation Committee",
  "intake.name": "Your name",
  "intake.email": "Email address",
  "intake.org": "Organisation (optional)",
  "intake.role": "Role",
  "intake.rolePlaceholder": "Select a role…",
  "intake.message": "Tell us how you'd like to engage with the Institution.",
  "intake.submit": "Submit Expression of Interest",
  "intake.submitting": "Submitting…",
  "intake.missingDetails": "Missing details",
  "intake.missingDetailsDesc": "Please add your name, email and select a role.",
  "intake.recorded": "Interest recorded",
  "intake.recordedDesc": "Thank you. The Formation Committee will be in touch. Check your email.",
  "intake.couldNotSubmit": "Could not submit",
  "intake.tryAgain": "Please try again shortly.",
  "intake.role.investor": "Investor (pre-seed / seed)",
  "intake.role.advisor": "Advisor (ex-central-bank, custody, trade-finance, compliance)",
  "intake.role.anchor": "Anchor participant (bank / trade-finance platform)",
  "intake.role.council": "Council nominee",
  "intake.role.partner": "Integration / technology partner",
  "intake.role.other": "Other",

  // ---- Testnet ----
  "testnet.badge": "TESTNET SIMULATOR",
  "testnet.simulatorRef": "Simulator reference",
  "testnet.notTxHash": "This is a simulator reference, not an on-chain transaction hash.",

  // ---- Transparency ----
  "transparency.badge": "Simulator · build in public",
  "transparency.autoRefresh": "Auto-refresh 30s",

  // ---- Common UI ----
  "common.loading": "Loading…",
  "common.error": "Something went wrong",
  "common.tryAgain": "Try again",
  "common.backToMithqal": "Back to Mithqal",
  "common.skipToContent": "Skip to main content",
  "common.openInNewTab": "opens in a new tab",
  "common.referenceDetails": "Reference details",
  "common.referenceId": "Reference ID",
  "common.quoteReference": "Quote this reference when contacting the operator.",
  "common.noReferenceId": "No reference ID available.",
};

const ar: Messages = {
  // ---- التنقل ----
  "nav.institution": "المؤسسة",
  "nav.transparency": "الشفافية",
  "nav.engine": "المحرك",
  "nav.infrastructure": "البنية التحتية",
  "nav.constitution": "الدستور",
  "nav.testnet": "الشبكة التجريبية",
  "nav.os": "نظام التشغيل",
  "nav.audit": "التدقيق",
  "nav.deck": "العرض التقديمي",
  "nav.faq": "الأسئلة الشائعة",
  "nav.playbook": "الكتيب الاستراتيجي",
  "nav.admin": "الإدارة",

  // ---- الإجراءات ----
  "action.connectWallet": "ربط المحفظة",
  "action.mint": "سك MTQ",
  "action.redeem": "استرداد MTQ",
  "action.transfer": "تحويل MTQ",
  "action.expressInterest": "تقديم طلب اهتمام",
  "action.whatIsMithqal": "ما هو ميثقال",
  "action.reservesBreakdown": "تفاصيل الاحتياطيات",
  "action.viewOnMonadScan": "عرض على MonadScan",
  "action.submit": "إرسال",
  "action.tryAgain": "إعادة المحاولة",
  "action.reloadPage": "إعادة تحميل الصفحة",
  "action.returnHome": "العودة إلى المؤسسة",

  // ---- الواجهة الرئيسية ----
  "hero.eyebrow": "مؤسسة نقدية دستورية · تأسست بموجب دستور النسخة v19.0.3",
  "hero.title": "ميثقال",
  "hero.subtitle": "مؤسسة تسوية نقدية دستورية.",
  "hero.description": "ميثقال بنية تحتية محايدة للتسوية بالكامل احتياطيًا للتجارة الدولية. ليست رمزًا، ولا منصة، ولا بنكًا، ولا بروتوكولًا للتمويل اللامركزي. بل هي مؤسسة نقدية تحكمها دستورية غير قابلة للتعديل مصممة لتدوم إلى ما يتجاوز أي تقنية أو دورة سوقية محددة.",
  "hero.liveMonetaryState": "الحالة النقدية المباشرة",
  "hero.liveAutoRefresh": "مباشر · تحديث كل 30 ثانية",
  "hero.updated": "آخر تحديث",
  "hero.now": "الآن",
  "hero.totalSupply": "إجمالي العرض",
  "hero.mintBurn": "سك − استرداد · ERC-20 MTQ",
  "hero.navMarket": "صافي قيمة الأصل (السوق)",
  "hero.navCaption": "صافي قيمة الأصل لكل MTQ وفق السوق",
  "hero.reserveRatio": "نسبة الاحتياطي",
  "hero.ratioAboveFloor": "فوق الحد الأدنى 100%",
  "hero.ratioBelowFloor": "أقل من الحد الأدنى — متوقف",
  "hero.goldPrice": "سعر الذهب",
  "hero.goldCaption": "السعر المباشر · XAU/USD",
  "hero.source": "المصدر",
  "hero.onChainReserves": "احتياطيات على السلسلة + أسعار تنبؤية مباشرة",

  // ---- قسم المؤسسة ----
  "institution.eyebrow": "المؤسسة",
  "institution.heading": "سلطة نقدية، لا منصة",
  "institution.body": "المؤسسة ليست مشروعًا برمجيًا، ولا تطبيق بلوكتشين، ولا منتجًا. بل هي كيان دستوري وظيفته الوحيدة إصدار واسترداد وحدة تسوية مغطاة بالكامل بالاحتياطيات. إذا استُبدلت التقنية الأساسية، تبقى المؤسسة قائمة — لأنها مؤسسة، لا تقنية.",
  "institution.is.title": "ميثقال هي",
  "institution.is.1": "مؤسسة نقدية دستورية",
  "institution.is.2": "وحدة تسوية مغطاة بالكامل بالاحتياطي (MTQ)",
  "institution.is.3": "مكملة للعملات السيادية والعملات الرقمية للبنوك المركزية",
  "institution.is.4": "بنية تحتية للبنوك ومنصات تمويل التجارة",
  "institution.isnot.title": "ميثقال ليست",
  "institution.isnot.1": "ليست بنكًا أو بورصة أو معالجًا للمدفوعات",
  "institution.isnot.2": "ليست أصلًا مضاربيًا أو بروتوكول تمويل لامركزي",
  "institution.isnot.3": "لا تعتمد على بلوكتشين محدد",
  "institution.isnot.4": "ليست بديلًا عن العملات السيادية",

  // ---- قسم الأهداف ----
  "objectives.eyebrow": "المادة الأولى — الأهداف الدستورية",
  "objectives.heading": "ستة أهداف ملزمة على المؤسسة السعي لتحقيقها",

  // ---- قسم الثوابت ----
  "invariants.eyebrow": "الأولوية الأولى — الثوابت الدستورية",
  "invariants.heading": "خمس قواعد لا يمكن كسرها أبدًا",

  // ---- قسم مناهضة المنصة ----
  "antiplatform.eyebrow": "المادة الخامسة — مناهضة المنصة",
  "antiplatform.heading": "غير قابلة للتحول إلى منصة بموجب الدستور.",

  // ---- قسم الاحتياطيات ----
  "reserves.eyebrow": "الاحتياطيات والشفافية",
  "reserves.heading": "احتياطيات تتجاوز 100%، قابلة للتحقق على السلسلة",

  // ---- قسم المحرك النقدي ----
  "engine.eyebrow": "المادة السادسة — المحرك النقدي",
  "engine.heading": "ثماني عملات، مرساة واحدة: الذهب",
  "engine.explore": "استكشف المحرك التفاعلي الكامل",

  // ---- قسم الحوكمة ----
  "governance.eyebrow": "الحوكمة",
  "governance.heading": "تحكمها المجلس، لا رأس المال",

  // ---- قسم دورة الحياة ----
  "lifecycle.eyebrow": "المادة الرابعة عشرة — دورة حياة المؤسسة",
  "lifecycle.heading": "من التأسيس إلى الخلود",

  // ---- قسم الأهلية ----
  "eligibility.eyebrow": "من يخدمه ميثقال",
  "eligibility.heading": "مشاركون مؤسسيون، لا مضاربون",

  // ---- قسم حالة البناء ----
  "status.eyebrow": "البناء العلني",
  "status.heading": "الحالة الحالية — المرحلة 0: التأسيس",
  "status.done": "مكتمل",
  "status.inProgress": "قيد التنفيذ",
  "status.scheduled": "مجدول",
  "status.planned": "مخطط",
  "status.pending": "معلق",

  // ---- قسم الطبقة 0 ----
  "layer0.eyebrow": "الطبقة 0 — الأساس المؤسسي",
  "layer0.heading": "الأساس الفلسفي",

  // ---- قسم الوضع القانوني ----
  "legal.eyebrow": "الوضع القانوني والتنظيمي",
  "legal.heading": "معمارية الكيانين",
  "legal.description": "بموجب المادة الثامنة من الدستور (فصل العوائد)، يضم نظام ميثقال كيانين قانونيين منفصلين تمامًا. وظيفة التسوية (غير ربحية) ووظيفة العوائد (ربحية) منفصلتان تمامًا — لا توجد أصول أو التزامات أو مخاطر تنتقل بينهما.",
  "legal.entityA.name": "الكيان أ — مؤسسة ميثقال",
  "legal.entityA.type": "مؤسسة تسوية دستورية غير ربحية",
  "legal.entityA.currentOperator": "المشغل الحالي",
  "legal.entityA.targetStructure": "الهيكل المستهدف",
  "legal.entityB.name": "الكيان ب — مركب العوائد لميثقال",
  "legal.entityB.type": "صندوق استثمار تنظيمي ربحي",
  "legal.entityB.status": "الحالة",
  "legal.entityB.mtqExposure": "التعرض لـ MTQ",
  "legal.articleVIII": "المادة الثامنة — فصل العوائد",
  "legal.constitutionalVersion": "نسخة الدستور",
  "legal.constitutionalStatus": "الحالة",

  // ---- استمارة لجنة التأسيس ----
  "intake.eyebrow": "لجنة التأسيس",
  "intake.heading": "عبّر عن اهتمامك بالانضمام إلى لجنة التأسيس",
  "intake.name": "اسمك",
  "intake.email": "البريد الإلكتروني",
  "intake.org": "المؤسسة (اختياري)",
  "intake.role": "الدور",
  "intake.rolePlaceholder": "اختر دورًا…",
  "intake.message": "أخبرنا كيف تود المشاركة مع المؤسسة.",
  "intake.submit": "إرسال طلب الاهتمام",
  "intake.submitting": "جاري الإرسال…",
  "intake.missingDetails": "بيانات ناقصة",
  "intake.missingDetailsDesc": "يرجى إضافة اسمك وبريدك الإلكتروني واختيار دور.",
  "intake.recorded": "تم تسجيل الاهتمام",
  "intake.recordedDesc": "شكرًا لك. سوف تتواصل معك لجنة التأسيس. يرجى التحقق من بريدك الإلكتروني.",
  "intake.couldNotSubmit": "تعذّر الإرسال",
  "intake.tryAgain": "يرجى المحاولة مرة أخرى قريبًا.",
  "intake.role.investor": "مستثمر (مرحلة ما قبل البذرة / البذرة)",
  "intake.role.advisor": "مستشار (بنك مركزي سابق، حفظ الأصول، تمويل التجارة، الامتثال)",
  "intake.role.anchor": "مشارك راسي (بنك / منصة تمويل التجارة)",
  "intake.role.council": "مرشح للمجلس",
  "intake.role.partner": "شريك تكامل / تقنية",
  "intake.role.other": "أخرى",

  // ---- الشبكة التجريبية ----
  "testnet.badge": "محاكي الشبكة التجريبية",
  "testnet.simulatorRef": "مرجع المحاكي",
  "testnet.notTxHash": "هذا مرجع محاكي، وليس هاش معاملة على السلسلة.",

  // ---- الشفافية ----
  "transparency.badge": "محاكي · بناء علني",
  "transparency.autoRefresh": "تحديث كل 30 ثانية",

  // ---- عام ----
  "common.loading": "جاري التحميل…",
  "common.error": "حدث خطأ ما",
  "common.tryAgain": "حاول مرة أخرى",
  "common.backToMithqal": "العودة إلى ميثقال",
  "common.skipToContent": "تخطّ إلى المحتوى الرئيسي",
  "common.openInNewTab": "يفتح في تبويب جديد",
  "common.referenceDetails": "تفاصيل المرجع",
  "common.referenceId": "معرف المرجع",
  "common.quoteReference": "اذكر هذا المرجع عند التواصل مع المشغل.",
  "common.noReferenceId": "لا يوجد معرف مرجع متاح.",
};

const fr: Messages = {
  // ---- Navigation ----
  "nav.institution": "Institution",
  "nav.transparency": "Transparence",
  "nav.engine": "Moteur",
  "nav.infrastructure": "Infrastructure",
  "nav.constitution": "Constitution",
  "nav.testnet": "Testnet",
  "nav.os": "OS",
  "nav.audit": "Audit",
  "nav.deck": "Présentation",
  "nav.faq": "FAQ",
  "nav.playbook": "Manuel stratégique",
  "nav.admin": "Administration",

  // ---- Actions ----
  "action.connectWallet": "Connecter le portefeuille",
  "action.mint": "Frapper MTQ",
  "action.redeem": "Racheter MTQ",
  "action.transfer": "Transférer MTQ",
  "action.expressInterest": "Exprimer son intérêt",
  "action.whatIsMithqal": "Qu'est-ce que Mithqal",
  "action.reservesBreakdown": "Détail des réserves",
  "action.viewOnMonadScan": "Voir sur MonadScan",
  "action.submit": "Soumettre",
  "action.tryAgain": "Réessayer",
  "action.reloadPage": "Recharger la page",
  "action.returnHome": "Retour à l'Institution",

  // ---- Hero ----
  "hero.eyebrow": "Institution monétaire constitutionnelle · Établie sous la Constitution v19.0.3",
  "hero.title": "Mithqal",
  "hero.subtitle": "Une institution de règlement constitutionnelle.",
  "hero.description": "Mithqal est une infrastructure de règlement neutre, intégralement couverte par des réserves, destinée au commerce international. Ce n'est pas un jeton, une plateforme, une banque, ni un protocole DeFi. C'est une institution monétaire — gouvernée par une Constitution immuable conçue pour durer au-delà de toute technologie ou cycle de marché particulier.",
  "hero.liveMonetaryState": "État monétaire en direct",
  "hero.liveAutoRefresh": "EN DIRECT · ACTUALISATION 30S",
  "hero.updated": "mis à jour",
  "hero.now": "maintenant",
  "hero.totalSupply": "Offre totale",
  "hero.mintBurn": "Frappe − Rachat · ERC-20 MTQ",
  "hero.navMarket": "VAN (Marché)",
  "hero.navCaption": "Valeur nette d'inventaire marchande par MTQ",
  "hero.reserveRatio": "Ratio de réserve",
  "hero.ratioAboveFloor": "Au-dessus du seuil de 100%",
  "hero.ratioBelowFloor": "SOUS LE SEUIL — suspendu",
  "hero.goldPrice": "Prix de l'or",
  "hero.goldCaption": "Cours au comptant · XAU/USD",
  "hero.source": "Source",
  "hero.onChainReserves": "réserves on-chain + prix oracle en direct",

  // ---- Section Institution ----
  "institution.eyebrow": "L'Institution",
  "institution.heading": "Une autorité monétaire, non une plateforme",
  "institution.body": "L'Institution n'est pas un projet logiciel, une application blockchain ou un produit. C'est une entité constitutionnelle dont la seule fonction est d'émettre et de racheter une unité de règlement intégralement couverte par des réserves. Si la technologie sous-jacente est remplacée, l'Institution subsiste — car c'est une institution, non une technologie.",
  "institution.is.title": "Mithqal est",
  "institution.is.1": "Une institution monétaire constitutionnelle",
  "institution.is.2": "Une unité de règlement intégralement réservée (MTQ)",
  "institution.is.3": "Complémentaire aux monnaies souveraines et aux MNBC",
  "institution.is.4": "Une infrastructure pour les banques et plateformes de financement commercial",
  "institution.isnot.title": "Mithqal n'est pas",
  "institution.isnot.1": "Ni une banque, un échange ou un processeur de paiements",
  "institution.isnot.2": "Ni un actif spéculatif ou un protocole DeFi",
  "institution.isnot.3": "Non dépendante d'une blockchain spécifique",
  "institution.isnot.4": "Ni un substitut aux monnaies souveraines",

  // ---- Section Objectifs ----
  "objectives.eyebrow": "Article I — Objectifs constitutionnels",
  "objectives.heading": "Six objectifs que l'Institution est tenue de poursuivre",

  // ---- Section Invariants ----
  "invariants.eyebrow": "Priorité 1 — Invariants constitutionnels",
  "invariants.heading": "Cinq règles qui ne peuvent jamais être enfreintes",

  // ---- Section Anti-plateforme ----
  "antiplatform.eyebrow": "Article V — Anti-plateforme",
  "antiplatform.heading": "Constitutionnellement non-plateforme.",

  // ---- Section Réserves ----
  "reserves.eyebrow": "Réserves et transparence",
  "reserves.heading": "Réserves supérieures à 100%, vérifiables on-chain",

  // ---- Section Moteur monétaire ----
  "engine.eyebrow": "Article VI — Le moteur monétaire",
  "engine.heading": "Huit monnaies, une ancre : l'or",
  "engine.explore": "Explorer le moteur interactif complet",

  // ---- Section Gouvernance ----
  "governance.eyebrow": "Gouvernance",
  "governance.heading": "Gouvernée par le Conseil, non par le capital",

  // ---- Section Cycle de vie ----
  "lifecycle.eyebrow": "Article XIV — Cycle de vie institutionnelle",
  "lifecycle.heading": "De la formation à la perpétuité",

  // ---- Section Éligibilité ----
  "eligibility.eyebrow": "Que sert Mithqal",
  "eligibility.heading": "Participants institutionnels, non spéculateurs",

  // ---- Section Statut ----
  "status.eyebrow": "Construction publique",
  "status.heading": "Statut actuel — Phase 0 : Formation",
  "status.done": "Terminé",
  "status.inProgress": "En cours",
  "status.scheduled": "Programmé",
  "status.planned": "Planifié",
  "status.pending": "En attente",

  // ---- Section Couche 0 ----
  "layer0.eyebrow": "Couche 0 — La fondation institutionnelle",
  "layer0.heading": "Le socle philosophique",

  // ---- Section Statut juridique ----
  "legal.eyebrow": "Statut juridique et réglementaire",
  "legal.heading": "Architecture à deux entités",
  "legal.description": "Conformément à l'Article VIII de la Constitution (Séparation des rendements), l'écosystème Mithqal comprend deux entités juridiquement distinctes. La fonction de règlement (à but non lucratif) et la fonction de rendement (à but lucratif) sont absolument séparées — aucun actif, passif ou risque ne transite entre elles.",
  "legal.entityA.name": "Entité A — L'Institution Mithqal",
  "legal.entityA.type": "Institution de règlement constitutionnelle à but non lucratif",
  "legal.entityA.currentOperator": "Opérateur actuel",
  "legal.entityA.targetStructure": "Structure cible",
  "legal.entityB.name": "Entité B — Véhicule de rendement Mithqal",
  "legal.entityB.type": "Fonds d'investissement réglementé à but lucratif",
  "legal.entityB.status": "Statut",
  "legal.entityB.mtqExposure": "Exposition au MTQ",
  "legal.articleVIII": "Article VIII — Séparation des rendements",
  "legal.constitutionalVersion": "Version constitutionnelle",
  "legal.constitutionalStatus": "Statut",

  // ---- Formulaire Comité de formation ----
  "intake.eyebrow": "Comité de formation",
  "intake.heading": "Exprimez votre intérêt à rejoindre le Comité de formation",
  "intake.name": "Votre nom",
  "intake.email": "Adresse électronique",
  "intake.org": "Organisation (facultatif)",
  "intake.role": "Rôle",
  "intake.rolePlaceholder": "Sélectionner un rôle…",
  "intake.message": "Dites-nous comment vous souhaitez vous engager avec l'Institution.",
  "intake.submit": "Soumettre l'expression d'intérêt",
  "intake.submitting": "Envoi en cours…",
  "intake.missingDetails": "Informations manquantes",
  "intake.missingDetailsDesc": "Veuillez indiquer votre nom, votre courriel et sélectionner un rôle.",
  "intake.recorded": "Intérêt enregistré",
  "intake.recordedDesc": "Merci. Le Comité de formation vous contactera. Vérifiez votre courriel.",
  "intake.couldNotSubmit": "Envoi impossible",
  "intake.tryAgain": "Veuillez réessayer dans un instant.",
  "intake.role.investor": "Investisseur (pré-amorçage / amorçage)",
  "intake.role.advisor": "Conseiller (ancienne banque centrale, garde, financement commercial, conformité)",
  "intake.role.anchor": "Participant ancre (banque / plateforme de financement commercial)",
  "intake.role.council": "Candidat au Conseil",
  "intake.role.partner": "Partenaire d'intégration / technologie",
  "intake.role.other": "Autre",

  // ---- Testnet ----
  "testnet.badge": "SIMULATEUR TESTNET",
  "testnet.simulatorRef": "Référence simulateur",
  "testnet.notTxHash": "Ceci est une référence simulateur, non un hash de transaction on-chain.",

  // ---- Transparence ----
  "transparency.badge": "Simulateur · construction publique",
  "transparency.autoRefresh": "Actualisation 30s",

  // ---- Commun ----
  "common.loading": "Chargement…",
  "common.error": "Une erreur s'est produite",
  "common.tryAgain": "Réessayer",
  "common.backToMithqal": "Retour à Mithqal",
  "common.skipToContent": "Aller au contenu principal",
  "common.openInNewTab": "ouvre dans un nouvel onglet",
  "common.referenceDetails": "Détails de référence",
  "common.referenceId": "Identifiant de référence",
  "common.quoteReference": "Citez cet identifiant lorsque vous contactez l'opérateur.",
  "common.noReferenceId": "Aucun identifiant de référence disponible.",
};

const de: Messages = {
  // ---- Navigation ----
  "nav.institution": "Institution",
  "nav.transparency": "Transparenz",
  "nav.engine": "Motor",
  "nav.infrastructure": "Infrastruktur",
  "nav.constitution": "Verfassung",
  "nav.testnet": "Testnetz",
  "nav.os": "OS",
  "nav.audit": "Audit",
  "nav.deck": "Präsentation",
  "nav.faq": "FAQ",
  "nav.playbook": "Strategiehandbuch",
  "nav.admin": "Verwaltung",

  // ---- Aktionen ----
  "action.connectWallet": "Wallet verbinden",
  "action.mint": "MTQ prägen",
  "action.redeem": "MTQ einlösen",
  "action.transfer": "MTQ übertragen",
  "action.expressInterest": "Interesse bekunden",
  "action.whatIsMithqal": "Was ist Mithqal",
  "action.reservesBreakdown": "Aufschlüsselung der Reserven",
  "action.viewOnMonadScan": "Auf MonadScan ansehen",
  "action.submit": "Einreichen",
  "action.tryAgain": "Erneut versuchen",
  "action.reloadPage": "Seite neu laden",
  "action.returnHome": "Zurück zur Institution",

  // ---- Hero ----
  "hero.eyebrow": "Konstitutionelle Währungsinstitution · Gegründet unter der Verfassung v19.0.3",
  "hero.title": "Mithqal",
  "hero.subtitle": "Eine konstitutionelle Abwicklungsinstitution.",
  "hero.description": "Mithqal ist eine neutrale, voll gedeckte Abwicklungsinfrastruktur für den internationalen Handel. Sie ist kein Token, keine Plattform, keine Bank und kein DeFi-Protokoll. Sie ist eine Währungsinstitution — gesteuert durch eine unveränderliche Verfassung, die darauf ausgelegt ist, über jede einzelne Technologie oder jeden Marktzyklus hinaus zu bestehen.",
  "hero.liveMonetaryState": "Live-Währungsstatus",
  "hero.liveAutoRefresh": "LIVE · AUTO-AKTUALISIERUNG 30S",
  "hero.updated": "aktualisiert",
  "hero.now": "jetzt",
  "hero.totalSupply": "Gesamtangebot",
  "hero.mintBurn": "Prägung − Einlösung · ERC-20 MTQ",
  "hero.navMarket": "NIW (Markt)",
  "hero.navCaption": "Mark-to-Market-NIW je MTQ",
  "hero.reserveRatio": "Deckungsquote",
  "hero.ratioAboveFloor": "Über 100%-Untergrenze",
  "hero.ratioBelowFloor": "UNTER DER UNTERGRENZE — pausiert",
  "hero.goldPrice": "Goldpreis",
  "hero.goldCaption": "Live-Spot · XAU/USD",
  "hero.source": "Quelle",
  "hero.onChainReserves": "On-Chain-Reserven + Live-Oracle-Preise",

  // ---- Abschnitt Institution ----
  "institution.eyebrow": "Die Institution",
  "institution.heading": "Eine Währungsbehörde, keine Plattform",
  "institution.body": "Die Institution ist kein Softwareprojekt, keine Blockchain-Anwendung und kein Produkt. Sie ist eine konstitutionelle Einrichtung, deren einzige Funktion darin besteht, eine voll gedeckte Abwicklungseinheit zu emittieren und einzulösen. Wird die zugrunde liegende Technologie ersetzt, besteht die Institution fort — denn sie ist eine Institution, keine Technologie.",
  "institution.is.title": "Mithqal ist",
  "institution.is.1": "Eine konstitutionelle Währungsinstitution",
  "institution.is.2": "Eine voll gedeckte Abwicklungseinheit (MTQ)",
  "institution.is.3": "Ergänzend zu souveränen Währungen und digitalem Zentralbankgeld",
  "institution.is.4": "Infrastruktur für Banken und Handelsfinanzierungsplattformen",
  "institution.isnot.title": "Mithqal ist nicht",
  "institution.isnot.1": "Keine Bank, Börse oder Zahlungsabwicklungsstelle",
  "institution.isnot.2": "Kein spekulativer Vermögenswert oder DeFi-Protokoll",
  "institution.isnot.3": "Nicht abhängig von einer bestimmten Blockchain",
  "institution.isnot.4": "Kein Ersatz für souveräne Währungen",

  // ---- Abschnitt Ziele ----
  "objectives.eyebrow": "Artikel I — Konstitutionelle Ziele",
  "objectives.heading": "Sechs Ziele, die die Institution verpflichtet ist zu verfolgen",

  // ---- Abschnitt Invarianten ----
  "invariants.eyebrow": "Priorität 1 — Konstitutionelle Invarianten",
  "invariants.heading": "Fünf Regeln, die niemals gebrochen werden dürfen",

  // ---- Abschnitt Anti-Plattform ----
  "antiplatform.eyebrow": "Artikel V — Anti-Plattform",
  "antiplatform.heading": "Konstitutionell Nicht-Plattform.",

  // ---- Abschnitt Reserven ----
  "reserves.eyebrow": "Reserven und Transparenz",
  "reserves.heading": "Über 100% Reserven, on-chain verifizierbar",

  // ---- Abschnitt Währungsmotor ----
  "engine.eyebrow": "Artikel VI — Der Währungsmotor",
  "engine.heading": "Acht Währungen, ein Anker: Gold",
  "engine.explore": "Den vollständigen interaktiven Motor erkunden",

  // ---- Abschnitt Governance ----
  "governance.eyebrow": "Governance",
  "governance.heading": "Vom Rat gesteuert, nicht vom Kapital",

  // ---- Abschnitt Lebenszyklus ----
  "lifecycle.eyebrow": "Artikel XIV — Institutioneller Lebenszyklus",
  "lifecycle.heading": "Von der Gründung zur Dauerhaftigkeit",

  // ---- Abschnitt Teilnahmeberechtigung ----
  "eligibility.eyebrow": "Wen Mithqal bedient",
  "eligibility.heading": "Institutionelle Teilnehmer, keine Spekulanten",

  // ---- Abschnitt Status ----
  "status.eyebrow": "Öffentlich aufbauen",
  "status.heading": "Aktueller Status — Phase 0: Gründung",
  "status.done": "Abgeschlossen",
  "status.inProgress": "In Bearbeitung",
  "status.scheduled": "Geplant",
  "status.planned": "Vorgesehen",
  "status.pending": "Ausstehend",

  // ---- Abschnitt Schicht 0 ----
  "layer0.eyebrow": "Schicht 0 — Das institutionelle Fundament",
  "layer0.heading": "Das philosophische Fundament",

  // ---- Abschnitt Rechtlicher Status ----
  "legal.eyebrow": "Rechtlicher und regulatorischer Status",
  "legal.heading": "Zwei-Entitäten-Architektur",
  "legal.description": "Gemäß Verfassungsartikel VIII (Ertragsstrenge) umfasst das Mithqal-Ökosystem zwei rechtlich getrennte Einheiten. Die Abwicklungsfunktion (gemeinnützig) und die Ertragsfunktion (gewinnorientiert) sind strikt getrennt — es fließen keine Vermögenswerte, Verbindlichkeiten oder Risiken zwischen ihnen.",
  "legal.entityA.name": "Einheit A — Die Mithqal-Institution",
  "legal.entityA.type": "Gemeinnützige konstitutionelle Abwicklungsinstitution",
  "legal.entityA.currentOperator": "Aktueller Betreiber",
  "legal.entityA.targetStructure": "Zielstruktur",
  "legal.entityB.name": "Einheit B — Mithqal-Ertragsvehikel",
  "legal.entityB.type": "Gewinnorientierter regulierter Investmentfonds",
  "legal.entityB.status": "Status",
  "legal.entityB.mtqExposure": "MTQ-Exposition",
  "legal.articleVIII": "Artikel VIII — Ertragsstrenge",
  "legal.constitutionalVersion": "Verfassungsversion",
  "legal.constitutionalStatus": "Status",

  // ---- Aufnahme Gründungskomitee ----
  "intake.eyebrow": "Gründungskomitee",
  "intake.heading": "Interesse an der Mitgliedschaft im Gründungskomitee bekunden",
  "intake.name": "Ihr Name",
  "intake.email": "E-Mail-Adresse",
  "intake.org": "Organisation (optional)",
  "intake.role": "Rolle",
  "intake.rolePlaceholder": "Bitte eine Rolle wählen…",
  "intake.message": "Teilen Sie uns mit, wie Sie mit der Institution in Kontakt treten möchten.",
  "intake.submit": "Interessenbekundung einreichen",
  "intake.submitting": "Wird gesendet…",
  "intake.missingDetails": "Angaben fehlen",
  "intake.missingDetailsDesc": "Bitte ergänzen Sie Ihren Namen, Ihre E-Mail-Adresse und wählen Sie eine Rolle.",
  "intake.recorded": "Interesse erfasst",
  "intake.recordedDesc": "Vielen Dank. Das Gründungskomitee wird sich melden. Bitte prüfen Sie Ihre E-Mails.",
  "intake.couldNotSubmit": "Übermittlung nicht möglich",
  "intake.tryAgain": "Bitte versuchen Sie es in Kürze erneut.",
  "intake.role.investor": "Investor (Pre-Seed / Seed)",
  "intake.role.advisor": "Berater (ehemalige Zentralbank, Verwahrung, Handelsfinanzierung, Compliance)",
  "intake.role.anchor": "Anker-Teilnehmer (Bank / Handelsfinanzierungsplattform)",
  "intake.role.council": "Ratskandidat",
  "intake.role.partner": "Integrations-/Technologiepartner",
  "intake.role.other": "Andere",

  // ---- Testnetz ----
  "testnet.badge": "TESTNETZ-SIMULATOR",
  "testnet.simulatorRef": "Simulatorreferenz",
  "testnet.notTxHash": "Dies ist eine Simulatorreferenz, kein On-Chain-Transaktions-Hash.",

  // ---- Transparenz ----
  "transparency.badge": "Simulator · öffentlicher Aufbau",
  "transparency.autoRefresh": "Auto-Aktualisierung 30s",

  // ---- Allgemein ----
  "common.loading": "Wird geladen…",
  "common.error": "Etwas ist schiefgelaufen",
  "common.tryAgain": "Erneut versuchen",
  "common.backToMithqal": "Zurück zu Mithqal",
  "common.skipToContent": "Zum Hauptinhalt springen",
  "common.openInNewTab": "öffnet in einem neuen Tab",
  "common.referenceDetails": "Referenzdetails",
  "common.referenceId": "Referenz-ID",
  "common.quoteReference": "Geben Sie diese Referenz bei Kontaktaufnahme mit dem Betreiber an.",
  "common.noReferenceId": "Keine Referenz-ID verfügbar.",
};

const es: Messages = {
  // ---- Navegación ----
  "nav.institution": "Institución",
  "nav.transparency": "Transparencia",
  "nav.engine": "Motor",
  "nav.infrastructure": "Infraestructura",
  "nav.constitution": "Constitución",
  "nav.testnet": "Testnet",
  "nav.os": "SO",
  "nav.audit": "Auditoría",
  "nav.deck": "Presentación",
  "nav.faq": "FAQ",
  "nav.playbook": "Manual estratégico",
  "nav.admin": "Administración",

  // ---- Acciones ----
  "action.connectWallet": "Conectar monedero",
  "action.mint": "Acuñar MTQ",
  "action.redeem": "Rescatar MTQ",
  "action.transfer": "Transferir MTQ",
  "action.expressInterest": "Expresar interés",
  "action.whatIsMithqal": "Qué es Mithqal",
  "action.reservesBreakdown": "Desglose de reservas",
  "action.viewOnMonadScan": "Ver en MonadScan",
  "action.submit": "Enviar",
  "action.tryAgain": "Reintentar",
  "action.reloadPage": "Recargar página",
  "action.returnHome": "Volver a la Institución",

  // ---- Hero ----
  "hero.eyebrow": "Institución monetaria constitucional · Establecida bajo la Constitución v19.0.3",
  "hero.title": "Mithqal",
  "hero.subtitle": "Una institución de liquidación constitucional.",
  "hero.description": "Mithqal es una infraestructura de liquidación neutral e íntegramente respaldada para el comercio internacional. No es un token, una plataforma, un banco ni un protocolo DeFi. Es una institución monetaria — gobernada por una Constitución inmutable diseñada para perdurar más allá de cualquier tecnología o ciclo de mercado particular.",
  "hero.liveMonetaryState": "Estado monetario en vivo",
  "hero.liveAutoRefresh": "EN VIVO · AUTO-ACTUALIZACIÓN 30S",
  "hero.updated": "actualizado",
  "hero.now": "ahora",
  "hero.totalSupply": "Oferta total",
  "hero.mintBurn": "Acuñación − Rescate · ERC-20 MTQ",
  "hero.navMarket": "VL (Mercado)",
  "hero.navCaption": "Valor liquidativo de mercado por MTQ",
  "hero.reserveRatio": "Ratio de reserva",
  "hero.ratioAboveFloor": "Por encima del piso del 100%",
  "hero.ratioBelowFloor": "BAJO EL PISO — suspendido",
  "hero.goldPrice": "Precio del oro",
  "hero.goldCaption": "Spot en vivo · XAU/USD",
  "hero.source": "Fuente",
  "hero.onChainReserves": "reservas on-chain + precios de oráculo en vivo",

  // ---- Sección Institución ----
  "institution.eyebrow": "La Institución",
  "institution.heading": "Una autoridad monetaria, no una plataforma",
  "institution.body": "La Institución no es un proyecto de software, una aplicación blockchain o un producto. Es una entidad constitucional cuya única función es emitir y rescatar una unidad de liquidación íntegramente respaldada. Si la tecnología subyacente se sustituye, la Institución perdura — porque es una institución, no una tecnología.",
  "institution.is.title": "Mithqal es",
  "institution.is.1": "Una institución monetaria constitucional",
  "institution.is.2": "Una unidad de liquidación íntegramente respaldada (MTQ)",
  "institution.is.3": "Complementaria a las monedas soberanas y a las monedas digitales del banco central",
  "institution.is.4": "Infraestructura para bancos y plataformas de financiamiento comercial",
  "institution.isnot.title": "Mithqal no es",
  "institution.isnot.1": "Ni un banco, exchange o procesador de pagos",
  "institution.isnot.2": "Ni un activo especulativo o protocolo DeFi",
  "institution.isnot.3": "No dependiente de una blockchain específica",
  "institution.isnot.4": "Ni un sustituto de las monedas soberanas",

  // ---- Sección Objetivos ----
  "objectives.eyebrow": "Artículo I — Objetivos constitucionales",
  "objectives.heading": "Seis objetivos que la Institución está obligada a perseguir",

  // ---- Sección Invariantes ----
  "invariants.eyebrow": "Prioridad 1 — Invariantes constitucionales",
  "invariants.heading": "Cinco reglas que nunca pueden romperse",

  // ---- Sección Anti-plataforma ----
  "antiplatform.eyebrow": "Artículo V — Anti-plataforma",
  "antiplatform.heading": "Constitucionalmente no-plataforma.",

  // ---- Sección Reservas ----
  "reserves.eyebrow": "Reservas y transparencia",
  "reserves.heading": "Reservas superiores al 100%, verificables on-chain",

  // ---- Sección Motor monetario ----
  "engine.eyebrow": "Artículo VI — El motor monetario",
  "engine.heading": "Ocho monedas, un ancla: el oro",
  "engine.explore": "Explorar el motor interactivo completo",

  // ---- Sección Gobernanza ----
  "governance.eyebrow": "Gobernanza",
  "governance.heading": "Gobernada por el Consejo, no por el capital",

  // ---- Sección Ciclo de vida ----
  "lifecycle.eyebrow": "Artículo XIV — Ciclo de vida institucional",
  "lifecycle.heading": "De la formación a la perpetuidad",

  // ---- Sección Elegibilidad ----
  "eligibility.eyebrow": "A quién sirve Mithqal",
  "eligibility.heading": "Participantes institucionales, no especuladores",

  // ---- Sección Estado ----
  "status.eyebrow": "Construir en público",
  "status.heading": "Estado actual — Fase 0: Formación",
  "status.done": "Completado",
  "status.inProgress": "En progreso",
  "status.scheduled": "Programado",
  "status.planned": "Planificado",
  "status.pending": "Pendiente",

  // ---- Sección Capa 0 ----
  "layer0.eyebrow": "Capa 0 — La base institucional",
  "layer0.heading": "El cimiento filosófico",

  // ---- Sección Estado legal ----
  "legal.eyebrow": "Estado legal y regulatorio",
  "legal.heading": "Arquitectura de dos entidades",
  "legal.description": "Conforme al Artículo VIII de la Constitución (Separación de rendimientos), el ecosistema Mithqal comprende dos entidades legalmente separadas. La función de liquidación (sin fines de lucro) y la función de rendimiento (con fines de lucro) están absolutamente separadas — ningún activo, pasivo o riesgo cruza entre ellas.",
  "legal.entityA.name": "Entidad A — La Institución Mithqal",
  "legal.entityA.type": "Institución de liquidación constitucional sin fines de lucro",
  "legal.entityA.currentOperator": "Operador actual",
  "legal.entityA.targetStructure": "Estructura objetivo",
  "legal.entityB.name": "Entidad B — Vehículo de rendimiento Mithqal",
  "legal.entityB.type": "Fondo de inversión regulado con fines de lucro",
  "legal.entityB.status": "Estado",
  "legal.entityB.mtqExposure": "Exposición al MTQ",
  "legal.articleVIII": "Artículo VIII — Separación de rendimientos",
  "legal.constitutionalVersion": "Versión constitucional",
  "legal.constitutionalStatus": "Estado",

  // ---- Formulario Comité de formación ----
  "intake.eyebrow": "Comité de formación",
  "intake.heading": "Exprese su interés en unirse al Comité de formación",
  "intake.name": "Su nombre",
  "intake.email": "Correo electrónico",
  "intake.org": "Organización (opcional)",
  "intake.role": "Rol",
  "intake.rolePlaceholder": "Seleccione un rol…",
  "intake.message": "Cuéntenos cómo desea participar con la Institución.",
  "intake.submit": "Enviar expresión de interés",
  "intake.submitting": "Enviando…",
  "intake.missingDetails": "Faltan datos",
  "intake.missingDetailsDesc": "Por favor, añada su nombre, correo electrónico y seleccione un rol.",
  "intake.recorded": "Interés registrado",
  "intake.recordedDesc": "Gracias. El Comité de formación se pondrá en contacto. Revise su correo electrónico.",
  "intake.couldNotSubmit": "No se pudo enviar",
  "intake.tryAgain": "Por favor, reintente en breve.",
  "intake.role.investor": "Inversor (pre-semilla / semilla)",
  "intake.role.advisor": "Asesor (ex-banco central, custodia, financiamiento comercial, cumplimiento)",
  "intake.role.anchor": "Participante ancla (banco / plataforma de financiamiento comercial)",
  "intake.role.council": "Candidato al Consejo",
  "intake.role.partner": "Socio de integración / tecnología",
  "intake.role.other": "Otro",

  // ---- Testnet ----
  "testnet.badge": "SIMULADOR TESTNET",
  "testnet.simulatorRef": "Referencia del simulador",
  "testnet.notTxHash": "Esta es una referencia del simulador, no un hash de transacción on-chain.",

  // ---- Transparencia ----
  "transparency.badge": "Simulador · construcción pública",
  "transparency.autoRefresh": "Auto-actualización 30s",

  // ---- Común ----
  "common.loading": "Cargando…",
  "common.error": "Algo salió mal",
  "common.tryAgain": "Reintentar",
  "common.backToMithqal": "Volver a Mithqal",
  "common.skipToContent": "Ir al contenido principal",
  "common.openInNewTab": "se abre en una nueva pestaña",
  "common.referenceDetails": "Detalles de referencia",
  "common.referenceId": "ID de referencia",
  "common.quoteReference": "Cite esta referencia al contactar al operador.",
  "common.noReferenceId": "Sin ID de referencia disponible.",
};

const zh: Messages = {
  // ---- 导航 ----
  "nav.institution": "机构",
  "nav.transparency": "透明度",
  "nav.engine": "引擎",
  "nav.infrastructure": "基础设施",
  "nav.constitution": "宪法",
  "nav.testnet": "测试网",
  "nav.os": "OS",
  "nav.audit": "审计",
  "nav.deck": "演示文稿",
  "nav.faq": "常见问题",
  "nav.playbook": "战略手册",
  "nav.admin": "管理",

  // ---- 操作 ----
  "action.connectWallet": "连接钱包",
  "action.mint": "铸造 MTQ",
  "action.redeem": "赎回 MTQ",
  "action.transfer": "转账 MTQ",
  "action.expressInterest": "提交意向",
  "action.whatIsMithqal": "什么是 Mithqal",
  "action.reservesBreakdown": "储备明细",
  "action.viewOnMonadScan": "在 MonadScan 上查看",
  "action.submit": "提交",
  "action.tryAgain": "重试",
  "action.reloadPage": "重新加载页面",
  "action.returnHome": "返回机构",

  // ---- 首屏 ----
  "hero.eyebrow": "宪法货币机构 · 依 v19.0.3 宪法设立",
  "hero.title": "Mithqal",
  "hero.subtitle": "一家宪法结算机构。",
  "hero.description": "Mithqal 是用于国际贸易的中立、全额储备结算基础设施。它不是代币、平台、银行或 DeFi 协议。它是一家货币机构——由一部不可变的宪法治理，旨在超越任何单一技术或市场周期而存续。",
  "hero.liveMonetaryState": "实时货币状态",
  "hero.liveAutoRefresh": "实时 · 30秒自动刷新",
  "hero.updated": "已更新",
  "hero.now": "当前",
  "hero.totalSupply": "总供应量",
  "hero.mintBurn": "铸造 − 赎回 · ERC-20 MTQ",
  "hero.navMarket": "资产净值（市场）",
  "hero.navCaption": "每枚 MTQ 的逐市资产净值",
  "hero.reserveRatio": "储备比率",
  "hero.ratioAboveFloor": "高于 100% 下限",
  "hero.ratioBelowFloor": "低于下限 — 已暂停",
  "hero.goldPrice": "黄金价格",
  "hero.goldCaption": "实时现货 · XAU/USD",
  "hero.source": "来源",
  "hero.onChainReserves": "链上储备 + 实时预言机价格",

  // ---- 机构章节 ----
  "institution.eyebrow": "本机构",
  "institution.heading": "货币权威，而非平台",
  "institution.body": "本机构并非软件项目、区块链应用或产品。它是一家宪法实体，其唯一职能是发行和赎回全额储备的结算单位。即便底层技术被替换，本机构依然存续——因为它是一家机构，而非一项技术。",
  "institution.is.title": "Mithqal 是",
  "institution.is.1": "一家宪法货币机构",
  "institution.is.2": "全额储备结算单位（MTQ）",
  "institution.is.3": "对主权货币与央行数字货币的补充",
  "institution.is.4": "面向银行与贸易融资平台的基础设施",
  "institution.isnot.title": "Mithqal 不是",
  "institution.isnot.1": "不是银行、交易所或支付处理机构",
  "institution.isnot.2": "不是投机性资产或 DeFi 协议",
  "institution.isnot.3": "不依赖于任何特定区块链",
  "institution.isnot.4": "不是主权货币的替代品",

  // ---- 目标章节 ----
  "objectives.eyebrow": "第一条 — 宪法目标",
  "objectives.heading": "本机构必须追求的六项目标",

  // ---- 不变量章节 ----
  "invariants.eyebrow": "优先级一 — 宪法不变量",
  "invariants.heading": "五条永远不可违背的规则",

  // ---- 反平台章节 ----
  "antiplatform.eyebrow": "第五条 — 反平台",
  "antiplatform.heading": "宪法层面即非平台。",

  // ---- 储备章节 ----
  "reserves.eyebrow": "储备与透明度",
  "reserves.heading": "超过 100% 的储备，可在链上验证",

  // ---- 货币引擎章节 ----
  "engine.eyebrow": "第六条 — 货币引擎",
  "engine.heading": "八种货币，一个锚定：黄金",
  "engine.explore": "探索完整的交互式引擎",

  // ---- 治理章节 ----
  "governance.eyebrow": "治理",
  "governance.heading": "由理事会治理，而非由资本治理",

  // ---- 生命周期章节 ----
  "lifecycle.eyebrow": "第十四条 — 机构生命周期",
  "lifecycle.heading": "从组建到永续",

  // ---- 资格章节 ----
  "eligibility.eyebrow": "Mithqal 服务对象",
  "eligibility.heading": "机构参与者，而非投机者",

  // ---- 状态章节 ----
  "status.eyebrow": "公开构建",
  "status.heading": "当前状态 — 阶段 0：组建",
  "status.done": "已完成",
  "status.inProgress": "进行中",
  "status.scheduled": "已排定",
  "status.planned": "已规划",
  "status.pending": "待定",

  // ---- 第 0 层章节 ----
  "layer0.eyebrow": "第 0 层 — 机构基础",
  "layer0.heading": "哲学基石",

  // ---- 法律地位章节 ----
  "legal.eyebrow": "法律与监管地位",
  "legal.heading": "双实体架构",
  "legal.description": "根据宪法第八条（收益分离），Mithqal 生态系统由两家法律上相互独立的实体组成。结算职能（非营利）与收益职能（营利）完全分离——它们之间不存在任何资产、负债或风险的交叉。",
  "legal.entityA.name": "实体 A — Mithqal 机构",
  "legal.entityA.type": "非营利性宪法结算机构",
  "legal.entityA.currentOperator": "当前运营方",
  "legal.entityA.targetStructure": "目标结构",
  "legal.entityB.name": "实体 B — Mithqal 收益工具",
  "legal.entityB.type": "营利性受监管投资基金",
  "legal.entityB.status": "状态",
  "legal.entityB.mtqExposure": "MTQ 敞口",
  "legal.articleVIII": "第八条 — 收益分离",
  "legal.constitutionalVersion": "宪法版本",
  "legal.constitutionalStatus": "状态",

  // ---- 组建委员会申请表 ----
  "intake.eyebrow": "组建委员会",
  "intake.heading": "表达加入组建委员会的意向",
  "intake.name": "您的姓名",
  "intake.email": "电子邮箱",
  "intake.org": "机构（选填）",
  "intake.role": "角色",
  "intake.rolePlaceholder": "请选择一个角色…",
  "intake.message": "请告知您希望如何与本机构合作。",
  "intake.submit": "提交意向",
  "intake.submitting": "提交中…",
  "intake.missingDetails": "信息不完整",
  "intake.missingDetailsDesc": "请填写您的姓名、电子邮箱并选择一个角色。",
  "intake.recorded": "意向已记录",
  "intake.recordedDesc": "感谢您。组建委员会将与您联系。请查收邮件。",
  "intake.couldNotSubmit": "无法提交",
  "intake.tryAgain": "请稍后重试。",
  "intake.role.investor": "投资人（种子前期 / 种子期）",
  "intake.role.advisor": "顾问（前央行、托管、贸易融资、合规）",
  "intake.role.anchor": "锚定参与方（银行 / 贸易融资平台）",
  "intake.role.council": "理事会提名人",
  "intake.role.partner": "集成 / 技术合作伙伴",
  "intake.role.other": "其他",

  // ---- 测试网 ----
  "testnet.badge": "测试网模拟器",
  "testnet.simulatorRef": "模拟器参考号",
  "testnet.notTxHash": "此为模拟器参考号，并非链上交易哈希。",

  // ---- 透明度 ----
  "transparency.badge": "模拟器 · 公开构建",
  "transparency.autoRefresh": "30秒自动刷新",

  // ---- 通用 ----
  "common.loading": "加载中…",
  "common.error": "发生错误",
  "common.tryAgain": "重试",
  "common.backToMithqal": "返回 Mithqal",
  "common.skipToContent": "跳至主内容",
  "common.openInNewTab": "在新标签页中打开",
  "common.referenceDetails": "参考详情",
  "common.referenceId": "参考编号",
  "common.quoteReference": "联系运营方时请提供此参考编号。",
  "common.noReferenceId": "无可用的参考编号。",
};

export const MESSAGES: Record<Locale, Messages> = { en, ar, fr, de, es, zh };

/**
 * Translate a key in the given locale. Falls back to the English string
 * when the key is missing from the requested locale.
 */
export function translate(locale: Locale, key: string): string {
  return MESSAGES[locale]?.[key] ?? MESSAGES.en[key] ?? key;
}
