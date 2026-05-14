// Provider registry. OpenAI is statically imported (the default path); Gemini
// is dynamic-imported so OpenAI-only users keep a 0 KB bundle delta.
import { openaiProvider } from "./openai/adapter";
import type { ProviderId, TranslationProvider } from "./types";

type Loader = () => Promise<TranslationProvider> | TranslationProvider;

const loaders: Record<ProviderId, Loader> = {
  openai: () => openaiProvider,
  // Phase 02 registers the real loader; default stub fails clearly.
  gemini: async () => {
    const mod = await import("./gemini/adapter");
    return mod.create();
  },
};

const cache = new Map<ProviderId, TranslationProvider>();

export async function getProvider(id: ProviderId): Promise<TranslationProvider> {
  const cached = cache.get(id);
  if (cached) return cached;
  const loader = loaders[id];
  if (!loader) throw new Error(`Unknown provider id: ${id}`);
  const provider = await loader();
  cache.set(id, provider);
  return provider;
}

export function listProviders(): ProviderId[] {
  return Object.keys(loaders) as ProviderId[];
}
