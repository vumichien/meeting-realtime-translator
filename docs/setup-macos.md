# Setup — macOS

> Tested on macOS 14 (Sonoma) and 15 (Sequoia), Chrome 130+, Zoom 5.17+ as of 2026-05.

## 1. Install BlackHole 2ch

BlackHole is a free virtual audio driver. Anything written to BlackHole is readable from BlackHole. Zoom's mic input listens to BlackHole; the app routes translated audio to BlackHole.

**Option A — Homebrew (recommended)**

```bash
brew install blackhole-2ch
```

**Option B — installer**

Download the `.pkg` from <https://existential.audio/blackhole/> and run it. Reboot when prompted.

## 2. Verify the OS sees it

1. Open **Audio MIDI Setup** (in `/Applications/Utilities/`).
2. In the device list (left sidebar) confirm `BlackHole 2ch` appears.
3. The device should be present as both an input and an output.

## 3. (Optional) Multi-Output Device for monitoring

If you want to hear yourself in real headphones AND route to BlackHole at the same time:

1. In Audio MIDI Setup, click **+** → **Create Multi-Output Device**.
2. Check `BlackHole 2ch` and your headphones.
3. Set sample rate to 48 kHz on both for stability.

This setup is **not required** for the basic flow — the app already plays through any output you pick via `setSinkId`. The Multi-Output is useful when you want sidetone monitoring of the translated audio in your own headphones.

## 4. Grant Chrome the right permissions

1. **System Settings → Privacy & Security → Microphone**: enable **Google Chrome**.
2. **Privacy & Security → Screen & System Audio Recording** (only needed if you later want tab audio capture; not required for this app's mic-based flow).

## 5. Configure Zoom

1. Open Zoom → **Settings → Audio**.
2. **Speaker**: your real headphones.
3. **Microphone**: `BlackHole 2ch`.
4. Uncheck **Automatically adjust microphone volume**.
5. Background noise suppression: **Low** (the model already does noise reduction).

![Zoom audio settings — macOS](_images/mac-zoom-audio.png)

## 6. Configure Google Meet

1. Join a Meet call.
2. Click **⋮ (More) → Settings → Audio**.
3. **Microphone**: `BlackHole 2ch`.
4. **Speakers**: your real headphones.

## 7. Run the app and pick devices

1. From repo root: `npm install`, then `npm run dev`.
2. Open <http://localhost:5173> in **Chrome** or **Edge**.
3. Grant microphone access.
4. **Source mic**: your real microphone.
5. **Output device**: `★ BlackHole 2ch`. Star confirms detection.
6. **Target language**: pick from the dropdown.
7. Click **Start translating**.

## 8. Verify in a Zoom test call

1. Open <https://zoom.us/test> in another window.
2. Join the test call.
3. Speak in your source language. The translated voice should play back through Zoom's playback test.

## Troubleshooting (macOS-specific)

| Symptom | Likely cause | Fix |
|---|---|---|
| BlackHole not in Audio MIDI Setup | Install incomplete or reboot needed | `brew uninstall blackhole-2ch && brew install blackhole-2ch`; reboot |
| Chrome can't list devices | Mic permission not granted | System Settings → Privacy & Security → Microphone → enable Chrome |
| Zoom hears static / dropouts | Sample rate mismatch | Set BlackHole and your headphones both to 48 kHz in Audio MIDI Setup |
| No translated audio in Zoom | Output device in app set to your headphones, not BlackHole | Re-pick `★ BlackHole 2ch` |
| Echo for other participants | You're monitoring BlackHole back into your mic | Don't route BlackHole as a default input device system-wide |
| Want 16-channel BlackHole instead | Power-user need (channel splitting) | `brew install blackhole-16ch`; otherwise 2ch is simpler |

---

↑ Back to [README](../README.md) · → See [troubleshooting](./troubleshooting.md) · See also [cost-and-limits](./cost-and-limits.md)
