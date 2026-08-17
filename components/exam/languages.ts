/**
 * Language registry for exam content.
 *
 * The portal used to hard-code a two-state EN / हिं toggle. This replaces it
 * with a registry so adding Bengali, Tamil, Telugu (or any other language) is
 * a *content* change, not a code change: publish translations under the
 * language code and the selector picks them up automatically.
 *
 * Backwards compatibility: the legacy `textHindi` / `optionsHindi` /
 * `passageHindi` / `explanationHindi` / `*HindiImages` fields are still read
 * as the `hi` translation, so existing questions keep working untouched.
 */

export interface LanguageDef {
  /** ISO 639-1 code, lowercase. */
  code: string;
  /** English name, for accessibility labels. */
  label: string;
  /** Endonym, shown in the selector. */
  native: string;
  /** Two-to-three character badge for the compact trigger. */
  short: string;
}

export const LANGUAGES: LanguageDef[] = [
  { code: "en", label: "English",   native: "English",   short: "EN" },
  { code: "hi", label: "Hindi",     native: "हिन्दी",      short: "हि" },
  { code: "bn", label: "Bengali",   native: "বাংলা",      short: "বাং" },
  { code: "ta", label: "Tamil",     native: "தமிழ்",      short: "த" },
  { code: "te", label: "Telugu",    native: "తెలుగు",     short: "తె" },
  { code: "mr", label: "Marathi",   native: "मराठी",      short: "मरा" },
  { code: "gu", label: "Gujarati",  native: "ગુજરાતી",    short: "ગુ" },
  { code: "kn", label: "Kannada",   native: "ಕನ್ನಡ",      short: "ಕ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം",   short: "മ" },
  { code: "pa", label: "Punjabi",   native: "ਪੰਜਾਬੀ",     short: "ਪੰ" },
  { code: "or", label: "Odia",      native: "ଓଡ଼ିଆ",      short: "ଓ" },
  { code: "as", label: "Assamese",  native: "অসমীয়া",    short: "অ" },
  { code: "ur", label: "Urdu",      native: "اردو",      short: "اُ" },
];

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

export function languageOf(code: string): LanguageDef {
  return BY_CODE.get(code) ?? { code, label: code.toUpperCase(), native: code.toUpperCase(), short: code.slice(0, 2).toUpperCase() };
}

/** Languages that read right-to-left — the viewer flips text direction. */
const RTL = new Set(["ur", "ar", "fa"]);
export function isRTL(code: string): boolean {
  return RTL.has(code);
}

/* ══════════════════════════════════════════════════════
   Per-language content
══════════════════════════════════════════════════════ */

export interface LangContent {
  text?: string | null;
  options?: string[] | null;
  explanation?: string | null;
  passage?: string | null;
  questionImages?: string[] | null;
  optionImages?: string[][] | null;
}

/** The minimum shape `resolveContent` needs — matches `Question`. */
export interface TranslatableQuestion {
  text: string;
  options: string[];
  explanation?: string | null;
  passage?: string | null;
  questionImages?: string[] | null;
  optionImages?: string[][] | null;

  /* Legacy Hindi fields */
  textHindi?: string | null;
  optionsHindi?: string[] | null;
  explanationHindi?: string | null;
  passageHindi?: string | null;
  questionHindiImages?: string[] | null;
  optionHindiImages?: string[][] | null;

  /* Forward-looking: any language keyed by code */
  translations?: Record<string, LangContent> | null;
}

/** Normalises the legacy Hindi columns into a `LangContent`. */
function legacyHindi(q: TranslatableQuestion): LangContent | null {
  if (!q.textHindi && !q.optionsHindi?.length) return null;
  return {
    text: q.textHindi,
    options: q.optionsHindi,
    explanation: q.explanationHindi,
    passage: q.passageHindi,
    questionImages: q.questionHindiImages,
    optionImages: q.optionHindiImages,
  };
}

function contentFor(q: TranslatableQuestion, code: string): LangContent | null {
  if (code === "en") return null; // English is the base record
  const explicit = q.translations?.[code];
  if (explicit && (explicit.text || explicit.options?.length)) return explicit;
  if (code === "hi") return legacyHindi(q);
  return null;
}

/** True when this question has usable content in `code`. */
export function hasLanguage(q: TranslatableQuestion, code: string): boolean {
  if (code === "en") return Boolean(q.text || q.options?.length);
  return contentFor(q, code) !== null;
}

/**
 * Every language at least one question in the paper is available in,
 * returned in registry order so the selector is stable.
 */
export function availableLanguages(questions: TranslatableQuestion[]): LanguageDef[] {
  const codes = new Set<string>(["en"]);

  questions.forEach((q) => {
    if (q.textHindi || q.optionsHindi?.length) codes.add("hi");
    if (q.translations) {
      Object.entries(q.translations).forEach(([code, c]) => {
        if (c && (c.text || c.options?.length)) codes.add(code);
      });
    }
  });

  const known = LANGUAGES.filter((l) => codes.has(l.code));
  // Preserve any code that isn't in the registry yet rather than dropping it.
  const extra = [...codes]
    .filter((c) => !BY_CODE.has(c))
    .map(languageOf);

  return [...known, ...extra];
}

export interface ResolvedContent {
  text: string;
  options: string[];
  explanation?: string | null;
  passage?: string | null;
  questionImages: string[];
  optionImages: string[][];
  /** True when the requested language had no content and English was used. */
  fellBack: boolean;
}

/**
 * Resolves a question's displayable content for `code`, falling back
 * field-by-field to English so a partial translation never blanks the screen.
 */
export function resolveContent(q: TranslatableQuestion, code: string): ResolvedContent {
  const c = contentFor(q, code);

  const text = c?.text || q.text;
  const options = c?.options?.length ? c.options : q.options;

  return {
    text,
    options,
    explanation: c?.explanation || q.explanation,
    passage: c?.passage || q.passage,
    questionImages: (c?.questionImages ?? q.questionImages ?? []).filter(Boolean) as string[],
    optionImages: (c?.optionImages ?? q.optionImages ?? []) as string[][],
    fellBack: code !== "en" && !c,
  };
}
