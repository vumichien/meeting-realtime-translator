---
phase: 3
title: "Client Session Core (WebRTC)"
status: completed
priority: P1
effort: "4h"
dependencies: [2]
---

# Phase 03: Client Session Core (WebRTC)

## Overview
Browser-side translation session: capture mic, mint server token, open WebRTC PeerConnection to OpenAI `/v1/realtime/translations/calls`, pipe translated audio to a hidden `<audio>` element, expose start/stop API. Language hardcoded to `ja` for first pass (phase 06 wires UI).

## Requirements

**Functional**
- `startSession({ targetLanguage, micDeviceId })` returns a session handle
- `stopSession(handle)` cleanly closes PC + tracks + audio element
- `oai-events` data channel events surface via callback (consumed by captions phase)
- Hidden `<audio>` element plays translated audio (output routing wired in phase 04)

**Non-functional**
- `translation-session.ts` < 200 lines (split if needed)
- No memory leaks across start/stop cycles
- Reconnect handling: if PC fails, callback fires with error; UI decides retry

## Architecture

```
startSession()
  │
  ├─ fetch POST /session → {client_secret}
  ├─ getUserMedia({audio:{deviceId, echoCancellation, noiseSuppression}})
  ├─ pc = new RTCPeerConnection()
  ├─ pc.addTrack(micTrack)
  ├─ events = pc.createDataChannel("oai-events")
  ├─ events.onmessage → onEvent(JSON.parse(data))
  ├─ pc.ontrack → audio.srcObject = stream
  ├─ pc.createOffer / setLocalDescription
  ├─ POST .../translations/calls with offer.sdp, Authorization: Bearer client_secret
  └─ pc.setRemoteDescription({type:"answer", sdp: response.text()})

stopSession(handle)
  ├─ pc.close()
  ├─ micTrack.stop()
  ├─ audio.srcObject = null
  └─ remove audio element from DOM (or reuse)
```

## Related Code Files

**Create**
- `client/src/translation-session.ts` — session lifecycle (start/stop, reconnect-on-error)
- `client/src/webrtc-sdp.ts` — SDP offer/answer exchange helper (if size pressures split)
- `client/src/types.ts` — shared event/handle types

**Modify**
- `client/src/main.ts` — temporary debug buttons (start/stop) wired to module; replaced in phase 06

## Implementation Steps

1. Create `client/src/types.ts`:
   ```ts
   export type SessionEvent =
     | { type: "session.input_transcript.delta"; delta: string }
     | { type: "session.output_transcript.delta"; delta: string }
     | { type: "error"; error: { message: string; code?: string } };
   export interface SessionHandle { stop(): void; }
   ```
2. Implement `translation-session.ts` per architecture above. Key contract:
   ```ts
   export async function startSession(opts: {
     targetLanguage: string;
     micDeviceId: string;
     onEvent: (event: SessionEvent) => void;
     onStateChange?: (state: RTCPeerConnectionState) => void;
   }): Promise<SessionHandle>;
   ```
3. SDP exchange:
   ```ts
   const sdpRes = await fetch(
     "https://api.openai.com/v1/realtime/translations/calls",
     { method: "POST",
       headers: { Authorization: `Bearer ${client_secret}`, "Content-Type": "application/sdp" },
       body: offer.sdp });
   if (!sdpRes.ok) throw new Error(`SDP exchange failed: ${sdpRes.status}`);
   await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });
   ```
4. Wire `pc.onconnectionstatechange` → `onStateChange(pc.connectionState)`.
5. Audio element: create one hidden `<audio autoplay>` per session in DOM; assign `srcObject` on `pc.ontrack`. Expose element reference on the handle so phase 04 can call `setSinkId` on it.
6. Implement `stopSession`: clear datachannel handlers, `pc.close()`, stop all tracks of mic stream, set `audio.srcObject = null`, remove element from DOM.
7. Temporary debug UI in `main.ts`: two buttons "Start (JA)" / "Stop", `onEvent` logs to console. Manually verify in browser.
8. Cycle test: start → stop → start → stop 5 times. Check Chrome DevTools Memory tab: no growing media stream graph.

## Success Criteria

- [x] Speaking VI into mic with `targetLanguage="ja"`, console shows `output_transcript.delta` events arriving
- [x] Translated audio audibly plays through default speakers (output routing in phase 04 redirects)
- [x] Stop button cleanly terminates session; no console errors; mic LED off
- [x] Restart after stop works (no stale RTCPeerConnection state)
- [x] `translation-session.ts` < 200 lines (split into `webrtc-sdp.ts` if larger)

## Risk Assessment

- **Browser autoplay policy** — `<audio>` may not autoplay before user gesture. Mitigation: session starts on button click (user gesture). Document.
- **ICE/STUN failures behind corporate proxies** — out of scope for v1; document as "won't work on locked-down networks".
- **`client_secret` expiry mid-session** — sessions are short-lived; in practice the PC stays open after handshake. If user keeps app running for hours, may need refresh. Defer to v1.1.
- **DataChannel message ordering** — JSON.parse defensively; ignore unknown event types.
