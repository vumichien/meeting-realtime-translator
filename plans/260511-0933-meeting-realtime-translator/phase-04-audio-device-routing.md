---
phase: 4
title: "Audio Device Routing"
status: completed
priority: P1
effort: "3h"
dependencies: [3]
---

# Phase 04: Audio Device Routing

## Overview
Enumerate audio input + output devices, render mic and output-device pickers, route translated audio to virtual cable via `audioElement.setSinkId()`. Detect VB-CABLE / BlackHole / PipeWire null sinks and highlight them.

## Requirements

**Functional**
- Mic picker lists all `audioinput` devices with labels
- Output picker lists all `audiooutput` devices with labels
- Selecting output device calls `setSinkId(deviceId)` on session audio element
- Highlight (badge or icon) devices whose label matches virtual-cable patterns
- Live update list on device hotplug (`devicechange` event)
- Persist selection (phase 06 handles localStorage write; phase 04 exposes the change callback)

**Non-functional**
- Module <150 lines
- Graceful degradation if `setSinkId` unsupported (Safari/Firefox): show banner
- No labels visible until mic permission granted; phase prompts permission upfront

## Architecture

```
audio-devices.ts
  ├─ async listDevices(): Promise<{ inputs, outputs }>
  ├─ classifyVirtualCable(label): "vb-cable" | "blackhole" | "pipewire" | null
  ├─ subscribeDeviceChanges(callback): unsubscribe
  └─ applyOutputDevice(audioEl, deviceId): Promise<void>  // wraps setSinkId
```

Virtual cable label patterns (case-insensitive substring):
- VB-CABLE: `"CABLE Input"` (the input side of VB-CABLE — what Zoom listens to)
- BlackHole: `"BlackHole"`
- PipeWire null sink: `"meeting-translator"` (recommended sink name in docs)
- VoiceMeeter: `"VoiceMeeter Input"`

## Related Code Files

**Create**
- `client/src/audio-devices.ts` — enumeration, classification, subscription, applyOutputDevice
- `client/src/ui/device-pickers.ts` — DOM rendering for mic + output dropdowns

**Modify**
- `client/src/main.ts` — wire pickers into start-session flow
- `client/src/translation-session.ts` — accept output device id, call applyOutputDevice on audio element after `ontrack`

## Implementation Steps

1. Request mic permission early (one-time): `navigator.mediaDevices.getUserMedia({audio:true})` then immediately stop the track. Without permission, device labels are empty strings.
2. Implement `listDevices()`:
   ```ts
   const devs = await navigator.mediaDevices.enumerateDevices();
   return {
     inputs:  devs.filter(d => d.kind === "audioinput").map(toDeviceInfo),
     outputs: devs.filter(d => d.kind === "audiooutput").map(toDeviceInfo),
   };
   ```
3. `classifyVirtualCable(label)` returns the matched pattern key or null. Used by UI to badge entries.
4. `subscribeDeviceChanges(cb)`: attach to `navigator.mediaDevices.addEventListener("devicechange", …)`, debounce 150ms, call cb with refreshed lists. Return unsubscribe.
5. `applyOutputDevice(audioEl, deviceId)`:
   ```ts
   if (typeof audioEl.setSinkId !== "function") {
     throw new Error("setSinkId unsupported; use Chrome or Edge.");
   }
   await audioEl.setSinkId(deviceId);
   ```
6. Render two `<select>` dropdowns in `ui/device-pickers.ts`. Each option text = `${label}${classify ? " ★" : ""}`. Emit `change` events.
7. Wire in `main.ts`: on output picker change, call `applyOutputDevice(sessionAudioEl, deviceId)`. If no active session yet, store the chosen id and apply on next start.
8. If `setSinkId` unsupported, show a fixed banner: "Output routing requires Chrome or Edge."
9. Manual test on Windows with VB-CABLE installed:
   - Pick "CABLE Input (VB-Audio Virtual Cable)" as output
   - Open Voice Recorder configured to record from "CABLE Output"
   - Speak VI in browser app
   - Voice Recorder captures translated JA audio

## Success Criteria

- [x] Both pickers list real device labels (not empty strings)
- [x] On Windows with VB-CABLE installed, "CABLE Input" appears in output picker with star badge
- [x] Selecting CABLE Input routes audio away from speakers (silent locally, picked up by VB-CABLE Output as input)
- [x] Hotplugging USB headphones triggers picker refresh within ~200ms
- [x] On Safari, the banner shows; app still translates but plays through default sink

## Risk Assessment

- **No label visibility pre-permission** — common gotcha. Mitigation: explicit "Grant mic access" first-run flow.
- **setSinkId may throw `NotAllowedError`** for non-default devices on some browser versions. Mitigation: try/catch, surface message.
- **DeviceId stability** — IDs are stable per origin per device. If user clears site data, persisted IDs in localStorage become invalid; on apply failure, fall back to default sink + show a "device not found, please re-select" message.
- **PipeWire sink labels** vary by distro. Document the exact `pactl load-module module-null-sink` command with `sink_name=meeting-translator sink_properties=device.description=meeting-translator` to make the highlight work.
