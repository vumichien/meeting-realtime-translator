# Code Standards & Development Conventions

This document codifies conventions used across the Meeting Realtime Translator codebase. Follow these for any new contributions.

## File Organization & Naming

- **Kebab-case** for all JavaScript/TypeScript filenames. Long, self-documenting names are preferred: `debug-bundle.ts`, `event-buffer.ts`, `translation-session.ts`.
- **Directories:** Group by feature or concern (`lib/`, `ui/`, `config/`, `routes/`).
- **One class/type per module** unless logically paired (e.g., types and their helpers).

## Module Size & Complexity

- **Maximum 200 lines of code per file.** Hard rule.
- If exceeding: extract helpers, utilities, or sub-modules into separate files.
- Modules under 200 LOC are preferred for readability and testing.
- **Examples:** `debug-panel.ts` was initially ~362 LOC; helpers extracted to `debug-helpers.ts` to comply.

## TypeScript & Type Safety

- **Strict mode enabled** in both `client/` and `server/` workspaces (`tsconfig.json`).
- **No `any` casts** except for browser APIs not yet in `lib.dom` (e.g., `(audio as any).setSinkId`). For those, prefer a single ambient declaration file (`audio.d.ts`) over scattered casts.
- **Discriminated unions** for error handling: `MintResult | MintFailure` pattern. Prevents null/undefined surprises.
- **Defensive type guards:** Check unknown data before use. Example: `(event as { delta: string }).delta` in captions parsing.

## Error Handling

- **Try/catch idempotent:** All cleanup paths wrapped; can be called multiple times safely.
- **State flags for cleanup:** Use a `stopped` flag to prevent double-cleanup on repeated stop calls.
- **Errors on console:** Log via `console.error()` + `console.warn()`. No silent failures.

## Security & Secrets

- **Never log raw secrets.** Redact API keys, Bearer tokens, ephemeral secrets before logging or bundling debug info.
- **Case-insensitive key matching** in redaction: `Authorization`, `authorization`, `apiKey`, `api_key`, `client_secret`, etc.
- **Credential-like string heuristic:** Strings longer than 20 chars matching `^[A-Za-z0-9_\-]{20,}$` treated as potentially sensitive.
- **No secrets in git:** `.env*` ignored. Commit `.env.example` only.
- **Local-only trust model:** Backend assumes single user, same machine. No public deployment.

## Async & Resource Management

- **Cleanup on stop:** Close audio elements, disconnect nodes, cancel RAF loops, clear intervals.
- **RAF/interval handles:** Store and cancel to prevent memory leaks across session cycles.
- **Shared AudioContext:** Singleton pattern OK for browser resource constraints. Document intent in comments.
- **Avoid side effects in `populate()`:** Don't fire callbacks on initial mount unless necessary for UX.

## UI & DOM

- **Text safety:** Use `textContent`, never `innerHTML` for user-controlled data. Prevents XSS.
- **Event delegation:** Prefer event listeners on stable parent elements over inline handlers.
- **State coupling:** Minimize DOM-state queries in logic. Use explicit state flags instead of reading `disabled` attributes.
- **Naming:** UI files in `ui/` subdir. Examples: `device-pickers.ts`, `controls.ts`, `status.ts`.

## Comments & Documentation

- **Comment the WHY, not the WHAT.** Code is readable; explain non-obvious design decisions.
- **High-risk code:** Justify cryptic logic, heuristics, workarounds. Example: "Mixed-language speech may produce silence on code-switch; this is a model limitation."
- **Cross-references:** Link to related modules or external docs (OpenAI cookbook, W3C specs) where helpful.

## Data Flow & Architecture

- **WebRTC session lifecycle:** Captured in `translation-session.ts`. Encapsulates all state transitions.
- **Settings persistence:** Typed encode/decode with explicit branches for strings, numbers, booleans. No loose coercion.
- **Captions state:** Separate from session state. Pushed incrementally via deltas; flushed on punctuation or idle timeout.
- **Debug telemetry:** Optional; does not affect session correctness. Redacted before export.

## Testing & Verification

- **No formal test suite in v1.** Acceptable per plan.
- **Manual edge-case validation:** Click Start twice rapidly → second click swallowed (safe). Network disconnect → status updates (correct).
- **Type coverage:** 100% strict TypeScript. Type errors block compile.
- **Linting:** Not mandatory; readability + style guide + peer review substitutes.

## Build & Deployment

- **Vite for client:** HMR in dev, optimized bundles in prod.
- **Express for server:** Minimal setup. CORS pinned to `CLIENT_ORIGIN` (default: `localhost:5173`). Rate limiting not included (local-only assumption).
- **Environment variables:** Loaded via `.env` at server startup. No runtime changes.
- **npm workspaces:** Root `package.json` manages `client/` + `server/` as a monorepo. Commands: `npm --workspace client run dev`, etc.

## Principles (YAGNI / KISS / DRY)

- **YAGNI (You Aren't Gonna Need It):** No speculative features. Example: Phase 11 (postinstall device detection) deferred until evidence of need.
- **KISS (Keep It Simple, Stupid):** Prefer straightforward code over clever abstractions. Single responsibility per module.
- **DRY (Don't Repeat Yourself):** Extract repeated logic into utilities. Example: `safeStringify`, `escapeHtml` in `debug-helpers.ts`.

## Contribution Checklist

- [ ] File under 200 LOC; split if needed.
- [ ] Kebab-case naming.
- [ ] Strict TypeScript; no unchecked `any`.
- [ ] Secrets redacted in logs/exports.
- [ ] Cleanup paths are idempotent.
- [ ] Comments explain WHY, not WHAT.
- [ ] Related docs (README, architecture) are updated if behavior changes.
- [ ] No console warnings/errors left in final commit.
