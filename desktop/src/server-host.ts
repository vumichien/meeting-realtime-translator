import { fork, type ChildProcess } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface HostedServer {
  readonly url: string;
  stop(): void;
}

type ReadyMessage =
  | { type: "ready"; port: number }
  | { type: "error"; code?: string; message?: string };

const MAX_START_ATTEMPTS = 5;
const SERVER_START_TIMEOUT_MS = 15_000;

export async function startHostedServer(isPackaged: boolean): Promise<HostedServer> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_START_ATTEMPTS; attempt += 1) {
    try {
      return await startServerOnce(isPackaged);
    } catch (err) {
      lastError = toError(err);
      if (!lastError.message.includes("EADDRINUSE")) break;
    }
  }

  throw lastError ?? new Error("Failed to start local server.");
}

function startServerOnce(isPackaged: boolean): Promise<HostedServer> {
  const paths = getRuntimePaths(isPackaged);
  const child = fork(paths.serverEntry, [], {
    cwd: paths.serverCwd,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: "0",
      CLIENT_ORIGIN: isPackaged ? "file://" : "http://localhost:5173",
    },
    execArgv: [],
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  child.stdout?.on("data", (data) => process.stdout.write(`[server] ${data}`));
  child.stderr?.on("data", (data) => process.stderr.write(`[server] ${data}`));

  return new Promise((resolvePromise, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      fail(new Error("Timed out waiting for local server to start."));
    }, SERVER_START_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeout);
      child.off("message", onMessage);
      child.off("error", onError);
      child.off("exit", onExit);
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      stopChild(child);
      reject(err);
    };

    const succeed = (port: number) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolvePromise({
        url: `http://127.0.0.1:${port}`,
        stop: () => stopChild(child),
      });
    };

    const onMessage = (message: ReadyMessage) => {
      if (!message || typeof message !== "object") return;
      if (message.type === "ready" && Number.isInteger(message.port)) {
        succeed(message.port);
      } else if (message.type === "error") {
        fail(new Error(message.code ? `${message.code}: ${message.message ?? ""}` : message.message));
      }
    };
    const onError = (err: Error) => fail(err);
    const onExit = (code: number | null) => fail(new Error(`Local server exited early with code ${code ?? "unknown"}.`));

    child.on("message", onMessage);
    child.on("error", onError);
    child.on("exit", onExit);
  });
}

function getRuntimePaths(isPackaged: boolean) {
  if (isPackaged) {
    return {
      serverEntry: join(process.resourcesPath, "server", "dist", "index.js"),
      serverCwd: join(process.resourcesPath, "server"),
    };
  }

  const desktopRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const repoRoot = resolve(desktopRoot, "..");
  return {
    serverEntry: join(repoRoot, "server", "dist", "index.js"),
    serverCwd: join(repoRoot, "server"),
  };
}

function stopChild(child: ChildProcess) {
  if (child.killed) return;
  child.kill();
}

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}
