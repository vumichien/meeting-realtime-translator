// Mirrors server/src/config/languages.ts.
// Source-of-truth: cookbook §"Supported languages" (openai.md:532).
// Keep both files in sync — see plans/reports/lang-probe-260511.md.

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
