export interface CostEstimate {
  minutes: number;
  translationUsd: number;
  transcriptionUsd: number;
  totalUsd: number;
}

// OpenAI published GPT-Realtime-Translate at $0.034/min and
// GPT-Realtime-Whisper at $0.017/min on 2026-05-07.
const TRANSLATE_USD_PER_MINUTE = 0.034;
const WHISPER_USD_PER_MINUTE = 0.017;

export function estimateSessionCost(
  durationMs: number,
  sourceCaptionsEnabled: boolean,
): CostEstimate {
  const minutes = Math.max(0, durationMs / 60_000);
  const translationUsd = minutes * TRANSLATE_USD_PER_MINUTE;
  const transcriptionUsd = sourceCaptionsEnabled ? minutes * WHISPER_USD_PER_MINUTE : 0;
  return {
    minutes,
    translationUsd,
    transcriptionUsd,
    totalUsd: translationUsd + transcriptionUsd,
  };
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, durationMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatUsd(value: number): string {
  if (value < 0.01) return "<$0.01";
  return `$${value.toFixed(2)}`;
}
