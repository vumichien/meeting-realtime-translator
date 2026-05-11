# Troubleshooting

Symptom-based lookup. If a problem isn't listed, open an issue with output from the **Copy debug bundle** button in the app's Debug panel.

## Contents

- [App won't start](#app-wont-start)
- [Server: missing OPENAI_API_KEY](#server-missing-openai_api_key)
- [Browser: setSinkId unsupported](#browser-setsinkid-unsupported)
- [Output device dropdown empty](#output-device-dropdown-empty)
- [Virtual cable not in output list](#virtual-cable-not-in-output-list)
- [Zoom hears nothing](#zoom-hears-nothing)
- [Zoom hears your original (un-translated) voice](#zoom-hears-your-original-un-translated-voice)
- [Captions show source but no translation](#captions-show-source-but-no-translation)
- [Captions empty entirely](#captions-empty-entirely)
- [Audio plays through speakers instead of the cable](#audio-plays-through-speakers-instead-of-the-cable)
- [`/session` returns 401](#session-returns-401)
- [Upstream returns 429 (rate limit)](#upstream-returns-429-rate-limit)
- [Translation cuts during target-language words](#translation-cuts-during-target-language-words)
- [High latency (>5s)](#high-latency-5s)
- [Echo for other participants](#echo-for-other-participants)
- [Translated voice sounds robotic](#translated-voice-sounds-robotic)
- [Hot-swapping mic mid-session breaks audio](#hot-swapping-mic-mid-session-breaks-audio)
- [Multiple browser tabs interfere](#multiple-browser-tabs-interfere)

---

### App won't start

**Symptom:** `npm run dev` errors on Windows with execution policy / script failure.
**Cause:** PowerShell execution policy default.
**Fix:** Open PowerShell as your user and run:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
Then try again.

### Server: missing `OPENAI_API_KEY`

**Symptom:** Server boot logs `OPENAI_API_KEY not set` and POST `/session` returns 401 unless you paste a key in the app.
**Cause:** `.env` not created.
**Fix:** `cp .env.example .env`, paste your OpenAI key, restart the server. Or paste the key directly in the app's "OpenAI API key" field — that path bypasses `.env`.

### Browser: setSinkId unsupported

**Symptom:** Sticky banner: "This browser doesn't support setSinkId".
**Cause:** Firefox / Safari (Firefox 116+ added support but routing reliability varies; Safari has no support).
**Fix:** Use Chrome or Edge (≥120). Firefox is left out of the v1 support matrix on purpose.

### Output device dropdown empty

**Symptom:** No devices listed in the output picker.
**Cause:** Microphone permission not granted yet — without permission, the browser hides device labels and IDs.
**Fix:** Click **Allow** when Chrome asks for mic access; reload if you previously dismissed the prompt. Open `chrome://settings/content/microphone` to undo a block.

### Virtual cable not in output list

**Symptom:** No `★` badge anywhere; the dropdown lists only your headphones.
**Cause:** Virtual cable driver not installed or system hasn't recognized it yet.
**Fix:** Reinstall the driver per [Setup — Windows](./setup-windows.md) / [macOS](./setup-macos.md) / [Linux](./setup-linux.md). Reboot. Re-check in **Sound settings** (Win) / **Audio MIDI Setup** (macOS) / `pactl list short sinks` (Linux).

### Zoom hears nothing

**Symptom:** Other participants in Zoom hear silence.
**Cause:** Zoom's mic input is still your real mic, not the virtual cable.
**Fix:** In Zoom **Settings → Audio → Microphone**, pick `CABLE Output` (Win) / `BlackHole 2ch` (macOS) / `Monitor of meeting-translator` (Linux). Then in the app, confirm the **output device** is the cable's input side.

### Zoom hears your original (un-translated) voice

**Symptom:** Translated audio reaches Zoom AND your original voice does too.
**Cause:** Your real mic is still wired into Zoom (or your OS mixes mic into the cable).
**Fix:** In Zoom, the mic dropdown must be the **cable output** (not your real mic). Do not enable "stereo mix" / "monitor mic to cable" on Windows.

### Captions show source but no translation

**Symptom:** Source-language text appears in the source pane; translation pane stays empty.
**Cause:** Most likely your OpenAI API key/account doesn't have access to `gpt-realtime-translate`. Less common: upstream model returned silence for entirely-target-language input.
**Fix:** Check OpenAI account model access at <https://platform.openai.com/account>. Open Debug panel → look at "Errors" counter and event log for upstream error events.

### Captions empty entirely

**Symptom:** Both source and target panes empty even though you're speaking.
**Cause:** Wrong source mic selected, mic muted at OS level, or app's mic permission denied.
**Fix:** In the **Source mic** dropdown, pick the right device. Open Debug panel → watch the **Mic** VU meter — if it stays flat, the mic isn't reaching the app.

### Audio plays through speakers instead of the cable

**Symptom:** You hear the translated audio out loud locally; Zoom hears nothing.
**Cause:** `setSinkId` failed silently (rare) or you didn't pick the cable as output.
**Fix:** Re-pick the `★` output device. Reload page. Confirm the picker shows the star.

### `/session` returns 401

**Symptom:** App shows `Session mint failed: ... no_api_key` or `Invalid API key`.
**Cause:** Empty `.env` AND no key pasted in the app, OR a malformed key.
**Fix:** Either set `OPENAI_API_KEY` in `.env`, or paste a valid key into the app's "OpenAI API key" field and click outside to commit.

### Upstream returns 429 (rate limit)

**Symptom:** Banner: "Session mint failed: ... rate limit".
**Cause:** OpenAI account hit a per-minute limit.
**Fix:** Wait 60 seconds and retry. For sustained use, request a higher limit on your OpenAI account.

### Translation cuts during target-language words

**Symptom:** Speaker mixes their source language with target-language phrases (e.g. English) and the model goes silent during the target-language parts.
**Cause:** Documented model behavior — `gpt-realtime-translate` skips translating audio that's already in the listener's selected output language. See [`cost-and-limits.md`](./cost-and-limits.md#known-model-limitations).
**Fix:** Stay in the source language. If mixed-language is unavoidable, pick a target language different from any of the languages you're likely to switch into.

### High latency (>5s)

**Symptom:** Translated audio lags 5+ seconds behind your speech.
**Cause:** Network distance to OpenAI region, packet loss, or backpressure.
**Fix:** Test on a different network; close bandwidth-heavy apps; open Debug panel and watch the **Latency p50** metric to confirm.

### Echo for other participants

**Symptom:** Other Zoom users hear themselves echoed back.
**Cause:** Either your headphones are leaking into your real mic, OR you're monitoring the cable's input back into your speakers.
**Fix:** Switch to closed-back headphones. Disable any "monitor mic to cable" stereo-mix settings. On Windows, do not set CABLE Input as your default playback device.

### Translated voice sounds robotic

**Symptom:** Output voice is choppy, robotic, or low-quality.
**Cause:** Background noise overwhelming the model's noise reduction; mic too far away; or wrong **Mic environment** preset (e.g. `Headset` selected while using a laptop's built-in mic).
**Fix:**
1. Open the **Mic environment** selector in the main controls. Pick the option that matches your hardware:
   - **Headset / close mic** — USB headset, AirPods, headphones with mic.
   - **Laptop built-in** — open-air laptop mic.
   - **Conference / room mic** — Jabra Speak, MeetingOwl, room conferencing system.
   - **Auto** auto-detects from the device label; override manually if it picks wrong.
2. Quieter room. Move mic closer when possible.
3. Background noise is the most common cause for headset users — even with `near_field` reduction the model has limits. Closing windows / muting fans helps more than any setting.

### Hot-swapping mic mid-session breaks audio

**Symptom:** You change USB headsets while a session is running and translation stops.
**Cause:** Browser's `getUserMedia` track is bound to a specific device; unplugging it ends the track.
**Fix:** Click **Stop**, change device in the picker, click **Start translating**.

### Multiple browser tabs interfere

**Symptom:** Two open tabs of the app produce inconsistent device behavior.
**Cause:** `devicechange` events and localStorage updates race between tabs.
**Fix:** Run only one tab at a time. Close duplicates.

---

↑ Back to [README](../README.md) · See also [setup-windows](./setup-windows.md) · [setup-macos](./setup-macos.md) · [setup-linux](./setup-linux.md) · [cost-and-limits](./cost-and-limits.md)
