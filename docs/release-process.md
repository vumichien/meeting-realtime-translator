# Desktop Release Process

Use this checklist for Babel Mic desktop releases.

## Before Tagging

- [ ] Bump version in root `package.json` and `desktop/package.json`.
- [ ] Update `docs/project-changelog.md`.
- [ ] Run `npm install`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run app:build:dir`.
- [ ] Smoke test `desktop/dist/win-unpacked/Babel Mic.exe` locally.
- [ ] Confirm no `.env`, API key, or local app data file is staged.

## Release Candidate

- [ ] Push tag `v0.2.0-rc.1`.
- [ ] Verify the release workflow produces Windows, Linux, and macOS artifacts.
- [ ] Confirm the release has exactly one macOS `.dmg` asset.
- [ ] Download artifacts on clean Windows 11, Ubuntu 22.04, and macOS machines.
- [ ] Run the full setup wizard.
- [ ] Start one test translation session.
- [ ] Restart the app and confirm settings persist.
- [ ] Clear and re-add the API key.
- [ ] Rerun setup from the Help menu.
- [ ] On macOS, mount the `.dmg`, copy Babel Mic to Applications, open it, and confirm any not-notarized app warning matches the user guide.
- [ ] On Apple Silicon, confirm the universal DMG opens Babel Mic without an architecture/signing crash.

## Publish

- [ ] Fix blockers found in RC testing.
- [ ] Push final tag `v0.2.0`.
- [ ] Verify final `.exe`, `.AppImage`, and `.dmg` artifacts.
- [ ] Publish GitHub Release notes from the changelog.
- [ ] Keep `feat/electron-desktop-app` unmerged until the release gate passes.
