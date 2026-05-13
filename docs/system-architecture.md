# System Architecture

## Runtime Data Flow

## Desktop Distribution Layer

```
Electron main (desktop/)
├─ starts Express backend on 127.0.0.1 with PORT=0
├─ passes random server URL through preload
├─ stores API key through safeStorage-backed IPC
├─ opens first-run setup wizard until onboarding is complete
└─ loads the existing Vite client in dev or client/dist in packaged builds
```

The browser developer flow remains unchanged: `npm run dev` starts the server on
`127.0.0.1:8787` and the Vite client on `localhost:5173`. The desktop flow uses
the same renderer code, but `window.electron.serverUrl` makes session minting hit
the embedded random-port server directly.

```
┌─────────────────────────────────────────────────────────────────┐
│ User Workstation                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Browser (Chrome/Edge) ──────────────────────────────────┐  │
│  │                                                           │  │
│  │  ┌─ Microphone Input ──────────────────────────────┐    │  │
│  │  │ Real-time audio stream (any of 70+ languages)   │    │  │
│  │  └────────────────────┬──────────────────────────────┘    │  │
│  │                       │                                    │  │
│  │  ┌────────────────────▼──────────────────────────────┐    │  │
│  │  │ translation-session.ts                           │    │  │
│  │  │ • Establish WebRTC peer connection to OpenAI     │    │  │
│  │  │ • Send mic audio via input track                 │    │  │
│  │  │ • Receive translated audio on remote track       │    │  │
│  │  │ • Manage SDP/ICE negotiation                     │    │  │
│  │  └────────────────────┬──────────────────────────────┘    │  │
│  │                       │                                    │  │
│  │  ┌────────────────────▼──────────────────────────────┐    │  │
│  │  │ audio-devices.ts                                 │    │  │
│  │  │ • Query available microphones & speakers         │    │  │
│  │  │ • Route translated audio to virtual cable via    │    │  │
│  │  │   audioElement.setSinkId(virtualCableDeviceId)   │    │  │
│  │  │ • Detect device changes; refresh pickers         │    │  │
│  │  └────────────────────┬──────────────────────────────┘    │  │
│  │                       │                                    │  │
│  │  ┌────────────────────▼──────────────────────────────┐    │  │
│  │  │ Virtual Audio Cable (OS-dependent driver)        │    │  │
│  │  │ • Windows: VB-CABLE                              │    │  │
│  │  │ • macOS:   BlackHole                             │    │  │
│  │  │ • Linux:   PipeWire null sink                    │    │  │
│  │  └────────────────────┬──────────────────────────────┘    │  │
│  │                       │                                    │  │
│  │  ┌────────────────────▼──────────────────────────────┐    │  │
│  │  │ Zoom / Google Meet                               │    │  │
│  │  │ • Listens to virtual cable as if it's a mic     │    │  │
│  │  │ • Conference participants hear translated audio  │    │  │
│  │  └────────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  │  ┌─ Data Channels (captions) ──────────────────────┐    │  │
│  │  │ OpenAI sends:                                   │    │  │
│  │  │ • Source captions (what you said, auto-detected)│    │  │
│  │  │ • Target captions (what listeners hear)         │    │  │
│  │  │ captions.ts buffers and renders side-by-side    │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  │  ┌─ Debug Panel ───────────────────────────────────┐    │  │
│  │  │ Telemetry (connection state, latency, VU meter) │    │  │
│  │  │ Event log (SDP, ICE, audio-track callbacks)      │    │  │
│  │  │ Redacted debug bundle export for bug reports    │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                     │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │ HTTP / WebRTC                                           │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                     │
│        ┌─────────────────┴─────────────────┐                  │
│        │                                   │                  │
│  ┌─────▼──────────┐            ┌──────────▼────────┐         │
│  │ Local Backend  │            │ OpenAI Realtime   │         │
│  │ (Express)      │            │ Translation API   │         │
│  │                │            │ (HTTPS + WebRTC)  │         │
│  │ POST /session  │            │                   │         │
│  │ Mints ephemeral├────────────► Takes API key     │         │
│  │ client secret  │            │ Returns credentials         │
│  │ (never exposes │            │ Uses WebRTC for  │         │
│  │  API key to    │            │ audio + captions │         │
│  │  browser)      │            │                   │         │
│  └────────────────┘            └───────────────────┘         │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Session Lifecycle (State Diagram)

```
                        ┌───────────────┐
                        │   STOPPED     │ (initial)
                        │   • No PC     │
                        │   • No audio  │
                        └───────┬───────┘
                                │ user clicks "Start"
                                │
                        ┌───────▼───────────┐
                        │   CONNECTING      │
                        │ • Fetch /session  │ (get ephemeral credentials)
                        │   endpoint        │
                        │ • Create PC       │
                        │ • Add local track │
                        │ • Create offer    │
                        │ • Send to OpenAI  │
                        │ • Get answer SDP  │
                        │ • Set remote desc │
                        │ • Wait for ICE    │
                        └───────┬───────────┘
                                │ PC.connectionState === 'connected'
                                │
                        ┌───────▼─────────────────┐
                        │   RUNNING               │
                        │ • Audio flowing         │
                        │ • Captions streaming    │
                        │ • UI shows latency      │
                        │ • User hears translation│
                        └───────┬─────────────────┘
                                │
                 ┌──────────────┼──────────────┐
                 │              │              │
          user clicks      PC.connectionState PC.connectionState
          "Stop"       ===  'failed'       === 'disconnected'
                 │              │              │
          ┌──────▼──┐    ┌──────▼──┐    ┌─────▼──────┐
          │ STOPPED │    │ FAILED* │    │ DISCONNECTED
          │ (clean  │    │ (auto-  │    │ (auto-stop)*
          │  close) │    │  stop)* │    │ (reconnect)*
          └─────────┘    └─────────┘    └────────────┘
                 *After code review fixes v0.1.0
```

**Key transitions:**
- **Stopped → Connecting:** User clicks Start button. Browser requests ephemeral credentials from local server.
- **Connecting → Running:** WebRTC connection established. Audio and captions flowing.
- **Running → Failed/Disconnected:** Network loss, server close, or user stop. Auto-cleanup triggered on failed state (post-v0.1.0 fix).
- **Any → Stopped:** User clicks Stop or error forces cleanup. Idempotent state reset.

## Module Boundaries & Responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│                       app.ts (main)                            │
│                  Session lifecycle orchestration                │
│                  Event routing to UI components                 │
│                                                                 │
│  ┌──────────────────┐  ┌───────────────────┐  ┌─────────────┐ │
│  │ translation-     │  │ audio-devices.ts  │  │settings.ts  │ │
│  │ session.ts       │  │                   │  │             │ │
│  │                  │  │ • Query mics/     │  │ localStorage│ │
│  │ • WebRTC PC      │  │   speakers        │  │ • JSON      │ │
│  │ • ICE/SDP        │  │ • setSinkId()     │  │   encode    │ │
│  │ • Audio track    │  │ • Virtual cable   │  │ • Type-safe │ │
│  │ • Event channels │  │   detection       │  │            │ │
│  │ • Cleanup logic  │  │                   │  │             │ │
│  └──────────────────┘  └───────────────────┘  └─────────────┘ │
│                                                                 │
│  ┌────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │ captions.ts    │  │ debug-panel.ts  │  │ ui/* (buttons, │ │
│  │                │  │                 │  │ pickers)       │ │
│  │ • Delta buffer │  │ • Metrics viz   │  │                │ │
│  │ • Punctuation  │  │ • Event log     │  │ • Device       │ │
│  │   flush        │  │ • VU meter      │  │   selection    │ │
│  │ • Side-by-side │  │ • Redaction +   │  │ • Start/Stop   │ │
│  │   render       │  │   export        │  │ • Status       │ │
│  └────────────────┘  └─────────────────┘  └────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

     lib/* (utilities, no side effects)
     ├─ webrtc-sdp.ts (SDP answer parsing)
     ├─ event-buffer.ts (circular queue for telemetry)
     ├─ vu-meter.ts (audio analyser node)
     ├─ debug-bundle.ts (redacted session snapshot)
     ├─ debug-helpers.ts (formatting, escaping, string utils)
     └─ debug-metrics.ts (latency tracker)
```

## Backend Routes

```
┌────────────────────────────────────────────────────────┐
│ Express Server (server/src/index.ts)                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  GET /health                                          │
│  ├─ Purpose: Liveness check                          │
│  └─ Response: { ok: true }                           │
│                                                        │
│  POST /session                                        │
│  ├─ Auth: Bearer token (OpenAI API key)              │
│  ├─ Body: { transcribeSource?: boolean }             │
│  ├─ Handler: mintTranslationClientSecret()           │
│  │  • Calls OpenAI /client_secrets endpoint          │
│  │  • Returns ephemeral credentials (24h TTL)        │
│  │  • Never exposes API key to browser               │
│  │                                                    │
│  ├─ Success: {                                       │
│  │   client_secret: { value: "cs_...", expires_at } │
│  │ }                                                 │
│  │                                                    │
│  └─ Error (401): {                                   │
│      error: "no_api_key" | "invalid_key"            │
│    }                                                 │
│                                                        │
│  CORS: Pinned to CLIENT_ORIGIN (default: localhost)  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Data Types & Contracts

### Session State (app.ts)
```typescript
type SessionState = 'stopped' | 'connecting' | 'running' | 'failed' | 'disconnected'

interface TranslationSession {
  start(apiKey: string, sourceLanguage: string, targetLanguage: string): Promise<void>
  stop(): Promise<void>
  state: SessionState
  latency: number // milliseconds (RTT estimate)
}
```

### Captions (shared via data channel)
```typescript
interface SessionEvent {
  type: 'session.started' | 'session.updated' | 'input_transcript.delta' | 'response_transcript.delta' | ...
  index?: number
  delta?: { type: 'text_delta', text: string }
  ...
}
```

### Settings (localStorage)
```typescript
interface Settings {
  sourceMicId: string     // selected microphone device ID
  outputSpeakerId: string // virtual cable device ID
  targetLanguage: string  // e.g., 'en', 'es', 'fr'
  sourceTranscription: boolean
  captionFlushIdleMs: number
  captionFlushOnPunctuation: boolean
}
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Local backend mints ephemeral credentials** | API key never reaches browser. CORS boundary enforces single-user trust. |
| **Virtual audio cable required** | `setSinkId()` only way to route audio to meeting app. No in-app audio injection. |
| **Captions via data channel** | Low latency + independent from main audio track. |
| **Shared AudioContext singleton** | Browser resource constraint. Context reused across session cycles safely. |
| **Settings in localStorage** | Simple, no backend persistence. Trade-off: TLS not required for local backend. |
| **Debug panel inline in app** | No DevTools dependency. Real-time metrics + export for bug reports. |
| **13-language allowlist** | OpenAI's early Realtime Translation supports these; others error. Hardcoded to fail fast. |

## Performance Considerations

| Metric | Target | Achieved |
|--------|--------|----------|
| Audio latency | <3s typical | ✓ 1–3s observed (network + model) |
| Caption latency | <500ms | ✓ ~200–400ms (data channel) |
| VU meter refresh | 60 Hz | ✓ 60 Hz (RAF loop) |
| Event buffer | 200-event circular | ✓ Overflows auto-rotated |
| Memory footprint | <50 MB | ✓ Estimated ~30–40 MB (PC + contexts) |

## Security Boundaries

- **API key confinement:** Server-only. Browser never sees raw key.
- **CORS origin pinning:** Only `localhost:5173` (or configured `CLIENT_ORIGIN`) can request `/session`.
- **Redaction on export:** Debug bundle strips `Authorization`, `apiKey`, `client_secret`, tokens, and heuristically suspicious strings before export.
- **Local-only assumption:** No public deployment. If remote, API key in `.env` is at risk.
- **XSS prevention:** Captions use `textContent`, never `innerHTML`.

## Future Extensions (Post-v1)

- **Bidirectional translation:** Other speaker's language → your language (requires meeting API integration).
- **Voice cloning:** Match translated voice to speaker profile (OpenAI research).
- **Multi-language auto-detection:** Detect code-switching and adapt source language dynamically.
- **Formal test suite:** Unit + E2E tests for stability/regression coverage.
