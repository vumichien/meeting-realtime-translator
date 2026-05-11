---
phase: 2
title: "Backend Session Endpoint"
status: completed
priority: P1
effort: "2h"
dependencies: [1]
---

# Phase 02: Backend Session Endpoint

## Overview
Single Express route that mints short-lived OpenAI Realtime Translation client secrets. API key never leaves backend. Validates target language against allowlist.

## Requirements

**Functional**
- `POST /session` with `{ targetLanguage: string, transcribeSource?: boolean }` → returns `{ client_secret, expires_at }`
- Validate `targetLanguage` against verified output-language allowlist; reject others with 400
- When `transcribeSource === false`, omit `audio.input.transcription` from upstream payload
- `OPENAI_API_KEY` read from `.env`; clear error if missing
- `GET /health` → 200 (for liveness check)

**Non-functional**
- Source files <200 lines
- Logs the upstream OpenAI status code on failure (no secret echoing)
- CORS origin read from env `CLIENT_ORIGIN` (default `http://localhost:5173`)

<!-- Updated: Validation Session 1 - CORS via env, transcribeSource toggle, verified allowlist -->

## Architecture

```
[Browser POST /session {targetLanguage}]
        │
        ▼
[server/src/routes/session.ts]
   ├─ validate lang against ALLOWED_LANGS
   ├─ fetch OpenAI /v1/realtime/translations/client_secrets
   │   body: { session: { model, audio: {input, output} } }
   ├─ return { client_secret, expires_at }
   └─ on error: log + 4xx/5xx
```

`ALLOWED_LANGS` is the **verified output-language list** produced by Step 0 below. Brainstormed candidate list (13 codes) is `["es","pt","fr","ja","ru","zh","de","ko","hi","id","vi","it","en"]` — must be probe-verified before being pinned. <!-- Validation Session 1: openai.md confirms count (13) but not the codes; verify against live API. -->

## Related Code Files

**Create**
- `server/src/routes/session.ts` (session mint logic)
- `server/src/config/languages.ts` (ALLOWED_LANGS array + label map)
- `server/src/lib/openai-client.ts` (thin fetch wrapper around translations endpoint)

**Modify**
- `server/src/index.ts` (mount router, json body parser, env validation on boot)

## Implementation Steps

0. **Probe-and-pin output languages** (run once, before coding the allowlist). For each candidate ISO 639-1 code (start with the 13 brainstormed + a few extras like `tr`, `pl`, `ar`, `nl`), POST to `https://api.openai.com/v1/realtime/translations/client_secrets` with `audio.output.language` set to that code. Record which return 200 vs 400. Commit the verified subset to `server/src/config/languages.ts`. Document the probe results in `plans/reports/lang-probe-260511.md`. <!-- Validation Session 1 -->
1. Add `server/src/config/languages.ts` exporting `ALLOWED_LANGS` (verified from Step 0) and `LANGUAGE_LABELS` (e.g. `ja: "Japanese"`).
2. Add `server/src/lib/openai-client.ts` with `mintTranslationClientSecret({ targetLanguage, transcribeSource, apiKey })` that POSTs to `https://api.openai.com/v1/realtime/translations/client_secrets` with the session payload from `openai.md` §"Create the translation client secret".
3. Session payload — include `audio.input.transcription` only when `transcribeSource` is true:
   ```json
   {
     "session": {
       "model": "gpt-realtime-translate",
       "audio": {
         "input": {
           "transcription": { "model": "gpt-realtime-whisper" },   // omit when transcribeSource=false
           "noise_reduction": { "type": "near_field" }
         },
         "output": { "language": "<lang>" }
       }
     }
   }
   ```
   <!-- Validation Session 1: transcription is a per-request toggle, default true -->
4. Add `server/src/routes/session.ts`:
   - `router.post("/session", …)`
   - Validate `req.body.targetLanguage` is in `ALLOWED_LANGS`
   - Read `transcribeSource` (default `true`)
   - Call `mintTranslationClientSecret`
   - Return `{ client_secret, expires_at }` only — never the full upstream response
   - On upstream failure: `res.status(upstream.status).json({ error: "upstream_failed" })`, log status + url (no secrets)
5. In `server/src/index.ts`: validate `OPENAI_API_KEY` on boot (throw with clear message if missing), wire `express.json()`, CORS origin from `process.env.CLIENT_ORIGIN ?? "http://localhost:5173"`, mount router, add `GET /health` → 200. <!-- Validation Session 1: CORS via env -->
6. Manual test:
   ```bash
   curl -X POST http://localhost:8787/session \
     -H "Content-Type: application/json" \
     -d '{"targetLanguage":"ja"}'
   ```
   Expect JSON with `client_secret`.
7. Negative tests: invalid language → 400. Missing API key on boot → process exits with clear log.

## Success Criteria

- [x] `curl` with valid language returns `client_secret` field
- [x] Invalid language returns 400 with structured error
- [x] Missing `OPENAI_API_KEY` prevents boot with readable error
- [x] Logs never print the API key or full client_secret
- [x] `session.ts` < 100 lines, `openai-client.ts` < 80 lines

## Risk Assessment

- **OpenAI endpoint path drift** — cookbook URL is current. Pin in one constant in `openai-client.ts` so future changes are 1-line.
- **Rate limit on mint endpoint** — surface 429s clearly; client will show a banner (phase 06).
- **CORS misconfig blocks browser** — explicit allowlist of `localhost:5173`; if user changes Vite port, document the override env var.
