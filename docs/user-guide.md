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
4. **Devices:** Pick your real microphone and the virtual cable output. Play the test tone.
5. **Zoom or Meet:** Set the meeting app microphone to the virtual cable.

You can rerun the wizard later from **Help → Run setup wizard again**.

## Daily Use

1. Open Babel Mic.
2. Pick your source microphone.
3. Pick the virtual cable as output.
4. Pick the target language.
5. Click **Start translating**.
6. In Zoom or Meet, keep the microphone set to the virtual cable.

## Uninstall

Windows: use **Settings → Apps → Installed apps → Babel Mic → Uninstall**.

Linux: delete the `.AppImage`. If you created menu entries, remove them from your app launcher.

## FAQ

**The wizard is stuck on the virtual cable step.**
Install VB-CABLE on Windows or configure a PipeWire null sink on Linux, then unplug and replug audio devices or restart Babel Mic.

**Zoom hears silence.**
Check that Zoom microphone is the virtual cable, not your real microphone.

**I hear the translated voice on my speakers.**
Set Babel Mic output to the virtual cable, not your headphones.

**Where is my API key stored?**
In the OS-protected app data folder through Electron `safeStorage` when available. Browser developer mode still uses localStorage.

## Screenshots To Capture Before Release

- Windows SmartScreen warning
- Windows installer
- Linux AppImage permission screen
- Wizard steps 1 through 5
- Main Babel Mic window
