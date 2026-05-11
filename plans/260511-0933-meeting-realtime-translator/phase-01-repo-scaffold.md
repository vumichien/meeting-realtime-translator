---
phase: 1
title: "Repo Scaffold"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 01: Repo Scaffold

## Overview
Bootstrap monorepo with `client/` (Vite + TS) and `server/` (Express + TS) workspaces. Land tooling, licensing, and conventions before any feature code.

## Requirements

**Functional**
- `npm install` at root installs both workspaces
- `npm run dev` runs server + client concurrently
- TypeScript strict mode in both workspaces

**Non-functional**
- All config files <100 lines
- No secrets in repo
- MIT license

## Architecture

Yarn-style workspaces via npm:

```
meeting-auto-translate/
├── package.json          # workspaces: ["client", "server"], scripts.dev = concurrently
├── tsconfig.base.json    # shared compiler opts
├── .gitignore            # node_modules, dist, .env, .env.local
├── .env.example          # OPENAI_API_KEY=
├── LICENSE               # MIT
├── client/               # placeholder index.html, src/main.ts
├── server/               # placeholder src/index.ts
└── scripts/
    ├── dev.ps1
    └── dev.sh
```

Use `concurrently` (root devDep) to spawn `npm --workspace server run dev` and `npm --workspace client run dev`.

## Related Code Files

**Create**
- `package.json` (root, workspaces)
- `tsconfig.base.json`
- `.gitignore`
- `.env.example`
- `LICENSE` (MIT, year 2026, author placeholder)
- `client/package.json` (vite, typescript)
- `client/vite.config.ts`
- `client/tsconfig.json` (extends base)
- `client/index.html` (placeholder)
- `client/src/main.ts` (`console.log("client up")`)
- `server/package.json` (express, dotenv, cors, tsx)
- `server/tsconfig.json` (extends base)
- `server/src/index.ts` (`app.listen(8787, …)`)
- `scripts/dev.ps1`, `scripts/dev.sh`

**Modify**
- None (greenfield)

**Delete**
- None

## Implementation Steps

1. Write root `package.json` with `"workspaces": ["client", "server"]`, `"private": true`, devDeps: `concurrently`, `typescript`.
2. Write `tsconfig.base.json`: `target: ES2022`, `module: ESNext`, `moduleResolution: Bundler`, `strict: true`, `skipLibCheck: true`.
3. Write `.gitignore`: `node_modules/`, `dist/`, `.env`, `.env.local`, `*.log`.
4. Write `.env.example` with:
   ```
   OPENAI_API_KEY=sk-...
   CLIENT_ORIGIN=http://localhost:5173
   ```
   <!-- Updated: Validation Session 1 - add CLIENT_ORIGIN env var (CORS origin override) -->
5. Write `LICENSE` (MIT standard text).
6. Scaffold `client/`: `npm create vite@latest client -- --template vanilla-ts` (overwrite into placeholder), keep `src/main.ts` minimal.
7. Scaffold `server/`: `package.json` with `tsx watch src/index.ts` as `dev` script, deps `express`, `cors`, `dotenv`, devDeps `@types/express`, `@types/cors`, `tsx`, `typescript`.
8. Write minimal `server/src/index.ts` that loads dotenv, sets up CORS for `localhost:5173`, listens on `8787`, logs the port.
9. Write `scripts/dev.ps1` and `dev.sh` invoking `npm run dev` from root (single source of truth).
10. Root `npm install`, then `npm run dev` — verify both ports come up.
11. Run `tsc --noEmit` in each workspace — must pass clean.

## Success Criteria

- [x] `npm install` at root succeeds, no warnings about missing peer deps
- [x] `npm run dev` starts Vite on :5173 and Express on :8787 concurrently
- [x] Browser at `http://localhost:5173` shows blank page with `client up` in console
- [x] `curl http://localhost:8787/health` returns 200 (add trivial health route)
- [x] `tsc --noEmit` passes in both workspaces
- [x] No `.env` committed; `.env.example` is the only env file in git

## Risk Assessment

- **npm workspaces quirks on Windows** — symlinks may need admin or `npm config set script-shell pwsh`. Mitigation: document in README if hit.
- **Vite default template churn** — pin Vite version (`^5`) to avoid breaking changes mid-project.
