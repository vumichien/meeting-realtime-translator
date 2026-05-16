import { useCallback, useState } from "react";
import { apiKey } from "./_registry";

// ApiKeyProvider is async-only — no synchronous snapshot — so we use local
// useState + callbacks rather than useSyncExternalStore.
export function useApiKeyProvider() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const get = useCallback(async (): Promise<string> => {
    const value = await apiKey.get();
    setHasKey(!!value);
    return value;
  }, []);

  const set = useCallback(async (value: string): Promise<void> => {
    await apiKey.set(value);
    setHasKey(!!value.trim());
  }, []);

  const clear = useCallback(async (): Promise<void> => {
    await apiKey.clear();
    setHasKey(false);
  }, []);

  return { get, set, clear, hasKey };
}
