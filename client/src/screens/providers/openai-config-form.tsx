// OpenAI provider config form — API key field with reveal toggle.

import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApiKeyProvider } from "@/hooks/use-api-key";

interface OpenAIConfigFormProps {
  onSave?: () => void;
}

export function OpenAIConfigForm({ onSave }: OpenAIConfigFormProps): React.JSX.Element {
  const [revealed, setRevealed] = useState(false);
  const [keyValue, setKeyValue] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const { get, set } = useApiKeyProvider();

  useEffect(() => {
    // Load existing key on mount (will be masked by type=password)
    get().then((v) => setKeyValue(v)).catch(() => {});
  }, [get]);

  async function handleSave() {
    const trimmed = keyValue.trim();
    if (trimmed.length < 20) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    try {
      await set(trimmed);
      setStatus("saved");
      onSave?.();
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          OpenAI API key
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={revealed ? "text" : "password"}
              value={keyValue}
              onChange={(e) => {
                setKeyValue(e.target.value);
                setStatus("idle");
              }}
              placeholder="sk-..."
              autoComplete="off"
              spellCheck={false}
              className="pr-10"
            />
            <button
              type="button"
              aria-label={revealed ? "Hide API key" : "Show API key"}
              onClick={() => setRevealed((r) => !r)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button onClick={handleSave} disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved!" : "Save"}
          </Button>
        </div>
        {status === "error" && (
          <p className="mt-1 text-xs text-destructive">
            Key too short — paste a valid OpenAI key (starts with sk-…).
          </p>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">
          Your key is stored locally via safeStorage and never sent to our servers.
        </p>
      </div>
    </div>
  );
}
