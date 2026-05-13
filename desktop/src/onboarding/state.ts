import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface OnboardingState {
  completedAt: string | null;
  stepsDone: number[];
}

const DEFAULT_STATE: OnboardingState = {
  completedAt: null,
  stepsDone: [],
};

export function getOnboardingStatePath(userDataPath: string): string {
  return join(userDataPath, "onboarding.json");
}

export async function readOnboardingState(path: string): Promise<OnboardingState> {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8")) as Partial<OnboardingState>;
    return normalizeState(parsed);
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveOnboardingState(path: string, state: OnboardingState): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(normalizeState(state), null, 2)}\n`, "utf8");
}

export function markStepDone(state: OnboardingState, step: number): OnboardingState {
  const stepsDone = Array.from(new Set([...state.stepsDone, step])).sort((a, b) => a - b);
  return { ...state, stepsDone };
}

export function completeOnboarding(state: OnboardingState): OnboardingState {
  return {
    completedAt: new Date().toISOString(),
    stepsDone: [1, 2, 3, 4, 5],
  };
}

function normalizeState(input: Partial<OnboardingState>): OnboardingState {
  const stepsDone = Array.isArray(input.stepsDone)
    ? input.stepsDone.filter((step) => Number.isInteger(step) && step >= 1 && step <= 5)
    : [];
  return {
    completedAt: typeof input.completedAt === "string" ? input.completedAt : null,
    stepsDone: Array.from(new Set(stepsDone)).sort((a, b) => a - b),
  };
}
