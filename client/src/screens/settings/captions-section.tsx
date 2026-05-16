// captions-section.tsx — Advanced captions settings.
// Slider: mt.captions_flush_idle_ms (500–3000, step 100).
// Switches: mt.captions_flush_on_punctuation, mt.transcribe_source.

import React from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/use-settings";

export function CaptionsSection(): React.JSX.Element {
  const { settings, set } = useSettings();

  const flushIdleMs = settings["mt.captions_flush_idle_ms"];
  const flushOnPunctuation = settings["mt.captions_flush_on_punctuation"];
  const transcribeSource = settings["mt.transcribe_source"];

  return (
    <div className="flex flex-col gap-5">
      {/* Idle flush delay */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Idle flush delay</p>
            <p className="text-xs text-muted-foreground">
              How long to wait after silence before finalizing a caption line.
            </p>
          </div>
          <span className="text-sm font-mono text-muted-foreground shrink-0 ml-4">
            {(flushIdleMs / 1000).toFixed(1)}s
          </span>
        </div>
        <Slider
          min={500}
          max={3000}
          step={100}
          value={[flushIdleMs]}
          onValueChange={([v]) => set("mt.captions_flush_idle_ms", v)}
          aria-label="Idle flush delay"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0.5s (snappy)</span>
          <span>3.0s (relaxed)</span>
        </div>
      </div>

      {/* Flush on punctuation */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Flush on punctuation</p>
          <p className="text-xs text-muted-foreground">
            Finalize caption lines at sentence boundaries (., ?, !).
          </p>
        </div>
        <Switch
          checked={flushOnPunctuation}
          onCheckedChange={(checked) =>
            set("mt.captions_flush_on_punctuation", checked)
          }
          aria-label="Flush captions on punctuation"
        />
      </div>

      {/* Transcribe source */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Show source transcription</p>
          <p className="text-xs text-muted-foreground">
            Display the original speech text alongside the translation.
          </p>
        </div>
        <Switch
          checked={transcribeSource}
          onCheckedChange={(checked) => set("mt.transcribe_source", checked)}
          aria-label="Show source transcription"
        />
      </div>
    </div>
  );
}
