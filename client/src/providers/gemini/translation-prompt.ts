// Builds the Gemini Live system instruction for streaming translation.
// Gemini auto-detects the source language; we instruct it to speak only the
// target language with preserved tone.

const LANG_LABELS: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  vi: "Vietnamese",
  ko: "Korean",
  zh: "Chinese",
  fr: "French",
  de: "German",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  ar: "Arabic",
  hi: "Hindi",
};

export function targetLangLabel(code: string): string {
  return LANG_LABELS[code] ?? code;
}

export function buildTranslationPrompt(targetLangCode: string): string {
  const target = targetLangLabel(targetLangCode);
  return [
    `You are a live simultaneous-interpretation engine.`,
    `Detect the speaker's source language automatically.`,
    `Translate everything they say into ${target}.`,
    `Speak ONLY ${target}. Never speak the source language back to the user.`,
    `Preserve tone, register, emphasis, and pacing as closely as possible.`,
    `If the speaker switches into ${target}, paraphrase faithfully — do not echo verbatim.`,
    `Do not add commentary, do not announce "translating", do not summarize.`,
    `Translate fragment by fragment as the speaker talks; do not wait for full sentences.`,
  ].join(" ");
}
