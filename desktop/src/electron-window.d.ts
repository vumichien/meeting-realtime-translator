export {};

declare global {
  interface Window {
    electron?: {
      readonly serverUrl?: string;
      readonly appVersion?: string;
      readonly platform?: string;
      readonly apiKey?: {
        get(): Promise<string | null>;
        set(value: string): Promise<void>;
        clear(): Promise<void>;
      };
      readonly keyring?: {
        get(): Promise<Record<string, unknown>>;
        set(keyring: Record<string, unknown>): Promise<void>;
        clear(): Promise<void>;
      };
      readonly onboarding?: {
        getState(): Promise<{ completedAt: string | null; stepsDone: number[] }>;
        completeStep(step: number): Promise<{ completedAt: string | null; stepsDone: number[] }>;
        finish(): Promise<{ completedAt: string | null; stepsDone: number[] }>;
      };
      readonly session?: {
        testMint(apiKey: string): Promise<{ ok: boolean; message: string }>;
      };
      readonly shell?: {
        openExternal(url: string): Promise<void>;
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
