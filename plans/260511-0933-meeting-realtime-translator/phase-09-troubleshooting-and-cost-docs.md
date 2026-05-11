---
phase: 9
title: "Troubleshooting and Cost Docs"
status: completed
priority: P2
effort: "2h"
dependencies: [6]
---

# Phase 09: Troubleshooting and Cost Docs

## Overview
Two cross-OS reference docs: `troubleshooting.md` (symptom → likely cause → fix) and `cost-and-limits.md` (honest pricing, latency, language matrix, browser support). Critical for public release credibility.

## Requirements

**Functional**
- `docs/troubleshooting.md` covers ≥15 documented symptoms
- `docs/cost-and-limits.md` with pricing pointers (link to OpenAI), latency expectations, language matrix (input + output supported), browser matrix
- Both docs cross-linked from README and from per-OS setup docs

**Non-functional**
- <500 lines each
- No marketing tone; brutally honest

## Architecture

```
docs/
├── troubleshooting.md   # symptom-based lookup
│     ## App won't start
│     ## No audio reaches Zoom
│     ## Translation captions empty
│     ## Wrong language detected
│     ## Audio cuts mid-sentence
│     ## High latency / lag
│     ## ...
└── cost-and-limits.md   # honest expectations
      ## Pricing
      ## Latency reality (1-3s typical)
      ## Supported input languages (70+)
      ## Supported output languages (13)
      ## Browser support (Chrome/Edge only)
      ## Known model limitations
```

## Related Code Files

**Create**
- `docs/troubleshooting.md`
- `docs/cost-and-limits.md`

## Implementation Steps

### Troubleshooting entries (minimum set)

| Symptom | Likely cause | Fix |
|---|---|---|
| `npm run dev` fails on Windows | PowerShell exec policy | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Server: "Missing OPENAI_API_KEY" | `.env` not loaded | Copy `.env.example` → `.env`, paste key, restart server |
| Browser: "setSinkId unsupported" | Using Firefox/Safari | Switch to Chrome or Edge |
| Output device dropdown empty | Mic permission not granted | Click "Grant mic access", reload |
| "CABLE Input" not in output list | VB-CABLE not installed or not running as audio device | Reinstall, reboot |
| Zoom hears nothing | Zoom mic set to physical mic, not CABLE Output | Settings → Audio → Microphone → "CABLE Output" |
| Zoom hears original VI voice | Mic not muted at OS level OR Zoom still on physical mic | Confirm Zoom mic = CABLE Output |
| Captions show source but no target | API tier doesn't have `gpt-realtime-translate` access | Check OpenAI account model access |
| Captions empty entirely | Microphone not selected or muted | Source mic dropdown — pick correct device |
| Audio plays through speakers instead of CABLE | setSinkId failed silently | Reload, re-select output device |
| 401 from `/session` | Invalid OpenAI API key | Re-paste key in app or `.env` |
| 429 from upstream | OpenAI rate limit | Wait; retry after a minute |
| Translation audio cuts during target-lang words | Expected model behavior | Stay in source language; documented in cost-and-limits.md |
| High latency (>5s) | Network / OpenAI region distance | Test on different network; accept 1-3s baseline |
| Echo in other participants' ears | User's headphones are leaking into mic OR monitoring CABLE Input | Switch to closed headphones; disable monitoring |
| Translated voice sounds robotic | Background noise; near_field noise reduction not enough | Quieter room, closer mic |
| Hot-swapping mic during session breaks audio | Browser limitation | Stop, change device, start again |

### Cost and limits content

1. **Pricing** — link to `https://openai.com/pricing` (don't quote $/min in repo, it'll go stale). Say "metered per audio minute; budget accordingly for long meetings".
2. **Latency** — typical 1-3s end-to-end source-speech → translated-speech. Worst case 5s under poor network. Captions slightly faster than audio.
3. **Input languages** — list all 70+ from cookbook §"Supported languages".
4. **Output languages** — list all 13 with codes (ES, PT, FR, JA, RU, ZH, DE, KO, HI, ID, VI, IT, EN).
5. **Browser matrix:**
   | Browser | WebRTC | setSinkId | Verdict |
   |---|---|---|---|
   | Chrome ≥120 | ✅ | ✅ | Supported |
   | Edge ≥120 | ✅ | ✅ | Supported |
   | Brave latest | ✅ | ✅ | Likely works (untested) |
   | Firefox | ✅ | partial | Not supported |
   | Safari | ✅ | ❌ | Not supported |
6. **Known model limitations:**
   - No custom prompts, glossaries, or pronunciation guides (cookbook §"Test terminology")
   - Mixed-language speech may produce silence (cookbook §"Account for mixed-language speech")
   - Voice is style-matched, not cloned
   - Names/proper nouns can be substituted incorrectly
   - No turn-based conversation state — pure stream-in/stream-out

### Implementation Steps (for the doc files)

1. Write `docs/troubleshooting.md` as a table-of-contents top + one `### Symptom` heading per entry. Each entry: Cause / Fix / (optional) Verify.
2. Write `docs/cost-and-limits.md` per outline above. Pull language lists from cookbook source (avoid retyping errors).
3. Cross-link from per-OS docs and from README.

## Success Criteria

- [x] Troubleshooting doc has ≥15 entries covering the realistic failure surface
- [x] Cost doc lists all 13 output langs accurately, 70+ input langs (or links to OpenAI source)
- [x] Browser matrix matches reality (manually verified in at least Chrome + one alternative)
- [x] No "$X/min" hardcoded prices — links to OpenAI only
- [x] Each doc <500 lines

## Risk Assessment

- **Pricing drift** — by not quoting prices, doc stays accurate; minor friction for users to look up.
- **Language list drift** — OpenAI may add/remove. Pin source: cookbook in `openai.md`; doc references it.
- **Troubleshooting overconfidence** — entries should say "likely" not "always". Edge cases exist.
