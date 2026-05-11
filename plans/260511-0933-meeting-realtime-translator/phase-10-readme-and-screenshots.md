---
phase: 10
title: "README and Screenshots"
status: completed
priority: P2
effort: "3h"
dependencies: [6]
---

# Phase 10: README and Screenshots

## Overview
Public-facing README — the only doc users will read first. Quickstart, honest caveats, screenshots of app + per-OS audio config. Determines whether the repo lands or bounces.

## Requirements

**Functional**
- README.md at repo root
- 5-minute quickstart that works for someone with: a clone, Node 20, Chrome, an OpenAI key, willingness to install one virtual cable
- Screenshots: app main UI, Windows Zoom setup, macOS Zoom setup
- Section linking to per-OS docs, troubleshooting, cost-and-limits
- Brutally honest "caveats" section near top: cost, latency, Chrome-only, BYO key

**Non-functional**
- <500 lines (long-form OK but cap at project rule)
- Render correctly on GitHub
- All internal links work
- All shell commands tested verbatim

## Architecture

README outline:

```
# Meeting Realtime Translator
<one-line tagline>
<demo screenshot or gif>

## What it does
<3-5 bullets, plain English>

## Caveats (read before installing)
- Costs OpenAI tokens (~$X/min order of magnitude, see docs/cost-and-limits.md)
- 1-3s latency typical
- Chrome / Edge only
- BYO OpenAI API key
- Backend must run on your machine only (do not deploy publicly)
- Translated voice is style-matched, not a clone

## Quickstart (5 minutes)
1. Install virtual audio cable (link to docs/setup-<os>.md)
2. Clone, install, configure key
3. Configure Zoom/Meet mic
4. Run app, pick devices, start translating

## How it works
<minimal diagram + 3-sentence explanation>

## Repo structure
<tree, 10 lines max>

## Roadmap (post-v1)
- Two-way translation
- Linux validation
- ...

## License / Contributing / Links
```

## Related Code Files

**Create**
- `README.md` (repo root)
- `docs/_images/app-main.png` — app screenshot showing captions + controls
- `docs/_images/win-zoom-audio.png` — Zoom Settings → Audio with CABLE Output picked
- `docs/_images/mac-zoom-audio.png` — same for macOS
- `docs/_images/architecture.png` — simple diagram (can use the ASCII art from brainstorm, exported as image)
- `docs/_images/captions-demo.gif` (optional, v1.1 if time)

**Modify**
- `docs/setup-windows.md`, `setup-macos.md`, `setup-linux.md` — replace screenshot placeholders with real paths

## Implementation Steps

1. Take screenshots:
   - App in active session showing source + target captions and a meaningful target language
   - Windows Zoom audio settings panel with CABLE Output selected
   - macOS Zoom audio settings panel with BlackHole 2ch selected
   - Save to `docs/_images/`, optimize PNGs (≤200KB each)
2. Render architecture diagram. Options:
   - Export ASCII art from brainstorm via `/ck:mermaidjs-v11` skill to Mermaid → PNG, OR
   - Hand-draw in Excalidraw and export PNG
   Save as `docs/_images/architecture.png`.
3. Write README per outline. Voice: terse, factual, no marketing fluff. Match the cookbook's tone.
4. Caveats section MUST appear in the first scroll on GitHub (above the fold). This is the single most important UX call in the repo — it filters out users who won't tolerate the realities.
5. Quickstart numbered steps; each step links to its detailed doc.
6. Test every command in README on a clean clone:
   ```bash
   git clone <repo>
   cd meeting-auto-translate
   npm install
   cp .env.example .env  # edit
   npm run dev
   ```
7. Verify GitHub-rendered preview by pushing to a fork branch; check that images load, links resolve, headings nest correctly.
8. Add badges (optional, low effort): MIT license, Node ≥20, "Powered by OpenAI Realtime Translation".

## Success Criteria

- [x] A first-time visitor reading only the README understands: what it does, what it costs, what it requires, how to start
- [x] Quickstart runs verbatim on a clean Windows machine in ≤10 minutes
- [x] Same on macOS
- [x] All 4 screenshots present and rendered correctly on GitHub
- [x] All internal links resolve (no 404s)
- [x] Caveats section above the fold on default GitHub viewport
- [x] No marketing fluff; no emoji-spam; no "✨ now with AI ✨"

## Risk Assessment

- **Screenshots rot** — OS / Zoom UI changes will date them. Date stamp in caption "as of 2026-05". Plan annual refresh.
- **GitHub markdown quirks** — table alignment, mermaid blocks. Test rendered output, don't trust local preview.
- **Overpromise/underdeliver** — temptation to make the README sound polished. Resist. Honesty about latency and Chrome-only is the differentiator vs vapor.
- **Architecture diagram bitrots** — kept in repo as PNG. Re-export when architecture changes.
