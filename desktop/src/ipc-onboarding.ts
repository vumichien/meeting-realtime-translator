import { ipcMain } from "electron";
import {
  completeOnboarding,
  markStepDone,
  readOnboardingState,
  saveOnboardingState,
  type OnboardingState,
} from "./onboarding/state.js";

export function registerOnboardingIpc(statePath: string) {
  ipcMain.handle("onboarding:get-state", () => readOnboardingState(statePath));

  ipcMain.handle("onboarding:complete-step", async (_event, step: unknown) => {
    if (!Number.isInteger(step)) throw new Error("Step must be an integer.");
    const nextState = markStepDone(await readOnboardingState(statePath), Number(step));
    await saveOnboardingState(statePath, nextState);
    return nextState;
  });

  ipcMain.handle("onboarding:finish", async () => {
    const nextState = completeOnboarding(await readOnboardingState(statePath));
    await saveOnboardingState(statePath, nextState);
    return nextState;
  });
}

export type { OnboardingState };
