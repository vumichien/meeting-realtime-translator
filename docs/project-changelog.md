# Project Changelog

All notable changes to Meeting Realtime Translator are documented here.

## [Unreleased] — 2026-05-14

### Added

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
