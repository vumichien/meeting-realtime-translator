# Project Changelog

All notable changes to Meeting Realtime Translator are documented here.

## [v0.2.0] — 2026-05-17

### Added

- SRT subtitle export (`.srt`) in transcript detail dialog — translation segments only, relative timestamps.
- SVG favicon for web client (`public/favicon.svg`, blue microphone icon).
- One-time **Get started** guided tour in the shared React renderer, covering translation controls, devices, providers, Setup Doctor, profiles, transcripts, and settings.

### Fixed

- Translation captions now flow as a continuous paragraph instead of one entry per line.
- Electron dev mode now allows the Vite React-refresh preamble under a dev-only CSP allowance, so the shared renderer loads for desktop smoke testing.
- Desktop app icon upgraded from 256×256 to 512×512 for crisp macOS Retina rendering.

### Changed

- Expanded translucent mode into a complete Liquid glass theme for the React shell.
  - New installs default to translucent on supported platforms; Linux Electron keeps solid default.
  - App shell, sidebar, headers, cards, dialogs, popovers, inputs, selects, tabs, and control bars share Mica-like tinting and Acrylic-like blur.
  - Added texture/grid depth, stronger borders, inner highlights, and `backdrop-filter` fallbacks.
- Rebuilt Remotion intro/app-info animations to mirror the real Translate screen.
  - Replaced `docs/_images/intro.gif` and `docs/_images/app-info.gif` with short white/neutral UI GIFs.

### Refactored

- Replaced vanilla-TS UI with React 19 + shadcn/ui sidebar shell.
  - Architecture: React 19 + Tailwind v4 + shadcn/ui sidebar. 7 screens. 14 hooks wrapping vanilla logic modules. 4-way theme (Light/Dark × Solid/Translucent).
  - Bundle: JS 153 kB gzip, CSS 7.5 kB gzip.

## [v0.2.0-rc.1] — 2026-05-15

### Added — v0.2 multi-provider

- Added `TranslationProvider` abstraction (`client/src/providers/`); OpenAI Realtime now resolves through a registry so adding a third backend is a single directory.
- Added Gemini Live as a second translation provider (opt-in, default stays OpenAI). Single-WebSocket transport with 16 kHz mic input and 24 kHz speaker output via `AudioWorklet`.
- Added Gemini AI Studio + Vertex AI auth modes. Server mints ephemeral tokens via `/providers/gemini/ephemeral-token`; service-account JSON is exchanged for an OAuth access token using `google-auth-library`.
- Added session-resume hot-handoff at T+13 min for Gemini's 15-min session cap. Old WS stays alive until WS #2 produces its first audio frame; listener gap ≤ 200 ms target.
- Added detected-source-language chip to source caption pane (Gemini auto-detects 97+ languages).
- Added rolling-latency warning banner (30 s median > 5 s warn, < 3 s clear) wired into the existing debug-metrics pipeline.
- Added per-provider settings UI: provider radio + Gemini config sub-panel (auth mode, key/service-account, voice).
- Added Electron `keyring:get/set/clear` IPC backed by a v2 typed JSON record encrypted via `safeStorage`. v0.1 single-key file migrates to `providerKeys.openai` on first launch.
- Added Electron CSP allowing Gemini WebSocket endpoints (`generativelanguage.googleapis.com`, `*.aiplatform.googleapis.com`) alongside existing OpenAI hosts.
- Added `docs/providers.md` provider comparison cheat sheet.

### Added — pre-v0.2

- Added Setup Doctor readiness checks for browser routing, mic signal, output routing, and virtual-cable-like devices.
- Added recoverable session issue messages for missing/invalid API keys, rate limits, mic disconnects, output routing failures, and WebRTC failures.
- Added redacted debug bundle v2 context: setup results, last issue, session duration, browser/platform, and safe request IDs.
- Added local transcript export as Markdown/TXT, separate from debug bundles.
- Added local meeting profiles for recurring language/device setups.
- Added session timer, rough cost estimate, warning threshold, and optional auto-stop guardrail.
- Added browser validation and Listener Mode research reports under the user-support plan.

## [v0.1.2] — 2026-05-14

### Added

- Added a universal macOS DMG release package for the desktop app, without Apple Developer ID signing or notarization.
- Added a macOS release workflow lane that uploads the DMG alongside Windows and Linux assets.
- Documented macOS desktop download, install, and not-notarized warning flow.

## [v0.1.1] — 2026-05-14

### Changed

- Simplified the desktop setup wizard device confirmation flow.
- Replaced the confusing cable test-tone step with a checkbox confirming the source mic is real and Babel Mic output is the virtual audio input/playback device.
- Updated Zoom/Meet guidance to say virtual audio for microphone, real headphones/speakers for output.
- Removed the anonymous-events choice from the onboarding finish step.
- Updated the non-tech user guide to match the new wizard flow.

### Release

- Published refreshed Windows installer and Linux AppImage.

## [v0.1.0] — 2026-05-11

### Added

- Initial browser app for real-time meeting translation.
- WebRTC translation pipeline powered by OpenAI Realtime Translation.
- Source and translated captions shown side by side.
- Audio device routing through virtual audio cable devices.
- Target-language picker with 13 target languages.
- Debug panel with connection state, latency, event log, VU meters, and redacted export.
- Local Express backend for minting short-lived OpenAI client secrets.
- Per-OS setup guides for Windows, macOS, and Linux.
- Troubleshooting, cost, architecture, roadmap, and code standards documentation.

### Desktop App

- Added Electron desktop shell for Babel Mic.
- Added first-run setup wizard for virtual cable, OpenAI key, device selection, and Zoom/Meet setup.
- Added OS-protected API key storage with Electron `safeStorage`.
- Added Windows and Linux packaging with GitHub Actions release workflow.

### Changed

- Tuned browser audio constraints to avoid stacking browser noise suppression with model noise reduction.
- Refactored debug panel helpers to keep modules under the 200-line guideline.
- Clarified cable direction across README, user guide, and OS setup guides.

### Fixed

- Fixed packaged desktop blank screen by building browser assets with relative paths.
- Fixed setup wizard checkbox alignment and button feedback.
- Improved debug bundle secret redaction.
- Auto-cleaned failed WebRTC sessions so users can start again without manual stop.
- Cleared VU meter retry interval on session unbind.

### Notes

- Browser support is Chrome/Edge only because the app needs `setSinkId`.
- Translation is one-way: your speech translates for the meeting. Other speakers are not translated yet.
- Mixed-language code-switching may still produce silence.
- Formal unit test suite remains planned work.
