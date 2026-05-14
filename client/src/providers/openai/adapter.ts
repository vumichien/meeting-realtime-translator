import { startOpenAiSession } from "./webrtc-session";
import type {
  ProviderCapabilities,
  ProviderSession,
  StartSessionOptions,
  TranslationProvider,
} from "../types";

const capabilities: ProviderCapabilities = {
  sessionResumeHandoff: false,
  autoDetectsSourceLang: false,
};

export const openaiProvider: TranslationProvider = {
  id: "openai",
  capabilities,
  async startSession(opts: StartSessionOptions): Promise<ProviderSession> {
    return startOpenAiSession({
      targetLanguage: opts.targetLanguage,
      micDeviceId: opts.micDeviceId,
      outputDeviceId: opts.outputDeviceId,
      apiKey: opts.apiKey,
      transcribeSource: opts.transcribeSource,
      micEnv: opts.micEnv,
      onEvent: opts.onEvent,
      onRawEvent: opts.onRawEvent,
      onStateChange: opts.onStateChange,
      onRecoverableIssue: opts.onRecoverableIssue,
      onError: opts.onError,
    });
  },
};

export function create(): TranslationProvider {
  return openaiProvider;
}
