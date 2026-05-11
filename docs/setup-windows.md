# Setup — Windows

> Tested on Windows 11, Chrome 130+, Zoom 5.17+ as of 2026-05.

## 1. Install VB-CABLE

VB-CABLE is a free virtual audio cable: anything written to "CABLE Input" is readable on "CABLE Output". Zoom listens to "CABLE Output" while the app writes translated audio to "CABLE Input".

1. Download the latest installer from <https://vb-audio.com/Cable/>.
2. Right-click the extracted `VBCABLE_Setup_x64.exe` → **Run as administrator**.
3. Click **Install Driver**. Reboot when prompted.

> Some antivirus tools flag VB-CABLE installers. Verify the signature is from "VB-Audio Software" before proceeding.

## 2. Verify the OS sees it

1. Right-click the speaker icon in the taskbar → **Sound settings**.
2. **Output**: confirm `CABLE Input (VB-Audio Virtual Cable)` is in the list (do not select it as your default output).
3. **Input**: confirm `CABLE Output (VB-Audio Virtual Cable)` is in the list.

If either is missing, reboot and re-check.

## 3. Configure Zoom

1. Open Zoom → **Settings → Audio**.
2. **Speaker**: your real headphones or speakers (so you hear the meeting normally).
3. **Microphone**: `CABLE Output (VB-Audio Virtual Cable)`.
4. Uncheck **Automatically adjust microphone volume**. Set the slider to ~70%.
5. Optional: under **Background noise suppression**, set to **Low** — the model already does noise reduction.

![Zoom audio settings — Windows](_images/win-zoom-audio.png)

## 4. Configure Google Meet

1. Join a Meet call.
2. Click **⋮** (More) → **Settings → Audio**.
3. **Microphone**: `CABLE Output (VB-Audio Virtual Cable)`.
4. **Speakers**: your real headphones.

## 5. Run the app and pick devices

1. From the repo root: `npm install` then `npm run dev`.
2. Open <http://localhost:5173> in **Chrome** or **Edge**.
3. Grant microphone permission when prompted.
4. **Source mic**: your real microphone (USB headset, laptop mic, etc.).
5. **Output device**: `★ CABLE Input (VB-Audio Virtual Cable)`. The ★ confirms detection.
6. **Target language**: pick from the dropdown (Japanese, Spanish, etc.).
7. Click **Start translating**.

## 6. Verify in a Zoom test call

1. Open <https://zoom.us/test> in another window.
2. Join the test call. Zoom plays a tone, then asks you to speak.
3. Speak in Vietnamese. After 1–3s you should hear the translated audio played back to you.
4. The app's caption pane shows source (Vietnamese) and translated text in parallel.

## Troubleshooting (Windows-specific)

| Symptom | Likely cause | Fix |
|---|---|---|
| `CABLE Output` missing from Zoom mic dropdown | Driver install partial or Zoom started before reboot | Reboot Windows; restart Zoom |
| Zoom hears nothing | App's output device is not set to `CABLE Input` | In the app, re-pick the ★ output device |
| Echo / feedback | Headphones leaking into your real mic, or you have `CABLE Input` set as your default playback | Wear closed-back headphones; do NOT set CABLE Input as default device |
| `npm run dev` fails to start | PowerShell execution policy | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once |
| AV blocks VB-CABLE installer | False positive | Verify signature from "VB-Audio Software"; allow once |
| Sound mixer shows CABLE Input muted | Per-app volume control | Open Volume Mixer (right-click speaker icon), unmute CABLE Input |

---

↑ Back to [README](../README.md) · → See [troubleshooting](./troubleshooting.md) · See also [cost-and-limits](./cost-and-limits.md)
