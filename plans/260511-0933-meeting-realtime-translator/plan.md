---
title: "Meeting Realtime Translator (Web App + Virtual Audio Cable)"
status: implemented
priority: P1
created: 2026-05-11
slug: meeting-realtime-translator
source_report: plans/reports/brainstorm-260511-0933-meeting-realtime-translator.md
blockedBy: []
blocks: []
---

# Meeting Realtime Translator — Implementation Plan

Browser web app that translates user's Vietnamese speech to a target language in real-time via OpenAI `gpt-realtime-translate`, then routes translated audio into Zoom/Google Meet as the user's microphone via a virtual audio cable (VB-CABLE / BlackHole / PipeWire null sink).

**Brainstorm:** `plans/reports/brainstorm-260511-0933-meeting-realtime-translator.md`

## Architecture (one-liner)

`Mic → Browser WebRTC → OpenAI Realtime Translations → translated audio track → setSinkId(VB-CABLE) → Zoom/Meet mic input`. Tiny local Node backend mints short-lived client secrets from `OPENAI_API_KEY`. BYO key. Public OSS repo.

## Phases

| # | Phase | Status | Priority | Depends |
|---|-------|--------|----------|---------|
| 01 | [Repo Scaffold](phase-01-repo-scaffold.md) | completed | P1 | — |
| 02 | [Backend Session Endpoint](phase-02-backend-session-endpoint.md) | completed | P1 | 01 |
| 03 | [Client Session Core (WebRTC)](phase-03-client-session-core.md) | completed | P1 | 02 |
| 04 | [Audio Device Routing](phase-04-audio-device-routing.md) | completed | P1 | 03 |
| 05 | [Captions UI](phase-05-captions-ui.md) | completed | P1 | 03 |
| 06 | [Settings and API Key UX](phase-06-settings-and-api-key-ux.md) | completed | P1 | 04, 05 |
| 07 | [Observability Debug Panel](phase-07-observability-debug-panel.md) | completed | P2 | 06 |
| 08 | [Per-OS Audio Setup Docs](phase-08-per-os-audio-setup-docs.md) | completed | P2 | 06 |
| 09 | [Troubleshooting and Cost Docs](phase-09-troubleshooting-and-cost-docs.md) | completed | P2 | 06 |
| 10 | [README and Screenshots](phase-10-readme-and-screenshots.md) | completed | P2 | 06 |
| 11 | [Postinstall Device Check (Optional)](phase-11-postinstall-device-check.md) | pending | P3 | 10 |

Phases 01→06 sequential. 07/08/09/10 parallel after 06. Phase 11 YAGNI-flagged — only if early users hit "no output devices" support requests.

## Key Dependencies

- Node.js ≥ 20
- Chrome or Edge browser (setSinkId support)
- OpenAI API key with `gpt-realtime-translate` access
- Virtual audio cable: VB-CABLE (Win) / BlackHole (Mac) / PipeWire null sink (Linux)

## Success Criteria

- Speaking VI in real Zoom call, Japanese listener hears coherent JA with <3s latency.
- Fresh clone → translated audio in Zoom in <10 min following README only.
- Win+Mac validated; Linux documented.
- All code modules <200 lines. No secrets committed.
- README discloses cost/latency/browser-support realities honestly.

## Non-Goals (v1)

Two-way translation, multi-speaker source separation, glossary/term injection, Electron wrapper, hosted SaaS demo, mobile, external/vendor analytics.

> Note: local user-facing observability (debug panel showing connection state, event flow, latency) IS in scope — see phase 07. Nothing leaves the user's machine.

## Validation Log

### Session 1 — 2026-05-11
**Trigger:** `/ck-plan validate` invocation before implementation kickoff.
**Questions asked:** 8

#### Verification Results
- Tier: Full (11 phases) — but plan is greenfield, so Fact Checker / Contract Verifier roles apply only to external claims.
- Claims checked: 6 (endpoints, model names, package names, browser API claims)
- Verified: 5 — `https://api.openai.com/v1/realtime/translations/client_secrets` ✓, `/v1/realtime/translations/calls` ✓, model `gpt-realtime-translate` ✓, model `gpt-realtime-whisper` ✓, `concurrently` npm pkg ✓.
- Unverified: 1 — explicit 13 output language codes (`es,pt,fr,ja,ru,zh,de,ko,hi,id,vi,it,en`). `openai.md:53` confirms count, does not enumerate.

#### Questions & Answers

1. **[Assumptions]** 13 output language codes — verify or trust?
   - Options: Verify against live API first (Rec) | Trust as-is | Permissive 2-char allowlist
   - **Answer:** Verify against live API first
   - **Rationale:** Codifying a wrong allowlist surfaces as user-facing UX bug.

2. **[Risks]** API key storage in localStorage plaintext.
   - Options: localStorage + document (Rec) | sessionStorage | in-memory only | encrypt PBKDF2
   - **Answer:** localStorage plaintext, document the risk
   - **Rationale:** Local-only app; UX > marginal safety gain.

3. **[Scope]** Phase 11 postinstall device check status.
   - Options: Keep P3 backlog (Rec) | Delete | Promote to v1
   - **Answer:** Keep as P3 backlog with YAGNI gate
   - **Rationale:** Matches current plan; no v1 cost.

4. **[Architecture]** CORS origin config.
   - Options: Env `CLIENT_ORIGIN` default localhost:5173 (Rec) | Hardcode | Auto-read vite config
   - **Answer:** Env var with default
   - **Rationale:** One-line cost, prevents Vite port-change trap.

5. **[Tradeoffs]** `gpt-realtime-whisper` transcription always-on vs opt-in.
   - Options: Always on (Rec) | User-toggle | Off by default
   - **Answer:** User-toggle setting
   - **Rationale:** Save cost for users who don't want source captions; ship the toggle.

6. **[Assumptions]** Firefox setSinkId support (116+ added it).
   - Options: Keep "Not supported" for v1 (Rec) | Test FF | Drop restriction
   - **Answer:** Keep "Not supported" for v1, re-evaluate in v1.1
   - **Rationale:** Avoid QA scope creep; no v1 demand signal for Firefox.

7. **[Architecture]** In-app API key forwarding trust model.
   - Options: Accept Bearer from CORS allowlist (Rec) | .env only | warn if both set
   - **Answer:** Accept Bearer from CORS allowlist
   - **Rationale:** Matches plan; CORS already gates origin.

8. **[Architecture]** Caption flush timing constants.
   - Options: Lock inline (Rec) | Expose in settings UI | Per-language
   - **Answer:** Expose in settings UI
   - **Rationale:** User wants tuning surface; adds two settings keys + advanced controls.

#### Confirmed Decisions
- Pre-phase-02 probe step: call `client_secrets` endpoint per candidate code; pin the verified list in `languages.ts`.
- `OPENAI_API_KEY` and user-pasted key both flow through `/session`; in-app key wins when present.
- Add `CLIENT_ORIGIN` env var; default `http://localhost:5173`.
- Add `transcribeSource` toggle (default ON); omit `audio.input.transcription` payload when OFF.
- Add `captionsFlushIdleMs` (default 1500) and `captionsFlushOnPunctuation` (default true) settings; expose under an "Advanced" disclosure.
- Phase 11 stays P3 / YAGNI-gated.
- Firefox / Safari stay in "Not supported" matrix for v1.

#### Impact on Phases
- Phase 01: add `CLIENT_ORIGIN=http://localhost:5173` to `.env.example`.
- Phase 02: probe-and-pin language step before coding allowlist; read CORS origin from env; accept `transcribeSource` in request body and omit `transcription` config when false.
- Phase 05: read flush constants from settings; gracefully handle no source deltas when transcription disabled (source pane shows "(source captions disabled)").
- Phase 06: add "Show source captions" toggle (writes `mt.transcribe_source`); add Advanced section with caption flush idle ms + punctuation toggle; pass `transcribeSource` to `startSession` → `/session` POST.

#### Action Items
- [ ] Phase 02: add §"Step 0 — probe-and-pin output languages" before implementation; pin verified list in `server/src/config/languages.ts`.
- [ ] Phase 01/02: introduce `CLIENT_ORIGIN` env handling.
- [ ] Phase 02/05/06: wire `transcribeSource` toggle end-to-end.
- [ ] Phase 05/06: parameterize caption flush timing.

## Implementation Log

### Session 2 — 2026-05-11
**Trigger:** `/ck:cook --auto` completion of v1 phases 01–10.
**Delivered:** Phases 01–10 shipped. Phase 11 deferred per YAGNI gate.

**Summary:** Tight, modular TS monorepo. Server boots, `/health` returns 200, `/session` validates language allowlist + proxies upstream errors. Both workspaces typecheck clean. All modules ≤200 LOC (post-review: debug-panel.ts split). Code review applied all High-priority fixes: H1 redaction broadened, H3 auto-stop on failed, M2 retry interval cleared, M7 strict transcribeSource boolean. Ready for v0.1.0 tag.

**Code Review Report:** `plans/reports/code-review-260511-1007-meeting-realtime-translator.md`

**Post-Review Fixes Applied:**
- H1: `redactPayload` now case-insensitive, expanded pattern set (`/^(authorization|api[-_]?key|.*secret.*|.*token.*|bearer)$/i`).
- H3: Failed `pc` state auto-calls `stop()` in `app.ts`.
- M2: VU meter interval handle tracked and cleared on `unbindSession`.
- M7: `transcribeSource` uses strict `=== true` boolean check in `server/src/routes/session.ts`.
- Module-size: `debug-panel.ts` split into `debug-helpers.ts` + `debug-metrics.ts`.
