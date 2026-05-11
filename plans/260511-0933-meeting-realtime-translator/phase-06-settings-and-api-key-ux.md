---
phase: 6
title: "Settings and API Key UX"
status: completed
priority: P1
effort: "3h"
dependencies: [4, 5]
---

# Phase 06: Settings and API Key UX

## Overview
Final UI shell: language picker (13 options), persist mic/output/language to localStorage, in-app OpenAI key paste as alternative to `.env`, status bar, error banners. Wires together phases 02-05 into a single coherent app.

## Requirements

**Functional**
- Language picker dropdown populated from verified output-language allowlist (phase 02 Step 0)
- localStorage persistence: `mt.target_lang`, `mt.mic_device_id`, `mt.output_device_id`, `mt.openai_key` (optional), `mt.transcribe_source` (default `true`), `mt.captions_flush_idle_ms` (default `1500`), `mt.captions_flush_on_punctuation` (default `true`)
- "Show source captions" toggle — when off, client passes `transcribeSource: false` to `/session` so upstream skips the whisper transcription pass (cost saving)
- Advanced (collapsed by default) disclosure: caption flush idle ms input + flush-on-punctuation checkbox
- In-app API key field (password input): when set, browser sends `Authorization: Bearer <user-key>` to `/session` endpoint, which proxies to OpenAI using the user-supplied key instead of `.env` key
- Status bar showing PC connection state (idle, connecting, connected, failed)
- Error banner for: missing key, upstream API error, unsupported browser, device routing failure
- Single big "Start translating" / "Stop" button (state-aware)

<!-- Updated: Validation Session 1 - transcribeSource toggle + caption flush controls -->

**Non-functional**
- UI modules each <150 lines
- Layout: header (controls) + main (captions) + footer (status)
- No external UI framework; vanilla TS + CSS

## Architecture

```
main.ts
  ├─ settings = createSettings(localStorage)
  ├─ pickers = createDevicePickers(settings)
  ├─ langPicker = createLangPicker(settings)
  ├─ keyField = createApiKeyField(settings)
  ├─ captions = createCaptionsView()
  ├─ statusBar = createStatusBar()
  ├─ startBtn.onclick → startSession({...}, statusBar.set)
  └─ stopBtn.onclick → handle.stop()

server/src/routes/session.ts (extended)
  ├─ if req.headers.authorization → use that key for upstream call
  └─ else → use process.env.OPENAI_API_KEY
```

## Related Code Files

**Create**
- `client/src/settings.ts` — typed localStorage wrapper, 13-language list (kept in sync with server allowlist via shared json? — duplicate as constant for v1, document the sync rule)
- `client/src/ui/controls.ts` — start/stop button, language picker, key field
- `client/src/ui/status.ts` — status bar + error banner
- `client/src/config/languages.ts` — mirrors server `ALLOWED_LANGS`

**Modify**
- `client/src/main.ts` — final wiring, replaces all temporary debug UI
- `client/src/translation-session.ts` — accept optional `apiKey` to pass via `Authorization` header on `/session` POST
- `client/index.html` — final markup skeleton
- `client/src/styles.css` — full styling pass
- `server/src/routes/session.ts` — honor `Authorization` header if present (falls back to env)

## Implementation Steps

1. Create `client/src/config/languages.ts` mirroring server's `ALLOWED_LANGS` + labels. Note in comment: "MUST match `server/src/config/languages.ts`."
2. `client/src/settings.ts`:
   ```ts
   export interface Settings {
     get<K extends keyof Store>(key: K): Store[K] | undefined;
     set<K extends keyof Store>(key: K, value: Store[K]): void;
   }
   interface Store {
     "mt.target_lang": string;
     "mt.mic_device_id": string;
     "mt.output_device_id": string;
     "mt.openai_key": string;
   }
   ```
3. `ui/controls.ts`:
   - Language `<select>` populated from `LANGUAGES`, initial value from settings
   - API key `<input type="password">`, initial value from settings, with "Save" button
   - "Start translating" button, toggles to "Stop" when active
4. `ui/status.ts`:
   - Status pill: idle/connecting/connected/error
   - Banner area for transient errors (auto-dismiss after 8s for non-fatal)
5. Extend `translation-session.ts` `startSession` signature:
   ```ts
   { targetLanguage, micDeviceId, outputDeviceId, apiKey?, transcribeSource, captionsFlush: { idleMs, onPunctuation }, onEvent, onStateChange }
   ```
   When `apiKey` set, include `Authorization: Bearer ${apiKey}` on the `/session` POST. Pass `transcribeSource` in JSON body. Forward `captionsFlush` to the captions view (does not affect upstream call).
   <!-- Updated: Validation Session 1 -->
6. Extend `server/src/routes/session.ts`:
   ```ts
   const userKey = req.headers.authorization?.replace(/^Bearer\s+/i, "");
   const apiKey = userKey || process.env.OPENAI_API_KEY;
   if (!apiKey) return res.status(401).json({ error: "no_api_key" });
   ```
   Then call `mintTranslationClientSecret(targetLanguage, apiKey)`.
7. `main.ts` final wiring: on Start click, read all settings, call `startSession`, store handle. On Stop, `handle.stop()` and clear handle ref. Disable Start while session active.
8. Style pass in `styles.css`: header (controls top), captions main, footer (status), color tokens for state pills.
9. End-to-end smoke test:
   - Set key in app, restart server with empty `.env` → app should still work (key flows via header)
   - Change language mid-session: stop, change, start → translates to new language
   - Reload page → settings persisted; one-click resume

## Success Criteria

- [x] All 13 languages selectable; selection persists across page reload
- [x] Mic + output device choices persist across reload
- [x] In-app key + empty `.env` → translation works
- [x] Empty key + empty `.env` → clear "No API key configured" banner
- [x] Status pill reflects WebRTC connection state in real time
- [x] Upstream 4xx/5xx surfaces in banner with status code
- [x] Single visible page; no router needed; works in a 1024×768 window

## Risk Assessment

- **API key in localStorage** — readable by any JS on `localhost:5173`. Acceptable for local-only app, document. Don't deploy to a public origin.
- **Language list drift** — server and client both maintain `ALLOWED_LANGS`. Risk of drift. Mitigation: comment in both files cross-referencing the other; could be a v1.1 refactor to single shared package.
- **User pastes invalid key** — surfaces as upstream 401; banner shows "Invalid API key". Acceptable feedback loop.
- **Multiple tabs open** — `devicechange` and localStorage updates could race. Document "one tab at a time" in README.
