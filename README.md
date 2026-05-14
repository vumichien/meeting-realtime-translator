# Meeting Realtime Translator

**Non-tech user?** Start with the [Babel Mic desktop user guide](docs/user-guide.md). **Developer?** Keep reading for the browser + local backend workflow. See [changelog](docs/project-changelog.md) for release history.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/vumichien/meeting-realtime-translator?style=social)](https://github.com/vumichien/meeting-realtime-translator/stargazers)
[![Latest release](https://img.shields.io/github/v/release/vumichien/meeting-realtime-translator?display_name=tag&sort=semver)](https://github.com/vumichien/meeting-realtime-translator/releases)
[![Node.js ≥ 20](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Powered by OpenAI](https://img.shields.io/badge/Powered%20by-OpenAI%20Realtime-412991?logo=openai&logoColor=white)](https://platform.openai.com/docs/guides/realtime)
[![Chrome / Edge only](https://img.shields.io/badge/Browser-Chrome%20%2F%20Edge-4285F4?logo=googlechrome&logoColor=white)](#caveats--read-before-installing)
[![BYO API Key](https://img.shields.io/badge/API%20Key-BYO%20%E2%80%94%20local%20only-orange)](#configuration)
[![Desktop app](https://img.shields.io/badge/Desktop-Electron-47848F?logo=electron&logoColor=white)](docs/user-guide.md)

> Speak your language in your browser. Zoom / Meet hears you in your meeting's language. Auto-detects 70+ source languages. Powered by OpenAI's `gpt-realtime-translate`. Local-only, BYO key.

If this helps your meetings feel a little less impossible, please hit Star on GitHub. It helps others find the project.

![Meeting Realtime Translator — intro animation](docs/_images/app-info.gif)

## What it does

- Captures your real microphone, streams it to OpenAI Realtime Translation over WebRTC, then plays the translated audio into a virtual audio cable that Zoom or Google Meet treats as your microphone.
- Shows side-by-side captions: source (what you said) and translation (what listeners hear).
- Supports 13 target languages out of the box.
- Includes a local-only debug panel so you can see connection state, latency, VU meters, and event flow without DevTools.

## Audio routing flow

This is the most important setup idea:

```
Your real mic
  -> Babel Mic Source mic
  -> OpenAI translation
  -> Babel Mic Output device
  -> virtual cable playback side
  -> virtual cable recording side
  -> Zoom / Google Meet Microphone
  -> meeting participants hear translated speech
```

Device names by platform:

| Place | Windows VB-CABLE | macOS BlackHole | Linux PipeWire |
|---|---|---|---|
| Babel Mic **Source mic** | Your real microphone | Your real microphone | Your real microphone |
| Babel Mic **Output device** | `CABLE Input (VB-Audio Virtual Cable)` | `BlackHole 2ch` | `meeting-translator` sink |
| Zoom / Meet **Microphone** | `CABLE Output (VB-Audio Virtual Cable)` | `BlackHole 2ch` | `Monitor of meeting-translator` |
| Zoom / Meet **Speaker** | Your headphones or speakers | Your headphones or speakers | Your headphones or speakers |

On Windows the names feel backwards at first: Babel Mic plays into **CABLE Input**; Zoom or Meet records from **CABLE Output**. Do not set Zoom/Meet microphone to your real mic, or people will hear your original voice instead of the translation.

## Caveats — read before installing

- **Costs OpenAI tokens.** Metered per audio minute. See [`docs/cost-and-limits.md`](docs/cost-and-limits.md).
- **1–3s latency typical**, 5s+ on poor networks.
- **Chrome or Edge only.** `setSinkId` is required to route audio to the virtual cable. Firefox / Safari are not supported in v1.
- **You bring your own OpenAI API key.** Either via `.env` on the local backend, or pasted into the app's password field.
- **Backend must run on your machine only.** Do not deploy `server/` to a public origin — the local trust model assumes one user, one machine.
- **Translated voice is style-matched, not cloned.** The model adapts to your tone/pitch but does not replicate your voice.
- **Mixed-language speech may produce silence** when the speaker switches into the listener's target language. See [troubleshooting](docs/troubleshooting.md#translation-cuts-during-target-language-words).

## Quickstart (≈10 minutes)

1. **Install a virtual audio cable** for your OS:
   - Windows → [`docs/setup-windows.md`](docs/setup-windows.md) (VB-CABLE)
   - macOS → [`docs/setup-macos.md`](docs/setup-macos.md) (BlackHole 2ch)
   - Linux → [`docs/setup-linux.md`](docs/setup-linux.md) (PipeWire null sink)

2. **Clone, install, configure your key**
   ```bash
   git clone https://github.com/vumichien/meeting-realtime-translator.git
   cd meeting-realtime-translator
   cp .env.example .env
   # edit .env, set OPENAI_API_KEY
   npm install
   ```

3. **Configure Zoom / Meet**
   - Microphone: the virtual cable recording side.
     - Windows: `CABLE Output (VB-Audio Virtual Cable)`
     - macOS: `BlackHole 2ch`
     - Linux: `Monitor of meeting-translator`
   - Speaker: your normal headphones or speakers.

4. **Run and translate**
   ```bash
   npm run dev
   ```
   Open <http://localhost:5173> in Chrome or Edge.
   - Pick your real mic as **Source mic**.
   - Pick the `★` virtual cable playback side as **Output device**.
     - Windows: `CABLE Input (VB-Audio Virtual Cable)`
     - macOS: `BlackHole 2ch`
     - Linux: `meeting-translator`
   - Pick a **Target language**.
   - Click **Start translating**.
   - Speak in any supported source language; the meeting hears your target language.

## How it works

```
Real mic ─► Babel Mic ─► OpenAI Realtime Translation
                                │
                                ▼
                      translated audio track
                                │
                      setSinkId(cable playback side)
                                │
                                ▼
                 Zoom / Meet microphone (cable recording side)
```

The local Node backend (`server/`) mints short-lived OpenAI client secrets so the API key never reaches the browser. The browser establishes a WebRTC session directly with `https://api.openai.com/v1/realtime/translations/calls`. The translated audio comes back as a remote track and is routed via `audioElement.setSinkId()` to the virtual cable playback side. Zoom/Meet listens to the cable recording side as if it were your microphone.

## Intro video

The animated intro (`docs/_images/intro.mp4`) is built with [Remotion](https://remotion.dev).
To preview or re-render it locally:

```bash
cd remotion
npm install
npm start          # opens Remotion Studio at localhost:3000
npm run render     # re-renders to remotion/out/intro.mp4 (~30 s)
```

## Repo structure

```
meeting-auto-translate/
├── client/             # Vite + TypeScript front-end (UI, WebRTC, captions, debug panel)
├── server/             # Express + TypeScript backend (mints client secrets only)
├── remotion/           # Remotion intro video (src/, out/intro.mp4)
├── docs/               # setup-<os>.md, troubleshooting.md, cost-and-limits.md
├── plans/              # design history (brainstorm + implementation phase docs)
├── scripts/            # dev.ps1 / dev.sh — start client + server together
├── .env.example
├── README.md
└── LICENSE             # MIT
```

## Configuration

| Setting               | Where                        | Default |
|-----------------------|------------------------------|---------|
| OpenAI API key        | `.env` `OPENAI_API_KEY` or app field | — |
| Server CORS origin    | `.env` `CLIENT_ORIGIN`       | `http://localhost:5173` |
| Server port           | `.env` `PORT`                | `8787` |
| Source captions       | App toggle                   | On |
| Mic environment       | App main controls            | `Auto` (detects headset / laptop / room) |
| Caption flush idle ms | App Advanced section         | `1500` |
| Caption flush on punctuation | App Advanced section  | On |

## License

MIT — see [`LICENSE`](LICENSE).

## Links

- OpenAI cookbook: <https://cookbook.openai.com/examples/voice_solutions/realtime_translation_guide>
- VB-CABLE: <https://vb-audio.com/Cable/>
- BlackHole: <https://existential.audio/blackhole/>
- PipeWire: <https://www.pipewire.org/>
