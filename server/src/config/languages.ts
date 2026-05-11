// Pinned from cookbook §"Supported languages" (openai.md:532).
// MUST stay in sync with client/src/config/languages.ts.
// See plans/reports/lang-probe-260511.md.

export const ALLOWED_LANGS = [
  "es", "pt", "fr", "ja", "ru", "zh", "de", "ko", "hi", "id", "vi", "it", "en",
] as const;

export type AllowedLang = (typeof ALLOWED_LANGS)[number];

export const LANGUAGE_LABELS: Record<AllowedLang, string> = {
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  ja: "Japanese",
  ru: "Russian",
  zh: "Chinese",
  de: "German",
  ko: "Korean",
  hi: "Hindi",
  id: "Indonesian",
  vi: "Vietnamese",
  it: "Italian",
  en: "English",
};

export function isAllowedLang(value: unknown): value is AllowedLang {
  return typeof value === "string" && (ALLOWED_LANGS as readonly string[]).includes(value);
}
