# Codebase Summary

Complete file inventory of Meeting Realtime Translator. One line per file: path — purpose.

## Root Configuration

- `package.json` — npm workspaces config + shared scripts + dependencies.
- `tsconfig.json` — base TypeScript strict config; extends to workspaces.
- `.env.example` — template for server config (OPENAI_API_KEY, PORT, CLIENT_ORIGIN).
- `.gitignore` — excludes `.env`, `node_modules`, build artifacts.
- `README.md` — quickstart, architecture diagram, repo structure, roadmap.
- `CLAUDE.md` — development workflows, conventions, documentation standards.
- `LICENSE` — MIT license.

## Client Workspace (`client/`)

### Root Files

- `client/package.json` — Vite config, dev/build scripts, React 19 + Tailwind + shadcn deps.
- `client/tsconfig.json` — strict TypeScript for browser; no legacy excludes.
- `client/index.html` — single `<div id="app">` + `src/main.tsx` script. Legacy `#app-react` and old `main.ts` removed.
- `client/vite.config.ts` — Vite config; proxies `/session`, `/health`, `/providers` to backend.
- `client/tailwind.config.ts` — Tailwind CSS theme, spacing, colors; shadcn CSS variables.
- `client/components.json` — shadcn/ui component registry config.

### Entry Point (`client/src/`)

- `client/src/main.tsx` — React 19 entry; mounts `<AppShell>` into `#app` via `createRoot`.
- `client/src/types.ts` — Shared type definitions (SessionEvent, ApiKeyProvider, SessionIssue, etc.).
- `client/src/settings.ts` — Type-safe localStorage encode/decode for user preferences.
- `client/src/audio-devices.ts` — Queries available mics/speakers; detects virtual cable; handles setSinkId errors.
- `client/src/captions.ts` — React-friendly caption store; subscribers notified on delta append/clear.
- `client/src/electron-api.d.ts` — TypeScript ambient type for `window.electron` IPC bridge.
- `client/src/webrtc-sdp.ts` — SDP answer parsing utility. Extracts mid/stats from OpenAI response.

### React Shell (`client/src/components/`)

- `client/src/components/shell/app-shell.tsx` — Root layout: sidebar + content pane router. 7 named routes.
- `client/src/components/shell/sidebar-nav.tsx` — shadcn `Sidebar` navigation with icons per screen.
- `client/src/components/onboarding/get-started-tour.tsx` — One-time Joyride tour mounted at the shared renderer shell.
- `client/src/components/onboarding/get-started-tour-steps.ts` — Stable tour selectors, target views, and concise first-run copy.
- `client/src/components/onboarding/get-started-tour-storage.ts` — Typed settings helpers for tour completion/version persistence.
- `client/src/components/theme/theme-provider.tsx` — React context wrapping CSS variable–based 4-way theme (Light/Dark × Solid/Liquid glass), defaulting to translucent on supported platforms.
- `client/src/components/theme/theme-toggle.tsx` — Dropdown to switch active theme variant.
- `client/src/components/ui/` — shadcn/ui primitives: button, card, dialog, dropdown-menu, input, label, scroll-area, select, separator, sidebar, switch, tabs, textarea, toggle, tooltip.

### Screens (`client/src/screens/`)

Seven screens, each a focused React subtree — no cross-screen imports.

- `client/src/screens/translate/translate-screen.tsx` — primary session screen: start/stop, captions canvas, status indicator, cost estimate.
- `client/src/screens/translate/captions-canvas.tsx` — live source + translated caption rows, auto-scroll.
- `client/src/screens/translate/compact-control-bar.tsx` — language picker + mic-env toggle + start/stop button.
- `client/src/screens/translate/first-run-hero.tsx` — first-run empty state with quick-start steps.
- `client/src/screens/devices/devices-screen.tsx` — mic + speaker device selection with permission banner.
- `client/src/screens/devices/device-select.tsx` — single device dropdown row.
- `client/src/screens/devices/permissions-banner.tsx` — mic-permission prompt banner.
- `client/src/screens/devices/test-output-button.tsx` — play tone to verify output routing.
- `client/src/screens/providers/providers-screen.tsx` — provider cards (OpenAI, Gemini, Local-coming-soon).
- `client/src/screens/providers/provider-card.tsx` — individual provider tile with status badge.
- `client/src/screens/providers/provider-config-dialog.tsx` — per-provider settings dialog shell.
- `client/src/screens/providers/openai-config-form.tsx` — API key input + validation for OpenAI.
- `client/src/screens/providers/gemini-config-form.tsx` — auth-mode tabs + Vertex inputs for Gemini.
- `client/src/screens/providers/local-coming-soon.tsx` — placeholder card for future local provider.
- `client/src/screens/diagnostics/diagnostics-screen.tsx` — Setup Doctor + latency chart + event log.
- `client/src/screens/diagnostics/setup-doctor-panel.tsx` — readiness check results with run button.
- `client/src/screens/diagnostics/latency-chart.tsx` — rolling latency sparkline.
- `client/src/screens/diagnostics/debug-event-log.tsx` — filterable event list + "Copy redacted bundle" button.
- `client/src/screens/profiles/profiles-screen.tsx` — list + CRUD for named meeting profiles.
- `client/src/screens/profiles/profile-card.tsx` — single profile row with apply/rename/delete actions.
- `client/src/screens/profiles/profile-form-dialog.tsx` — new/edit profile dialog.
- `client/src/screens/transcripts/transcripts-screen.tsx` — session transcript history list.
- `client/src/screens/transcripts/transcript-card.tsx` — single history entry with metadata.
- `client/src/screens/transcripts/transcript-detail-dialog.tsx` — full-text view + export (MD/TXT).
- `client/src/screens/settings/settings-screen.tsx` — tabbed settings: appearance, captions, guardrails, about.
- `client/src/screens/settings/appearance-section.tsx` — color mode + surface style toggles.
- `client/src/screens/settings/captions-section.tsx` — source transcription toggle + font scale.
- `client/src/screens/settings/guardrails-section.tsx` — session-length warning + auto-stop config.
- `client/src/screens/settings/about-section.tsx` — version, links, open-source credits.

### Hooks (`client/src/hooks/`)

Thin reactive adapters over vanilla logic modules; no DOM manipulation.

- `client/src/hooks/_registry.ts` — singleton instances of all core stores (settings, apiKey, transcript, captions, latency). Survives Vite HMR via `globalThis ??=`.
- `client/src/hooks/index.ts` — barrel re-export of all hooks.
- `client/src/hooks/use-session.ts` — session lifecycle (idle → connecting → connected → failed). Calls provider API directly; owns start/stop logic for React UI.
- `client/src/hooks/use-captions.ts` — live caption snapshots via `useSyncExternalStore`.
- `client/src/hooks/use-devices.ts` — available mic/speaker lists + current selection.
- `client/src/hooks/use-settings.ts` — reactive settings read/write bound to `settings` singleton.
- `client/src/hooks/use-api-key.ts` — API key get/set/validate with Electron keyring fallback.
- `client/src/hooks/use-transcript.ts` — current session transcript segments.
- `client/src/hooks/use-transcript-history.ts` — past-session history CRUD from localStorage.
- `client/src/hooks/use-providers.ts` — active provider id + registered provider metadata.
- `client/src/hooks/use-setup-doctor.ts` — runs Setup Doctor checks; exposes results reactively.
- `client/src/hooks/use-debug.ts` — debug open-toggle + latency state (from latency singleton).
- `client/src/hooks/use-guardrails.ts` — session-length warning threshold + auto-stop state.
- `client/src/hooks/use-profiles.ts` — meeting profile list CRUD; persists via settings.

### Config (`client/src/config/`)

- `client/src/config/languages.ts` — 13-language target-output allowlist. Shared intent with server.

### Library Utilities (`client/src/lib/`)

Pure logic modules; no React, no DOM.

- `client/src/lib/debug-bundle.ts` — Builds a redacted JSON debug bundle (settings, events, state); strips secrets, device IDs, and opaque tokens.
- `client/src/lib/api-key-provider.ts` — Reads/writes API key from localStorage + Electron safeStorage keyring.
- `client/src/lib/setup-doctor.ts` — 4-check readiness suite: browser routing, mic signal, output routing, virtual-cable detection.
- `client/src/lib/transcript-store.ts` — Session transcript accumulator (begin/append/end/clear/snapshot).
- `client/src/lib/transcript-export.ts` — Exports transcript store snapshot as Markdown or TXT string.
- `client/src/lib/transcript-history.ts` — Persists completed sessions to localStorage; CRUD + size cap.
- `client/src/lib/meeting-profiles.ts` — Profile data model: create, rename, validate, find-missing-devices.
- `client/src/lib/latency-warning.ts` — 30-second rolling-median warning emitter; 5 s warn / 3 s clear thresholds.
- `client/src/lib/session-error-messages.ts` — Classifies caught errors into typed `SessionIssue` with user-facing messages + recovery actions.
- `client/src/lib/browser-capabilities.ts` — Runtime feature flags: setSinkId support, AudioWorklet, etc.
- `client/src/lib/virtual-cable-detect.ts` — Heuristic label matching to identify virtual audio cable devices.
- `client/src/lib/mic-env-detect.ts` — Detects ambient noise environment (quiet room vs. noisy) from mic signal.
- `client/src/lib/vu-meter.ts` — Analyser-node wrapper; samples audio amplitude for VU display. Singleton AudioContext.
- `client/src/lib/utils.ts` — `cn()` Tailwind class-merge helper (clsx + tailwind-merge).
- `client/src/lib/use-media-query.ts` — `useMediaQuery` hook for responsive breakpoints.
- `client/src/lib/use-keyboard-shortcut.ts` — Global keyboard shortcut hook (e.g. Space = start/stop).

### Styles (`client/src/styles/`)

- `client/src/styles/globals.css` — Tailwind directives + shadcn CSS variable tokens for Light/Dark × Solid/Liquid glass themes, including Mica-like foundations, Acrylic-like panels, texture, blur, borders, and solid fallbacks.

### Providers (`client/src/providers/`)

- `client/src/providers/types.ts` — `TranslationProvider`, `ProviderSession`, capabilities, `SessionIssue`.
- `client/src/providers/registry.ts` — provider id → factory; OpenAI eager, Gemini dynamic-imported.
- `client/src/providers/openai/webrtc-session.ts` — WebRTC session to OpenAI Realtime Translation; manages peer connection, data channels, audio playout, lifecycle state.
- `client/src/providers/openai/adapter.ts` — thin `TranslationProvider` wrapper for OpenAI.
- `client/src/providers/gemini/adapter.ts` — Gemini Live `TranslationProvider`; spins up worklets, WS, hot-handoff.
- `client/src/providers/gemini/live-client.ts` — raw WebSocket BidiGenerateContent protocol wrapper.
- `client/src/providers/gemini/session-resume.ts` — 13-min hot-handoff state machine.
- `client/src/providers/gemini/audio-input-worklet.ts` — 48k → 16k PCM16 mic downsampler.
- `client/src/providers/gemini/audio-output-worklet.ts` — 24k PCM16 → MediaStream output player.
- `client/src/providers/gemini/audioworklet.d.ts` — ambient typings for AudioWorkletGlobalScope.
- `client/src/providers/gemini/translation-prompt.ts` — system-instruction builder.
- `client/src/providers/gemini/caption-mapper.ts` — Gemini events → `CaptionEvent`.
- `client/src/providers/gemini/ephemeral-token.ts` — calls local backend to mint Live token.

## Server Workspace (`server/`)

### Root Files

- `server/package.json` — Express, TypeScript, dev/build scripts.
- `server/tsconfig.json` — strict TypeScript for Node.js.

### Source (`server/src/`)

- `server/src/index.ts` — Express app setup. Loads `.env` config. CORS pinned to `CLIENT_ORIGIN`. Mounts routes. Listens on `PORT`.
- `server/src/types.ts` — Shared type definitions (MintResult, MintFailure).

### Routes (`server/src/routes/`)

- `server/src/routes/session.ts` — POST `/session`; mints ephemeral OpenAI client secret.
- `server/src/routes/providers/gemini-ephemeral.ts` — POST `/providers/gemini/ephemeral-token` (AI Studio + Vertex).

### Config (`server/src/config/`)

- `server/src/config/languages.ts` — 13-language target allowlist (identical intent to client).

### Library (`server/src/lib/`)

- `server/src/lib/openai-client.ts` — `mintTranslationClientSecret(apiKey, transcribeSource)`.
- `server/src/lib/gemini-client.ts` — AI Studio token-mint REST client.
- `server/src/lib/gemini-auth.ts` — Vertex OAuth token-mint via `google-auth-library`.

## Desktop Workspace (`desktop/`)

Electron shell wrapping the client Vite output.

- `desktop/src/main.ts` — Electron main process; creates `BrowserWindow`, loads `client/dist/index.html`.
- `desktop/src/window.ts` — Window creation with Mica/vibrancy effect (Win11/macOS); CSP for OpenAI + Gemini WS endpoints.
- `desktop/src/preload.ts` — `contextBridge` exposing `window.electron` IPC API.
- `desktop/src/ipc-api-key.ts` — `keyring:get/set/clear` IPC handlers backed by `secure-store`.
- `desktop/src/secure-store.ts` — v2 `providerKeys` keyring + v1→v2 migration via `safeStorage`.
- `desktop/src/telemetry.ts` — opt-in Posthog telemetry (session.started, session.ended, error.session).
- `desktop/src/onboarding/` — First-run setup wizard (router + step screens + styles).

## Remotion Workspace (`remotion/`)

- `remotion/package.json` — Remotion preview/render scripts for intro MP4/GIF and app-info MP4/GIF.
- `remotion/src/index.ts` — Remotion entry point; registers the composition root.
- `remotion/src/remotion-root.tsx` — `IntroVideo` and `AppInfoVideo` composition metadata, dimensions, FPS, and duration.
- `remotion/src/design-tokens.ts` — Shared white/neutral UI tokens, surfaces, timing helpers, and layout constants for the Remotion intro.
- `remotion/src/intro-video.tsx` — Shared scene timeline for the short product intro animation.
- `remotion/src/app-info-video.tsx` — App-info composition using the intro timeline with longer final hold/copy.
- `remotion/src/scenes/title-scene.tsx` — shadcn-style Babel Mic shell opening scene.
- `remotion/src/scenes/tagline-scene.tsx` — source-to-translation caption motion scene.
- `remotion/src/scenes/flow-scene.tsx` — mic-to-realtime-to-cable-to-meeting routing scene.
- `remotion/src/scenes/features-scene.tsx` — Setup Doctor readiness checklist scene.
- `remotion/src/scenes/outro-scene.tsx` — final real Translate screen state.

## Scripts (`scripts/`)

- `scripts/dev.sh` — starts client (Vite) + server (ts-node) in parallel.
- `scripts/dev.ps1` — PowerShell equivalent for Windows.

## Documentation (`docs/`)

- `docs/setup-windows.md` — VB-CABLE installation + Zoom/Meet configuration.
- `docs/setup-macos.md` — BlackHole 2ch + Zoom/Meet configuration.
- `docs/setup-linux.md` — PipeWire null sink + Zoom/Meet configuration.
- `docs/troubleshooting.md` — 17-symptom entry guide with root causes + fixes.
- `docs/cost-and-limits.md` — OpenAI pricing, latency ranges, language + browser support matrices.
- `docs/providers.md` — Provider comparison + when-to-use cheat sheet.
- `docs/project-overview-pdr.md` — Product definition, browser/OS support, non-goals, constraints.
- `docs/code-standards.md` — Development conventions (naming, module size, types, security).
- `docs/codebase-summary.md` — This file.
- `docs/system-architecture.md` — Runtime data flow, session lifecycle, module boundaries.
- `docs/development-roadmap.md` — Project phases with completion dates + post-v1 backlog.
- `docs/project-changelog.md` — Change history.

## Plans & Design History (`plans/`)

- `plans/260511-0933-meeting-realtime-translator/` — Original 11-phase implementation plan.
- `plans/260516-1604-ui-refactor-sidebar-shadcn/` — 8-phase React + shadcn sidebar shell refactor plan.
- `plans/260517-0825-remotion-intro-gif-redesign/` — Remotion intro/app-info GIF redesign plan.
- `plans/reports/` — Code reviews, brainstorming notes, language probe results.

## Key Dependencies

### Client

- **react 19** — UI framework with concurrent rendering.
- **@radix-ui / shadcn-ui** — Accessible component primitives.
- **react-joyride** — One-time guided tour overlay for first-run app orientation.
- **tailwindcss v4** — Utility-first CSS with CSS variable tokens.
- **vite** — Build tool + dev server.
- **typescript** — Strict type checking.
- **@fontsource/inter** — Self-hosted Inter typeface.

### Server

- **express** — HTTP framework.
- **dotenv** — Load `.env` config.
- **google-auth-library** — Vertex AI OAuth.
- **typescript + ts-node** — Run TS directly.

## Architecture Snapshot

```
Browser (React 19 + shadcn sidebar shell)
  ├─ AppShell            — layout + sidebar routing (7 screens)
  ├─ Screens             — Translate, Devices, Providers, Diagnostics,
  │                         Profiles, Transcripts, Settings
  ├─ Hooks (reactive)    — useSession, useCaptions, useDevices,
  │                         useSettings, useApiKey, useProfiles, …
  ├─ _registry           — singleton logic stores (HMR-safe globalThis)
  └─ Logic modules       — providers/*, lib/*, audio-devices, captions,
                            settings (no React dependency)

Server (Express)
  ├─ /session                        — mint ephemeral OpenAI credentials
  ├─ /providers/gemini/ephemeral-token — mint Gemini Live token
  └─ /health                         — liveness check

Desktop (Electron)
  ├─ BrowserWindow (Mica/vibrancy)   — loads client/dist/
  ├─ window.electron IPC             — keyring, telemetry
  └─ onboarding wizard               — first-run setup flow
```

See `system-architecture.md` for detailed data flow + session lifecycle.

## Lines of Code (Approx.)

| Component | LOC | Notes |
|-----------|-----|-------|
| Client TypeScript/TSX | ~4,500 | 7 screens + 14 hooks + providers + lib. |
| Server TypeScript | ~200 | Minimal. |
| Styles (CSS) | ~180 | globals.css only; all legacy styles.css deleted. |
| **Total source** | **~4,900** | Excludes config, node_modules. |
