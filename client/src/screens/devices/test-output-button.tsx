// Button that plays a 1-second 440 Hz test tone through the selected output device.
// Uses Web Audio API + setSinkId when available; falls back to default output.

import React, { useCallback, useRef, useState } from "react";
import { Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TestOutputButtonProps {
  /** deviceId of the output device to test; empty string means default. */
  outputId: string;
}

/**
 * Plays a 1 s 440 Hz sine-wave tone through the given output device.
 * Uses Web Audio API for tone generation, routes through an <audio> element
 * with setSinkId so the correct device receives audio.
 */
export function TestOutputButton({ outputId }: TestOutputButtonProps): React.JSX.Element {
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback(async () => {
    if (playing) return;
    setPlaying(true);

    try {
      // Close any existing context to avoid accumulation
      audioCtxRef.current?.close();
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 440;
      // Fade out over the last 100 ms to avoid click
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.9);

      osc.connect(gain);

      // Route through MediaStreamDestination so we can target setSinkId
      if (outputId && typeof AudioContext !== "undefined") {
        const dest = ctx.createMediaStreamDestination();
        gain.connect(dest);

        const audioEl = new Audio();
        audioEl.srcObject = dest.stream;

        // setSinkId routes audio to the chosen output device
        if (outputId && typeof (audioEl as any).setSinkId === "function") {
          await (audioEl as any).setSinkId(outputId);
        }

        await audioEl.play();
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1);

        osc.onended = () => {
          audioEl.pause();
          audioEl.srcObject = null;
          ctx.close();
          setPlaying(false);
        };
      } else {
        // Fallback: connect directly to default output via AudioContext destination
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1);
        osc.onended = () => {
          ctx.close();
          setPlaying(false);
        };
      }

      toast.success("Playing test tone…");
    } catch (err) {
      console.error("[test-output-button] tone failed", err);
      toast.error("Could not play test tone. Check browser permissions.");
      setPlaying(false);
    }
  }, [outputId, playing]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={playTone}
      disabled={playing}
      aria-label="Play test tone through selected output device"
      className="gap-2"
    >
      {playing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      {playing ? "Playing…" : "Test output"}
    </Button>
  );
}
