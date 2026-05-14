# Babel Mic User Guide

This guide is for people who want the desktop app and do not want to use the command line.

## Download

1. Open the latest GitHub Release.
2. Windows: download the `.exe` installer.
3. Linux: download the `.AppImage`.

## Install On Windows

1. Double-click the installer.
2. If Windows SmartScreen appears, click **More info**, then **Run anyway**.
3. Choose the install folder, then finish the installer.
4. Open **Babel Mic** from the Start menu.

Unsigned apps commonly show the SmartScreen warning. Babel Mic v0.2 does not use paid code signing yet.

## Install On Linux

1. Download the `.AppImage`.
2. Right-click it, open **Properties**, and allow it to run as a program.
3. Or run:

```bash
chmod +x Babel-Mic-*.AppImage
./Babel-Mic-*.AppImage
```

If your distro blocks AppImage FUSE, run it with `--appimage-extract-and-run`.

## First Run Wizard

Babel Mic opens a setup wizard the first time it starts.

1. **Welcome:** Start the setup.
2. **Virtual cable:** Install a virtual audio cable. This is a small audio device that lets Zoom or Meet hear Babel Mic.
3. **OpenAI key:** Paste your OpenAI API key. Babel Mic stores it using your operating system protection.
4. **Devices in Babel Mic:** Pick your real microphone as **Source mic**. Pick the virtual audio input/playback side as **Output device**, then confirm the routing.
   - Windows: `CABLE Input (VB-Audio Virtual Cable)`
   - macOS: `BlackHole 2ch`
   - Linux: `meeting-translator`
5. **Zoom or Meet:** Set the meeting app microphone to virtual audio and confirm the meeting app speaker is your real headphones or speakers.
   - Windows: `CABLE Output (VB-Audio Virtual Cable)`
   - macOS: `BlackHole 2ch`
   - Linux: `Monitor of meeting-translator`

Open a GitHub issue if setup fails or you need a feature. Star the project if Babel Mic helps you.

You can rerun the wizard later from **Help → Run setup wizard again**.

## Daily Use

1. Open Babel Mic.
2. In Babel Mic, pick your real microphone as **Source mic**.
3. In Babel Mic, pick the cable playback side as **Output device**.
4. Pick the target language.
5. Click **Start translating**.
6. In Zoom or Meet, keep **Microphone** set to the cable recording side.
7. In Zoom or Meet, keep **Speaker** set to your headphones or speakers.

## Uninstall

Windows: use **Settings → Apps → Installed apps → Babel Mic → Uninstall**.

Linux: delete the `.AppImage`. If you created menu entries, remove them from your app launcher.

## FAQ

**The wizard is stuck on the virtual cable step.**
Install VB-CABLE on Windows or configure a PipeWire null sink on Linux, then unplug and replug audio devices or restart Babel Mic.

**Zoom hears silence.**
Check that Zoom microphone is the cable recording side, not your real microphone. On Windows this is `CABLE Output`, while Babel Mic output must be `CABLE Input`.

**I hear the translated voice on my speakers.**
Set Babel Mic output to the cable playback side, not your headphones. In the meeting app, headphones belong in **Speaker**, not **Microphone**.

**Where is my API key stored?**
In the OS-protected app data folder through Electron `safeStorage` when available. Browser developer mode still uses localStorage.

## Screenshots To Capture Before Release

- Windows SmartScreen warning
- Windows installer
- Linux AppImage permission screen
- Wizard steps 1 through 5
- Main Babel Mic window
