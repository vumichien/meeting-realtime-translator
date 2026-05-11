# Codebase Summary

Complete file inventory of Meeting Realtime Translator v0.1.0. One line per file: path — purpose.

## Root Configuration

- `package.json` — npm workspaces config + shared scripts + dependencies.
- `package-lock.json` — lock file (not currently committed; see L4 in code review).
- `tsconfig.json` — base TypeScript strict config; extends to workspaces.
- `.env.example` — template for server config (OPENAI_API_KEY, PORT, CLIENT_ORIGIN).
- `.gitignore` — excludes `.env`, `node_modules`, build artifacts.
- `README.md` — quickstart, architecture diagram, repo structure, roadmap.
- `CLAUDE.md` — development workflows, conventions, documentation standards.
- `LICENSE` — MIT license.

## Client Workspace (`client/`)

### Root Files
- `client/package.json` — Vite config, dev/build scripts, dependencies (React, TypeScript, Tailwind).
- `client/tsconfig.json` — strict TypeScript for browser.
- `client/index.html` — HTML entry point; loads main.ts and mounts to #app.
- `client/vite.config.ts` — Vite config; proxies `/session` + `/health` to backend.
- `client/tailwind.config.ts` — Tailwind CSS theme, spacing, colors.

### Source (`client/src/`)
- `client/src/main.ts` — Entry point; imports app.ts and renders.
- `client/src/app.ts` — Main app component. Orchestrates session lifecycle, device pickers, captions, debug panel. Controls state transitions (stopped → connecting → running → failed).
- `client/src/types.ts` — Shared type definitions (SessionEvent, Settings, DeviceInfo, MintResult, etc.).
- `client/src/translation-session.ts` — Encapsulates WebRTC session to OpenAI. Manages peer connection, data channels, audio playout, lifecycle state.
- `client/src/audio-devices.ts` — Queries available microphones/speakers; detects virtual cable presence; handles setSinkId errors.
- `client/src/captions.ts` — Buffers and renders source/target caption deltas. Flushes on punctuation or idle timeout.
- `client/src/settings.ts` — Type-safe localStorage encode/decode for user preferences (mic, speaker, language, UI toggles).
- `client/src/debug-panel.ts` — UI widget: connection state, latency, VU meters, event log, redacted debug bundle export.

### UI Submodules (`client/src/ui/`)
- `client/src/ui/device-pickers.ts` — Dropdown selectors for source mic + output speaker (virtual cable).
- `client/src/ui/controls.ts` — Start/Stop buttons, loading states, disabled logic.
- `client/src/ui/status.ts` — Status banner (connection state, errors, latency).

### Config Submodule (`client/src/config/`)
- `client/src/config/languages.ts` — 13-language target-output allowlist (English, Spanish, French, Vietnamese, etc.). Source is auto-detected by the model from 70+ languages. Shared with server.

### Library Utilities (`client/src/lib/`)
- `client/src/lib/debug-bundle.ts` — Captures session state (connection, events, settings) with redacted secrets for bug reports.
- `client/src/lib/debug-helpers.ts` — Utility functions for debug panel: `formatDuration`, `median`, `percentile`, `metricCell`, `safeStringify`, `escapeHtml`, `truncate`.
- `client/src/lib/debug-metrics.ts` — Tracks latency, VU meter peaks, connection state transitions.
- `client/src/lib/event-buffer.ts` — Circular buffer (200-event capacity) for session events, auto-rotates on overflow.
- `client/src/lib/vu-meter.ts` — Analyser node wrapper; samples audio amplitude for VU display. Singleton AudioContext.
- `client/src/lib/webrtc-sdp.ts` — SDP answer parsing utility. Extracts mid/stats from OpenAI's response.

### Styles (`client/src/`)
- `client/src/styles.css` — Global Tailwind + custom CSS. VU bar, captions layout, debug panel grid.

## Server Workspace (`server/`)

### Root Files
- `server/package.json` — Express, TypeScript, dev/build scripts.
- `server/tsconfig.json` — strict TypeScript for Node.js.

### Source (`server/src/`)
- `server/src/index.ts` — Express app setup. Loads `.env` config. CORS pinned to `CLIENT_ORIGIN`. Mounts `/session` + `/health` routes. Listens on `PORT`.
- `server/src/types.ts` — Shared type definitions (MintResult, MintFailure).

### Routes (`server/src/routes/`)
- `server/src/routes/session.ts` — POST `/session` endpoint. Accepts Bearer token. Calls `mintTranslationClientSecret` and returns ephemeral OpenAI credentials.

### Config (`server/src/config/`)
- `server/src/config/languages.ts` — 13-language allowlist (identical to client).

### Library (`server/src/lib/`)
- `server/src/lib/openai-client.ts` — OpenAI API client. Implements `mintTranslationClientSecret(apiKey, transcribeSource)`. Handles optional transcription block in session config.

## Scripts (`scripts/`)
- `scripts/dev.sh` — Bash script; starts both client (Vite) + server (ts-node) in parallel.
- `scripts/dev.ps1` — PowerShell equivalent of dev.sh for Windows.

## Documentation (`docs/`)
- `docs/setup-windows.md` — VB-CABLE installation + Zoom/Meet configuration for Windows.
- `docs/setup-macos.md` — BlackHole 2ch installation + Zoom/Meet configuration for macOS.
- `docs/setup-linux.md` — PipeWire null sink creation + Zoom/Meet configuration for Linux.
- `docs/troubleshooting.md` — 17 symptom entries (connection failed, silent audio, lag, device not detected, etc.) with root causes + fixes.
- `docs/cost-and-limits.md` — OpenAI pricing breakdown, latency ranges, language + browser support matrices.
- `docs/_images/README.md` — Placeholder for screenshots (app-main.png, etc.).
- `docs/project-overview-pdr.md` — Product definition, browser/OS support, non-goals, constraints.
- `docs/code-standards.md` — Development conventions (naming, module size, types, security, comments).
- `docs/codebase-summary.md` — This file.
- `docs/system-architecture.md` — Runtime data flow, session lifecycle, module boundaries.
- `docs/development-roadmap.md` — Project phases 1–11 with completion dates + post-v1 backlog.
- `docs/project-changelog.md` — Change history starting with v0.1.0 entry.

## Plans & Design History (`plans/`)
- `plans/260511-0933-meeting-realtime-translator/plan.md` — Overview + 11 phases + success criteria.
- `plans/260511-0933-meeting-realtime-translator/phase-0X-*.md` — Detailed phase documents (design, requirements, implementation steps).
- `plans/reports/brainstorm-*.md` — Brainstorming notes.
- `plans/reports/code-review-*.md` — Code review findings (3 High-severity fixes applied).
- `plans/reports/lang-probe-*.md` — Language API probe results.

## Key Dependencies

### Client
- **react:** UI framework.
- **typescript:** Strict type checking.
- **vite:** Build tool + dev server.
- **tailwindcss:** Utility-first CSS.

### Server
- **express:** HTTP framework.
- **dotenv:** Load `.env` config.
- **typescript + ts-node:** Run TS directly; type check via tsc.
- **axios:** HTTP client for OpenAI API calls (or node-fetch if lighter).

## Lines of Code (Approx.)

| Component | LOC | Notes |
|-----------|-----|-------|
| Client TypeScript | ~900 | Largest: debug-panel.ts (with extracted helpers) ~280 LOC after refactor. |
| Server TypeScript | ~150 | Minimal. |
| Styles (CSS) | ~150 | Tailwind + custom VU bar, captions, debug panel. |
| **Total source** | **~1,200** | Excludes config, node_modules. |

## Architecture Snapshot

```
Browser (React)
  ├─ app.ts (orchestration)
  ├─ translation-session.ts (WebRTC ↔ OpenAI)
  ├─ captions.ts (UI deltas)
  ├─ audio-devices.ts (mic/speaker routing)
  ├─ settings.ts (localStorage)
  ├─ debug-panel.ts (telemetry + redacted export)
  └─ ui/* (buttons, pickers, status)

Server (Express)
  ├─ /session (mint ephemeral OpenAI credentials)
  └─ /health (liveness check)

OpenAI Realtime Translation
  ├─ WebRTC data channels
  └─ Translated audio track
```

See `system-architecture.md` for detailed data flow + session lifecycle.
