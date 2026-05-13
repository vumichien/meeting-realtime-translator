# Project Overview & Product Definition

## What is it

Meeting Realtime Translator is a browser-based WebRTC application that captures your microphone, translates speech in real time via OpenAI's Realtime Translation API, and routes the translated audio back to Zoom/Meet as your microphone input. Users speak any of 70+ supported source languages — the model auto-detects what you say — and meeting participants hear the chosen target language.

## Product Positioning

- **Core value:** Speak in your language. Meeting hears you in theirs. No setup beyond installing a virtual audio cable.
- **Audience:** Solo users needing accessible real-time translation for remote work. Personal use only.
- **Trust model:** Local-only backend + BYO OpenAI key. No data leaves your machine except to OpenAI's API.

## Technology Stack

- **Frontend:** Vite + React + TypeScript. Runs in Chrome/Edge only (requires `setSinkId`).
- **Backend:** Express + TypeScript. Mints short-lived OpenAI client secrets; never exposes API key to browser.
- **Audio routing:** Babel Mic uses the real microphone as source and plays translated audio into the virtual cable playback side. Zoom/Meet uses the cable recording side as microphone and keeps speakers/headphones as normal output.
- **Translation:** OpenAI Realtime Translation API (WebRTC over HTTPS).

## Browser & OS Support

| Platform | Supported | Notes |
|----------|-----------|-------|
| Chrome / Edge (Windows) | ✓ | VB-CABLE required |
| Chrome / Edge (macOS) | ✓ | BlackHole 2ch required |
| Chrome / Edge (Linux) | ✓ | PipeWire null sink required |
| Firefox | ✗ | `setSinkId` not implemented (v1) |
| Safari | ✗ | `setSinkId` not implemented (v1) |

Languages supported: 70+ source languages (auto-detected) → 13 target output languages. See [`cost-and-limits.md`](cost-and-limits.md) for the full matrix.

## Explicit Non-Goals (v1)

- **Bidirectional translation** — only your speech → meeting language. Not yet: other speaker's language → your language.
- **Voice cloning** — translated voice is style-matched (tone/pitch adapted), not a replica of your voice.
- **Deployment to cloud** — server must run locally only. No public-internet deployment.
- **Formal test suite** — acceptable for v1; unit tests planned for v1.1+.
- **Postinstall device auto-detection** — Phase 11 deferred. Manual setup required (see per-OS docs).
- **Mid-utterance code-switching** — mixing your source language with the chosen target language in one utterance may produce silence during the target-language segment.

## Key Constraints

- **Cost:** Metered by OpenAI. ~$0.10/hour at typical rates. See [`cost-and-limits.md`](cost-and-limits.md).
- **Latency:** 1–3s typical. 5s+ on poor networks. Not real-time; announced by the model as "near real-time."
- **No voice cloning:** Tone/pitch adapted but no voice identity matching.
- **Local trust boundary only:** If deployed remotely, API key may leak. Single-user + same-machine assumption only.

## Setup Time & Complexity

- OS audio cable install: 2–5 minutes per platform.
- Git clone + npm install: ~1 minute.
- OpenAI API key setup: 2 minutes (if you have an account).
- **Total:** ~10 minutes for experienced users. ~20 minutes first-time.

## What Ships in v0.1.0

✓ Phases 1–10 complete. Phase 11 (postinstall device check) deferred as YAGNI.

- ✓ Core WebRTC translation pipeline
- ✓ Captions UI (source + target side-by-side)
- ✓ Audio device picker + output routing
- ✓ Settings persistence (localStorage, TLS-safe)
- ✓ Debug panel (connection state, latency, VU meters, event log, copy-redacted debug bundle)
- ✓ Per-OS setup docs (Windows, macOS, Linux)
- ✓ Troubleshooting guide (17 common symptoms)
- ✓ Cost/language/latency matrix + browser support table
- ✓ Code review: 3 High-severity fixes applied (redaction broadening, auto-stop on failed state, VU meter interval cleanup)

## Related Documents

- **Setup:** [`setup-windows.md`](setup-windows.md), [`setup-macos.md`](setup-macos.md), [`setup-linux.md`](setup-linux.md)
- **Usage & troubleshooting:** [`troubleshooting.md`](troubleshooting.md)
- **Cost & language support:** [`cost-and-limits.md`](cost-and-limits.md)
- **Architecture:** [`system-architecture.md`](system-architecture.md)
- **Codebase:** [`codebase-summary.md`](codebase-summary.md)
