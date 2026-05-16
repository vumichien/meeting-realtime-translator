export {};

declare global {
  interface Window {
    electron?: {
      readonly serverUrl?: string;
      readonly appVersion?: string;
      readonly apiKey?: {
        get(): Promise<string | null>;
        set(value: string): Promise<void>;
        clear(): Promise<void>;
      };
      readonly onboarding?: {
        getState(): Promise<{ completedAt: string | null; stepsDone: number[] }>;
        completeStep(step: number): Promise<{ completedAt: string | null; stepsDone: number[] }>;
        finish(): Promise<{ completedAt: string | null; stepsDone: number[] }>;
      };
      readonly platform?: string;
      /** Phase 7: triggers native vibrancy (macOS) or Mica (Windows 11 22H2+). */
      readonly setSurfaceStyle?: (
        style: "solid" | "translucent",
      ) => Promise<{ ok: boolean; platform: string }>;
      readonly session?: {
        testMint(apiKey: string): Promise<{ ok: boolean; message: string }>;
      };
      readonly shell?: {
        openExternal(url: string): Promise<void>;
        /** Phase 7: wired in main process. Optional until IPC is registered. */
        openLogsFolder?(): Promise<void>;
      };
      readonly telemetry?: {
        getConsent(): Promise<boolean | null>;
        setConsent(consent: boolean): Promise<void>;
        deleteData(): Promise<void>;
        track(name: string, properties?: Record<string, unknown>): Promise<void>;
      };
    };
  }
}
