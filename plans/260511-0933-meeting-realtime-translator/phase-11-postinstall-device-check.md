---
phase: 11
title: "Postinstall Device Check (Optional / YAGNI)"
status: pending
priority: P3
effort: "1h"
dependencies: [10]
---

# Phase 11: Postinstall Device Check (Optional / YAGNI)

**Status: Deferred to v1.1 per YAGNI gate validation 2026-05-11. Keep as backlog; do NOT implement in v1.**

## Overview
**Only build this if v1 surfaces a real pattern of "no virtual cable" support requests.** Optional Node postinstall script that probes the OS for VB-CABLE / BlackHole / PipeWire null sink and prints a friendly setup nudge if not found.

## YAGNI gate

Skip unless:
- ≥3 GitHub issues in the first 2 weeks of release report variations of "the output device dropdown is empty / I don't see CABLE"
- OR user feedback shows the per-OS setup doc isn't enough

If skipped, leave this phase file in place as a v1.1 backlog item.

## Requirements (if built)

**Functional**
- `npm install` triggers `scripts/postinstall-check.ts` via `package.json`'s `postinstall` hook
- Script detects platform and probes for known virtual cable device names
- On detection: silent (or one-line "✓ Virtual cable detected: <name>")
- On miss: print a clear next-step block with link to `docs/setup-<os>.md`
- Never fails the install (always exits 0)

**Non-functional**
- <100 lines
- No npm dependencies beyond what's already in repo
- Cross-platform: works on win32, darwin, linux

## Architecture

```
postinstall-check.ts
  ├─ if win32: exec `powershell Get-AudioDevice -List` (or pwsh fallback)
  │             OR query registry: `reg query HKLM\SYSTEM\CurrentControlSet\Enum\SWD\MMDEVAPI`
  ├─ if darwin: exec `system_profiler SPAudioDataType -json`
  ├─ if linux: exec `pactl list short sinks`
  ├─ match output against virtual-cable patterns from audio-devices.ts
  └─ print result (always exit 0)
```

## Related Code Files

**Create**
- `scripts/postinstall-check.ts`

**Modify**
- `package.json` (root) — add `"postinstall": "tsx scripts/postinstall-check.ts || true"` (the `|| true` belt-and-suspenders; script already exits 0)

## Implementation Steps

1. Implement `scripts/postinstall-check.ts`:
   ```ts
   import { execFileSync } from "node:child_process";
   import { platform } from "node:process";

   function tryExec(cmd: string, args: string[]): string {
     try { return execFileSync(cmd, args, { encoding: "utf8" }); }
     catch { return ""; }
   }
   ```
2. Per-platform probes:
   - **win32**: `tryExec("powershell", ["-c", "Get-CimInstance Win32_SoundDevice | Select-Object Name | ConvertTo-Json"])`. Match for "CABLE" or "VB-Audio".
   - **darwin**: `tryExec("system_profiler", ["SPAudioDataType", "-json"])`. Match for "BlackHole".
   - **linux**: `tryExec("pactl", ["list", "short", "sinks"])`. Match for "meeting-translator" or any null sink.
3. On match: `console.log("  ✓ Virtual audio cable detected.");` exit 0.
4. On miss: print:
   ```
   ──────────────────────────────────────────────────────
    Next step: install a virtual audio cable.
    See: docs/setup-<os>.md
   ──────────────────────────────────────────────────────
   ```
   Exit 0 (do not block install).
5. Test on each OS:
   - With cable installed → detection message
   - Without cable → setup nudge
   - In CI without audio → silent miss path acceptable
6. Update README to mention this optional pre-flight: "After `npm install`, you'll see a notice if no virtual cable is detected."

## Success Criteria

- [ ] `npm install` on a machine without VB-CABLE prints the nudge once
- [ ] `npm install` with VB-CABLE prints the detection success line
- [ ] Script never fails install (exit 0 always)
- [ ] No new dependencies added to root package.json
- [ ] Works on Win/Mac/Linux

## Risk Assessment

- **Postinstall scripts are flaky in CI** — `|| true` in `package.json` plus internal exit-0 guarantee = harmless.
- **PowerShell unavailable in trimmed Windows containers** — `tryExec` returns empty, falls through to "miss" message. Acceptable.
- **system_profiler is slow on macOS (~2s)** — run async, don't block install perceptibly.
- **Security scanners flagging postinstall scripts** — minimize attack surface, no network calls, no file writes outside `console.log`. Document this guarantee in script header comment.
- **Scope creep** — resist adding "auto-install" features here; that path leads to elevation prompts and AV false positives. Detection + nudge only.
