# Development Roadmap

## v0.1.0 Completion Summary

**Release date:** 2026-05-11

All 10 core phases completed + Phase 11 deferred. Code review applied 3 High-severity fixes before tagging.

| Phase | Status | Completion | Summary |
|-------|--------|------------|---------|
| **Phase 01** | ✓ Done | 2026-05-11 | Repo scaffold (npm workspaces, Vite, Express, TypeScript) |
| **Phase 02** | ✓ Done | 2026-05-11 | Backend session endpoint (/session, ephemeral credentials minting) |
| **Phase 03** | ✓ Done | 2026-05-11 | Client WebRTC session core (peer connection, SDP/ICE, audio track management) |
| **Phase 04** | ✓ Done | 2026-05-11 | Audio device routing (mic picker, speaker picker, virtual cable detection, setSinkId) |
| **Phase 05** | ✓ Done | 2026-05-11 | Captions UI (source + target side-by-side, delta buffering, punctuation flush) |
| **Phase 06** | ✓ Done | 2026-05-11 | Settings + API key UX (localStorage persistence, password field, language picker) |
| **Phase 07** | ✓ Done | 2026-05-11 | Observability debug panel (connection state, latency, VU meter, event log, redacted export) |
| **Phase 08** | ✓ Done | 2026-05-11 | Per-OS audio setup docs (Windows VB-CABLE, macOS BlackHole, Linux PipeWire) |
| **Phase 09** | ✓ Done | 2026-05-11 | Troubleshooting + cost docs (17 symptom entries, language/latency/pricing matrix) |
| **Phase 10** | ✓ Done | 2026-05-11 | README + screenshots (quickstart, architecture diagram, caveats, roadmap) |
| **Phase 11** | ⊘ Deferred | — | Postinstall device auto-detection (YAGNI for v1) |

## v0.1.0 Code Review Fixes Applied

**Reviewer:** code-reviewer (staff-eng adversarial pass)
**Report:** `plans/reports/code-review-260511-1007-meeting-realtime-translator.md`

Three High-severity fixes applied pre-tag:

1. **H1 — Debug bundle redaction broadened** (`client/src/lib/debug-bundle.ts`)
   - Case-insensitive key matching for `Authorization`, `authorization`, `apiKey`, `api_key`, etc.
   - Expanded allowlist from hard-coded 3 keys → regex pattern + heuristic length check.
   - Prevents credential leaks when users paste debug bundles in GitHub issues.

2. **H3 — Failed state auto-cleanup** (`client/src/app.ts`)
   - On `connectionState === 'failed'`, auto-call `stop()` instead of silent no-op.
   - Prevents stale `currentHandle` from blocking next Start attempt.

3. **M2 — VU meter interval cleanup** (`client/src/debug-panel.ts`)
   - Track and clear bind-session retry interval on unbind.
   - Prevents wasteful polling on closed peer connection.

Additional improvements:
- Extracted `debug-helpers.ts` from `debug-panel.ts` to comply with <200 LOC rule.
- Verified 100% strict TypeScript + no unhandled secrets in logs.

## v1.0 Roadmap (Post-v0.1.0)

Planned features + polish for public release:

### Phase 12: Bidirectional Translation (High Priority)
- Detect other speakers' language (e.g., English in Vietnamese meeting).
- Translate their speech → Vietnamese so you understand.
- Requires: meeting API integration (Zoom API, Google Meet API) for speaker detection.
- Estimated effort: 3 phases.

### Phase 13: Voice Cloning / Style Matching (Medium Priority)
- Current: OpenAI adapts tone/pitch but doesn't replicate identity.
- Goal: Speaker profile enrollment; translated voice recognizable as yours.
- Requires: OpenAI voice cloning API (if released).
- Estimated effort: 1–2 phases.

### Phase 14: Multi-Language Auto-Detection (Medium Priority)
- Detect code-switching (Vietnamese + English in one utterance).
- Auto-switch source language mid-session.
- Risk: May increase latency or degrade captions.
- Estimated effort: 2 phases.

### Phase 15: Unit Test Suite (High Priority)
- Target: 80%+ coverage on core modules.
- Focus: session lifecycle, device picker edge cases, settings encode/decode.
- Tool: Vitest or Jest.
- Estimated effort: 2 phases.

### Phase 16: Linux Validation Pass (Medium Priority)
- Test on additional distros (Fedora, Arch, Debian variants).
- Document PipeWire quirks + fallback to ALSA/PulseAudio.
- Estimated effort: 1 phase.

### Phase 17: Re-evaluate Firefox 116+ setSinkId Support (Low Priority)
- Firefox 116+ may have implemented `setSinkId`.
- If confirmed, extend browser support matrix.
- Estimated effort: <1 phase (research-only).

### Phase 18: User Feedback Loop (Ongoing)
- Collect via GitHub issues, Discord, email.
- Prioritize pain points: latency, cost, device detection, language support.

### Phase 19: Postinstall Device Detection Script (Backlog)
- Originally Phase 11, deferred as YAGNI.
- Progressed through Babel Mic desktop setup wizard: first-run virtual cable detection + Zoom/Meet guidance now lives in app.
- Remaining: real installer postinstall hook still deferred.
- Estimated effort: 1 phase.

### Phase 20: Documentation Polish (Backlog)
- Add inline code comments for complex logic (SDP parsing, redaction heuristics).
- Create architecture diagrams (Excalidraw / Mermaid).
- Video tutorial for macOS/Windows setup.

## Success Metrics (v0.1.0)

| Metric | Target | Status |
|--------|--------|--------|
| Core pipeline working | ✓ | ✓ Verified end-to-end |
| Captions side-by-side | ✓ | ✓ Tested with live audio |
| Device routing (setSinkId) | ✓ | ✓ Chrome + Edge only (documented) |
| Settings persistence | ✓ | ✓ localStorage working |
| All code <200 LOC per file | ✓ | ✓ Refactored debug-panel.ts |
| Security: no secrets in code | ✓ | ✓ Redaction verified |
| OS setup docs (3 platforms) | ✓ | ✓ Windows, macOS, Linux complete |
| Troubleshooting (17 symptoms) | ✓ | ✓ All documented |
| Code review passed | ✓ | ✓ 3 High fixes applied |

## Known Limitations (v0.1.0)

| Limitation | Impact | Workaround / Timeline |
|-----------|--------|---------------------|
| Unidirectional translation | Other speakers not translated | Phase 12 (v1.0) |
| Style-matched, not cloned | Translated voice not identical | Phase 13 (v1.0) |
| Code-switching produces silence | Mixed-language utterances fail | Phase 14 (v1.0) |
| Firefox/Safari unsupported | ~20% browser share locked out | Phase 17 (TBD) |
| No formal test suite | Regression risk on updates | Phase 15 (v1.0) |
| Limited Linux distro testing | PipeWire quirks undocumented | Phase 16 (v1.0) |
| Postinstall device detection | Users must manually configure Zoom | Phase 19 (backlog) |

## Release Schedule (Estimated)

- **v0.1.0:** 2026-05-11 ✓ (shipped)
- **v0.2.0:** 2026-06-01 (bug fixes + M2/M7 edge-case polish)
- **v1.0:** 2026-08-01 (Phases 12–15, test suite, bidirectional translation)
- **v1.1+:** Ongoing (feedback-driven features, browser support expansion)

## Contributing & Roadmap Feedback

PRs welcome. If you'd like to tackle one of the above phases, open an issue first to coordinate with maintainers. Phases marked "High Priority" are most likely to be merged quickly.

See [`code-standards.md`](code-standards.md) for development conventions and [`CLAUDE.md`](../CLAUDE.md) for orchestration workflows.
