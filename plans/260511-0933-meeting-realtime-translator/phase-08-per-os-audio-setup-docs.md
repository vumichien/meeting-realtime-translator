---
phase: 8
title: "Per-OS Audio Setup Docs"
status: completed
priority: P2
effort: "3h"
dependencies: [6]
---

# Phase 08: Per-OS Audio Setup Docs

## Overview
Author three per-OS audio setup guides covering virtual-cable install, Zoom/Meet configuration, and verification. These are the most-likely failure point for new users — clear screenshots and exact wording matter.

## Requirements

**Functional**
- `docs/setup-windows.md` — VB-CABLE install + Zoom/Meet setup
- `docs/setup-macos.md` — BlackHole 2ch install + Zoom/Meet setup
- `docs/setup-linux.md` — PipeWire null sink + Zoom/Meet setup
- Each doc: install steps, system-audio config, app-side verification, screenshots placeholder

**Non-functional**
- Each doc <300 lines (long-form OK; <800 cap per project rule)
- Imperative, numbered steps
- Cross-link from README

## Architecture

Doc structure pattern (same across all three):

```
# Setup — <OS>
## 1. Install virtual audio cable
## 2. Verify the OS sees it
## 3. Configure Zoom (Settings → Audio)
## 4. Configure Google Meet (in-call settings)
## 5. Run the app and pick devices
## 6. Verify: speak Vietnamese, confirm translated audio in Zoom test call
## Troubleshooting (OS-specific)
```

## Related Code Files

**Create**
- `docs/setup-windows.md`
- `docs/setup-macos.md`
- `docs/setup-linux.md`
- `docs/_images/` directory (screenshots placeholder; real screenshots added in phase 09)

## Implementation Steps

### Windows
1. Download VB-CABLE from `vb-audio.com/Cable/` (free, donation-ware).
2. Right-click installer → "Run as administrator". Reboot if prompted.
3. Verify: Sound settings → Recording tab → "CABLE Output" present. Playback tab → "CABLE Input" present.
4. Zoom: Settings → Audio → Microphone dropdown → "CABLE Output (VB-Audio Virtual Cable)". Speaker = your real headphones. Disable "Automatically adjust microphone volume".
5. Google Meet: in-call → ⋮ → Settings → Audio → Microphone = "CABLE Output". Speakers = your real headphones.
6. App: Source mic = your real mic. Output device = "CABLE Input". Target language = Japanese (or other).
7. Test: Zoom test call (`https://zoom.us/test`) — speak VI, hear yourself in JA on playback.

### macOS
1. Install BlackHole 2ch via Homebrew: `brew install blackhole-2ch`. Or download `.pkg` from `existential.audio/blackhole/`.
2. Verify: Audio MIDI Setup → Audio Devices → "BlackHole 2ch" present as both input and output.
3. Optional: create a Multi-Output Device combining BlackHole + your headphones so you can monitor.
4. Grant Chrome mic + screen-share permissions in System Settings → Privacy & Security.
5. Zoom: Settings → Audio → Microphone = "BlackHole 2ch". Speaker = your headphones.
6. App: pick BlackHole as output device; verify ★ badge.
7. Test in Zoom test call.

### Linux
1. Ensure PipeWire (most modern distros). Verify: `pactl info | grep "Server Name"`.
2. Create a null sink:
   ```bash
   pactl load-module module-null-sink \
     sink_name=meeting-translator \
     sink_properties=device.description=meeting-translator
   ```
3. Persist across reboot: add the line to `~/.config/pipewire/pipewire.conf.d/null-sink.conf` (provide exact config snippet).
4. Verify: `pactl list short sinks` shows `meeting-translator`.
5. Zoom (Linux client) Settings → Audio → Microphone → `Monitor of meeting-translator`.
6. App: output device = `meeting-translator`. Star badge appears (matches the recommended name).
7. Test in Zoom test call.

### Implementation Steps (for the doc files themselves)

1. Author `docs/setup-windows.md` with §1-7 above and a Windows-specific troubleshooting section: "CABLE Output missing → reboot", "Zoom hears nothing → check VB-CABLE not muted in Sound mixer", "Echo → user is monitoring CABLE Input on speakers".
2. Author `docs/setup-macos.md` similarly. macOS troubleshooting: "BlackHole not in Audio MIDI Setup → check Privacy & Security → Audio Input", "Permissions: Chrome must have mic + screen recording".
3. Author `docs/setup-linux.md`. Linux-specific notes: Wayland may need PipeWire-specific mic permission grants; document `wireplumber` over PulseAudio compat layer if user is on a hybrid distro.
4. Reserve `docs/_images/<os>-<step>.png` placeholders — actual screenshots added in phase 09 alongside README.
5. Cross-link: each doc ends with "↑ Back to [README](../README.md)" and "→ See [troubleshooting](./troubleshooting.md)".

## Success Criteria

- [x] A user following Windows doc top-to-bottom reaches first translated audio in Zoom test call
- [x] Same for macOS path
- [x] Linux doc lists exact `pactl` commands and matches the highlight pattern in `audio-devices.ts`
- [x] Each doc has its own troubleshooting subsection with at least 3 entries
- [x] All three docs link back to README

## Risk Assessment

- **Zoom UI changes** — Zoom periodically reorganizes Settings. Doc dates may rot. Include "as of 2026-05" disclaimer + Zoom version reference.
- **VB-CABLE installer can be flagged by AV** — common, mention "false positive, verify signature".
- **macOS BlackHole 16ch vs 2ch** — recommend 2ch for stereo simplicity. Note 16ch exists for power users.
- **Linux distro fragmentation** — focus on PipeWire (Fedora 36+, Ubuntu 22.10+). Mention pulseaudio fallback is community-supported.
