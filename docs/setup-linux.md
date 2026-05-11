# Setup — Linux

> Tested on Ubuntu 24.04 / Fedora 40 with PipeWire ≥1.0, Chrome 130+, Zoom Linux client 5.17+ as of 2026-05.
> Linux validation is community-supported. Reports welcome.

## 1. Confirm PipeWire is your audio server

```bash
pactl info | grep "Server Name"
```

Expect: `Server Name: PulseAudio (on PipeWire ...)`. If you're on legacy PulseAudio without PipeWire, the steps below should still work via PA compatibility, but device routing is less reliable.

## 2. Create a null sink for translated audio

The app writes translated audio to a sink; Zoom listens to the **monitor** of that sink as if it were a microphone.

```bash
pactl load-module module-null-sink \
  sink_name=meeting-translator \
  sink_properties=device.description=meeting-translator
```

Verify:

```bash
pactl list short sinks | grep meeting-translator
```

> The sink name `meeting-translator` matches the pattern recognized by the app's device picker — keep it as-is so the ★ badge appears.

## 3. Persist the null sink across reboots

Add this to `~/.config/pipewire/pipewire.conf.d/null-sink.conf` (create the file if missing):

```
context.modules = [
    {   name = libpipewire-module-loopback
        args = {
            node.description = "meeting-translator"
            capture.props = {
                node.name = "meeting-translator-capture"
                media.class = "Audio/Sink"
                audio.position = [ FL FR ]
            }
            playback.props = {
                node.name = "meeting-translator-playback"
                node.passive = true
                audio.position = [ FL FR ]
                node.target = "0"
            }
        }
    }
]
```

Then `systemctl --user restart pipewire pipewire-pulse wireplumber`.

A simpler approach (without a config file) is to drop the `pactl load-module ...` command into a user systemd unit or your shell's startup file.

## 4. Configure Zoom (Linux client)

1. Open Zoom → **Settings → Audio**.
2. **Speaker**: your real headphones.
3. **Microphone**: `Monitor of meeting-translator` (sometimes appears under the device's full description).
4. Disable **Automatically adjust volume**.

If Zoom doesn't show "Monitor of …" devices, run `pavucontrol`, switch to the **Recording** tab, and route Zoom there.

## 5. Configure Google Meet (Linux Chrome)

1. Join a call.
2. **⋮ → Settings → Audio → Microphone** → `Monitor of meeting-translator`.
3. Speakers → your real headphones.

## 6. Run the app

1. From repo root: `npm install`, then `npm run dev`.
2. Open <http://localhost:5173> in Chrome or Chromium-based browsers.
3. Grant mic permission.
4. **Source mic**: your real mic.
5. **Output device**: `★ meeting-translator` (the star confirms the highlight pattern matched).
6. **Target language**: pick.
7. Click **Start translating**.

## 7. Verify

In another window, open <https://zoom.us/test>. Speak Vietnamese; you should hear translated audio in the Zoom test playback.

## Troubleshooting (Linux-specific)

| Symptom | Likely cause | Fix |
|---|---|---|
| `meeting-translator` missing from sinks | `pactl load-module` not run after reboot | Re-run the command, or persist via the conf file in §3 |
| Star badge missing in app | Sink name differs from `meeting-translator` | Recreate sink with exact name |
| Wayland: Chrome can't list devices | xdg-desktop-portal not running | `systemctl --user start xdg-desktop-portal` |
| Chrome shows no `Monitor of …` device | PulseAudio compat layer missing | `sudo apt install pipewire-pulse` (or your distro's equivalent) and re-login |
| Zoom mic level stays at 0 | Wrong source picked in `pavucontrol` Recording tab | In `pavucontrol`, set Zoom's source to `Monitor of meeting-translator` |
| Audio glitches / underruns | Quantum size too small | `pw-metadata -n settings 0 clock.force-quantum 1024` |

---

↑ Back to [README](../README.md) · → See [troubleshooting](./troubleshooting.md) · See also [cost-and-limits](./cost-and-limits.md)
