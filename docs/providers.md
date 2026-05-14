# Translation Providers

This app supports multiple translation backends behind a single `TranslationProvider` interface. The provider is chosen per session via Settings → **Translator engine**.

Verified: 2026-05-14.

## Side-by-side

| | **OpenAI Realtime** | **Gemini Live** |
|---|---|---|
| Status (in app) | Default, GA | Preview, opt-in |
| Transport | WebRTC (audio + data channel) | WebSocket (single bidi) |
| Auth | OpenAI API key (BYO) | AI Studio key **or** Vertex AI service account |
| Source language | Auto (70+ via Whisper) | Auto (97+) |
| Voice | Style-matched (model-controlled) | 5 prebuilt voices (Aoede, Puck, Charon, Kore, Fenrir) |
| Session length cap | None observed | 15 min — handled by hot-handoff at T+13 |
| Median latency | 1–3 s | 2–4 s (broadband) |
| Cost | $ per audio minute | $ per audio minute |
| Voice cloning | No | No |

## When to pick which

- **Default to OpenAI.** Lowest median latency, longest sessions, no handoff complexity.
- **Pick Gemini AI Studio** if you already have a Google AI Studio key and want to A/B compare voice character.
- **Pick Gemini Vertex AI** if your organization restricts to GCP-managed credentials (service account, no personal keys).

## Hot-handoff (Gemini only)

Gemini caps each Live session at 15 minutes. The adapter opens a second WebSocket at T+13 min using the latest `sessionResumptionUpdate.newHandle`, waits for its first audio frame, then swaps source and closes the old WS. Listener never hears a gap.

Failures surface as `SessionIssue` and stop the session cleanly rather than going silent.

## Adding a third provider

The contract is in `client/src/providers/types.ts`. To add provider `foo`:

1. Create `client/src/providers/foo/adapter.ts` implementing `TranslationProvider`.
2. Register a loader in `client/src/providers/registry.ts` (use dynamic import to keep the OpenAI-only bundle small).
3. If the provider needs server-side token minting, add a route under `server/src/routes/providers/`.
4. Settings UI: extend `client/src/ui/provider-picker.ts` labels.
