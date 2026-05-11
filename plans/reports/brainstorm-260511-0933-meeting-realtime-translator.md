# Brainstorm — Realtime Voice Translator for Meetings (Web App + Virtual Audio Cable)

**Date:** 2026-05-11
**Owner:** vumic
**Status:** Design agreed, ready for `/ck:plan`

---

## 1. Problem statement

User speaks Vietnamese into mic. Other participants in a Zoom or Google Meet call should hear the speech translated into Japanese (or any of 12 other languages) in near-real-time. Built on OpenAI `gpt-realtime-translate`. Repo must be public so anyone can self-host for free (BYO OpenAI key).

### Constraints (decided)
- **Form factor:** Browser web app (Vite client + tiny local Node backend).
- **Direction:** One-way (VI → target language) for MVP. Code structured so two-way (incoming JA → VI in headphones) can be added later.
- **Languages:** All 13 OpenAI-supported output languages (ES, PT, FR, JA, RU, ZH, DE, KO, HI, ID, VI, IT, EN).
- **API key:** BYO — each user supplies their own OpenAI key, runs the backend locally.
- **Audio routing into meeting app:** Browser `audioElement.setSinkId()` → VB-CABLE (Windows) / BlackHole (Mac) / PipeWire null sink (Linux). Zoom/Meet picks the virtual cable as its mic input.
- **Original mic:** Physical mic never sent to Zoom — only virtual cable. Other participants hear translated voice only.
- **Captions:** Both source (VI) and target captions shown in app for self-monitoring.

### Out of scope (YAGNI for v1)
Two-way translation, multi-speaker separation, glossary/term injection, Electron desktop wrapper, hosted SaaS demo, mobile.

---

## 2. Hard truths (read before approving)

| # | Concern | Mitigation |
|---|---------|------------|
| 1 | **OBS is the wrong tool for audio routing.** OBS Virtual Camera is video-only; routing audio to a virtual mic requires extra plugins and is fragile. README must recommend VB-CABLE / BlackHole instead. | Clear per-OS install doc |
| 2 | **Latency is 1–3s end-to-end.** Fine for presentation/monologue style. Awkward for fast Q&A. | Disclose in README |
| 3 | **Cost is real.** `gpt-realtime-translate` is metered per audio minute. "Free" = open source, not free to run. | Disclose in README with link to OpenAI pricing |
| 4 | **`setSinkId` browser support is limited.** Works in Chromium (Chrome/Edge/Brave). Not Safari. Limited Firefox. | README requires Chrome/Edge |
| 5 | **Mixed-language speech goes silent.** If user briefly speaks the target language (e.g. user accidentally says "yes" in English while target=EN), model emits no audio → Zoom hears a gap. | Captions surface this clearly; user notices and adjusts |
| 6 | **Voice is "style-matched", not cloned.** Other participants may not realize it's actually you. For some meetings this is fine; for high-stakes calls it can feel off. | Disclose in README |
| 7 | **Backend must stay LOCAL.** It holds the user's API key. If anyone deploys it publicly, they pay OpenAI for everyone. | README says explicitly: "do not deploy the backend to a public URL"; provide no Dockerfile / no Vercel button for the server |

---

## 3. Architecture

```
┌─ User's machine ─────────────────────────────────────────────┐
│                                                              │
│  [Physical Mic] ─→ Chrome/Edge tab (localhost:5173)          │
│                       │                                      │
│                       │  getUserMedia({deviceId: chosenMic}) │
│                       │                                      │
│                       ├─ POST localhost:8787/session         │
│                       │   ←─ short-lived client_secret       │
│                       │                                      │
│                       ├─ RTCPeerConnection                   │
│                       │   POST api.openai.com/v1/realtime/   │
│                       │     translations/calls (SDP)         │
│                       │   ↑ Authorization: client_secret     │
│                       │                                      │
│                       │   ←─ translated audio (remote track) │
│                       │   ←─ oai-events data channel         │
│                       │       (input + output transcripts)   │
│                       │                                      │
│                       └─ HTMLAudioElement                    │
│                          .setSinkId("CABLE Input")           │
│                          .srcObject = remoteStream           │
│                                                              │
│                       ┌──────────────────┐                   │
│                       │ VB-CABLE Input   │ ← translated PCM  │
│                       └────────┬─────────┘                   │
│                                ▼                             │
│                       ┌──────────────────┐                   │
│                       │ VB-CABLE Output  │ ← appears as mic  │
│                       └────────┬─────────┘                   │
│                                ▼                             │
│                       [Zoom / Google Meet] ──→ Internet ──→  │
│                                                              │
│  [Local Node backend on localhost:8787]                      │
│   • Reads OPENAI_API_KEY from .env                           │
│   • POST /session  →  mints client_secret                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Evaluated approaches

### A. Browser web app + VB-CABLE (CHOSEN)
- **Pros:** Smallest surface area. Browser already has WebRTC, getUserMedia, setSinkId, RTCPeerConnection. Single `npm run dev` to start. Native cross-platform. Cookbook's browser-tab demo is 80% of what we need.
- **Cons:** Chrome/Edge only. User must install VB-CABLE separately (one-time, 2 min).

### B. Electron desktop app
- **Pros:** Bundled installer, can ship VB-CABLE installer alongside, friendlier non-tech UX.
- **Cons:** 200MB download, code-signing pain on Win/Mac, packaging complexity, no real benefit since the browser already exposes every API we need.

### C. Python + native audio (sounddevice/PortAudio) with web UI
- **Pros:** Bypasses virtual cable entirely — Python directly writes to any output device.
- **Cons:** Cannot use WebRTC easily from Python (would need aiortc, far less mature). Heavier install. Audio device naming hell across OS.

**Verdict:** A wins on YAGNI/KISS by a large margin.

---

## 5. Repo structure

```
meeting-auto-translate/
├── README.md                    # Quickstart + per-OS audio setup
├── LICENSE                      # MIT
├── package.json                 # workspaces: client, server
├── .gitignore
├── .env.example                 # OPENAI_API_KEY=
│
├── docs/
│   ├── setup-windows.md         # VB-CABLE install, Zoom/Meet config
│   ├── setup-macos.md           # BlackHole install
│   ├── setup-linux.md           # PipeWire null sink
│   ├── architecture.md          # This design, plus diagrams
│   ├── troubleshooting.md       # No audio? Wrong device? Captions empty?
│   └── cost-and-limits.md       # Pricing, latency, language matrix
│
├── server/
│   ├── package.json             # express, dotenv, cors
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts             # Express bootstrap
│       └── routes/
│           └── session.ts       # POST /session → mint client_secret
│
├── client/
│   ├── package.json             # vite, typescript
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.ts              # Entry, wires UI to modules
│       ├── translation-session.ts   # RTCPeerConnection lifecycle (start/stop)
│       ├── audio-devices.ts     # enumerateDevices + setSinkId helpers
│       ├── captions.ts          # Render input + output transcript deltas
│       ├── settings.ts          # localStorage: lang, mic, output, last-used
│       ├── ui/
│       │   ├── controls.ts      # Start/Stop, language picker, device pickers
│       │   ├── captions-view.ts
│       │   └── status.ts        # Connection status, error banners
│       └── styles.css
│
└── scripts/
    ├── dev.ps1                  # Windows: concurrently start server + client
    ├── dev.sh                   # Mac/Linux
    └── postinstall-check.ts     # Detects whether VB-CABLE / BlackHole present
```

**File-size discipline:** Each module < 200 lines. `translation-session.ts` is the largest; if it grows, split into `webrtc.ts` + `events.ts`.

---

## 6. Key implementation notes

### Backend `/session` endpoint
- POST receives `{ targetLanguage }`, validates against allowlist of 13 codes.
- Calls `POST https://api.openai.com/v1/realtime/translations/client_secrets` with:
  ```json
  {
    "session": {
      "model": "gpt-realtime-translate",
      "audio": {
        "input": {
          "transcription": { "model": "gpt-realtime-whisper" },
          "noise_reduction": { "type": "near_field" }
        },
        "output": { "language": "<targetLanguage>" }
      }
    }
  }
  ```
- Returns only `{ client_secret, expires_at }` to the browser.

### Browser session lifecycle (`translation-session.ts`)
1. POST `/session` → get `client_secret`.
2. `getUserMedia({ audio: { deviceId: chosenMic, echoCancellation: true, noiseSuppression: true } })`.
3. `pc = new RTCPeerConnection()`, add mic track, create `oai-events` data channel.
4. Wire `pc.ontrack` → set as `srcObject` on a hidden `<audio>` element whose `sinkId` is the virtual cable.
5. Wire `events.onmessage` → push `session.input_transcript.delta` + `session.output_transcript.delta` into captions store.
6. Create SDP offer, POST to `https://api.openai.com/v1/realtime/translations/calls` with `Authorization: Bearer <client_secret>`.
7. `setRemoteDescription({ type: "answer", sdp: responseText })`.
8. Stop button: close PC, stop tracks, clear captions.

### Audio output routing (`audio-devices.ts`)
- `navigator.mediaDevices.enumerateDevices()` filtered by `kind === "audiooutput"`.
- Render a dropdown that highlights any device whose label contains `"CABLE Input"`, `"BlackHole"`, or `"meeting-translator"` (suggested PipeWire sink name).
- On selection: `audioEl.setSinkId(device.deviceId)`. Persist to localStorage.

### Mic device picker (`audio-devices.ts`)
- Filtered by `kind === "audioinput"`. User picks their real mic.
- Persist to localStorage.

### Captions (`captions.ts`)
- Two scrolling panes side-by-side. Source (left, faded) + target (right, bold).
- Both auto-scroll to bottom. Buffer last ~30 lines.

### Settings persistence (`settings.ts`)
- localStorage keys: `mt.openai_key` (optional, fallback to `.env`), `mt.target_lang`, `mt.mic_device_id`, `mt.output_device_id`.
- For BYO key UX: if `.env` empty, surface an in-app "paste your OpenAI key" field; pass key via the local server when proxying.

---

## 7. Public README — step-by-step (what we'll ship)

This is the **public-facing setup flow** the user wants. To be authored as `README.md` during implementation.

### 7.1 Prerequisites
- Node.js ≥ 20
- Chrome or Edge browser
- An OpenAI API key with access to `gpt-realtime-translate` (Realtime models tier)
- A virtual audio cable installed:
  - **Windows:** [VB-CABLE](https://vb-audio.com/Cable/) (free)
  - **macOS:** [BlackHole 2ch](https://existential.audio/blackhole/) (free)
  - **Linux:** PipeWire null sink (built-in; doc provides the `pactl` command)

### 7.2 One-time setup
```bash
git clone https://github.com/<you>/meeting-auto-translate
cd meeting-auto-translate
npm install
cp .env.example .env
# edit .env, paste OPENAI_API_KEY=sk-...
```

### 7.3 Configure Zoom / Google Meet
- **Zoom:** Settings → Audio → Microphone → "CABLE Output (VB-Audio Virtual Cable)". Speaker → your normal headphones.
- **Google Meet:** ⋮ → Settings → Audio → Microphone → "CABLE Output". Speaker → your normal headphones.

### 7.4 Run the app
```bash
npm run dev
# opens http://localhost:5173
```

### 7.5 In the app
1. Pick your **physical mic** in the "Source mic" dropdown.
2. Pick **"CABLE Input"** in the "Translated audio output" dropdown.
3. Pick **target language** (Japanese, English, etc).
4. Click **Start translating**.
5. Speak Vietnamese. Watch captions to confirm both source detection and translation. Zoom participants hear translated voice only.

### 7.6 Troubleshooting (anchor in `docs/troubleshooting.md`)
- No options in the output device dropdown → VB-CABLE / BlackHole not installed or not detected; restart browser.
- Captions show source but no translation → check `gpt-realtime-translate` API access on your OpenAI account.
- Zoom participants hear original Vietnamese → Zoom mic still set to physical mic, not "CABLE Output".
- Audio cuts mid-sentence when you use target-language words → expected (cookbook §"Account for mixed-language speech").

---

## 8. Implementation phases (preview for `/ck:plan`)

| # | Phase | Outcome |
|---|-------|---------|
| 1 | **Repo scaffold** | Monorepo skeleton, package.json workspaces, tsconfig, MIT license, .env.example. |
| 2 | **Backend `/session`** | Express server, validated language allowlist, mints client_secret. Manual curl test. |
| 3 | **Client session core** | `translation-session.ts` — mic capture, RTCPeerConnection, SDP exchange, remote track playback. Hardcoded language for first pass. |
| 4 | **Audio device routing** | Device enumeration, setSinkId integration, mic + output pickers, persistence. |
| 5 | **Captions UI** | Source + target panes, event wiring. |
| 6 | **Settings & API key UX** | In-app key paste (proxied through local server), language persistence, last-used devices. |
| 7 | **Per-OS audio setup docs** | `docs/setup-windows.md`, `setup-macos.md`, `setup-linux.md`. |
| 8 | **Troubleshooting + cost docs** | `docs/troubleshooting.md`, `docs/cost-and-limits.md`. |
| 9 | **README + screenshots** | Public-facing quickstart per §7. |
| 10 | **(Optional) Postinstall device check** | `scripts/postinstall-check.ts` warns if VB-CABLE/BlackHole not detected. |

Phases 1→6 are sequential. 7→9 can run in parallel after 6. Phase 10 is YAGNI-flagged — only if early users hit "no output devices" support requests.

---

## 9. Success criteria

- **Functional:** Speaker on a real Zoom call with target=JA. Listener (Japanese speaker) confirms they hear coherent Japanese matching the speaker's Vietnamese, with < 3s perceived latency.
- **Setup time:** Fresh clone → first translated audio in Zoom in < 10 minutes following README only.
- **Portability:** Works on Windows + macOS without code changes. Linux documented but lower-priority validation.
- **Repo quality:** All modules < 200 lines. README + 5 docs files. No secrets committed. CI-free (no GH Actions in v1 per YAGNI).
- **Public-readiness:** README clearly states it's BYO key, costs OpenAI money, latency reality, browser support reality.

---

## 10. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| User deploys backend to public URL, leaks key | Medium | High | README explicit warning; no Dockerfile/no Vercel button for server in v1 |
| OpenAI deprecates/renames `gpt-realtime-translate` | Low | High | Pin model name in single constant; doc points to OpenAI status |
| `setSinkId` removed from Chrome | Very low | High | Currently stable Web API; monitor caniuse |
| User on Safari opens issues | High | Low | README states "Chrome/Edge only"; close as "wontfix browser-support" |
| VB-CABLE install confuses non-tech users | High | Medium | Screenshots + per-OS doc; consider a 30s screencap in v1.1 |
| OpenAI rate limit hit mid-meeting | Low | Medium | Catch session errors, surface clearly in UI status bar |

---

## 11. Future enhancements (NOT v1)

- **Two-way:** Capture meeting audio via OS loopback (Stereo Mix / BlackHole 2nd channel / PipeWire monitor), open second translation session, play in headphones. Extract `TranslationSession` class so 2 instances coexist.
- **Push-to-translate** key bind, so user can speak target-language asides without the model going silent.
- **Voice persona pinning** if/when OpenAI adds it.
- **Hosted demo** with shared rate-limited key (would require absorbing OpenAI cost — re-evaluate when usage justifies).
- **Auto-update mic-mute** in Zoom/Meet via accessibility APIs (Electron required).

---

## 12. Unresolved questions

1. Should the `.env` API-key path be the **only** option, or should we also support in-app paste UI in v1? In-app paste is more user-friendly for non-devs but slightly more code (still needs the local server to proxy the key — never expose it to direct OpenAI calls from client). **Recommendation:** ship both in v1; `.env` for devs, in-app for everyone else.
2. Linux validation depth — do you personally test on Linux, or document-only with a "community contributions welcome" note? **Recommendation:** document-only for v1.
3. Do we publish a Chrome extension flavor (auto-detects Zoom/Meet tab) at any point, or stay browser-app forever? **Recommendation:** browser-app only; revisit after first 10 real users.
4. Telemetry — any opt-in usage metrics for understanding how the tool is used in the wild? **Recommendation:** none in v1 (privacy-first).
