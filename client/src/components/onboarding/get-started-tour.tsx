import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Joyride,
  STATUS,
  type EventData,
  type Step,
} from "react-joyride";
import { useSettings } from "@/hooks/use-settings";
import { useSession } from "@/hooks/use-session";
import type { View } from "@/components/shell/shell-types";
import {
  GET_STARTED_TOUR_STEPS,
  TOUR_IDS,
  type GetStartedTourStep,
} from "./get-started-tour-steps";
import { TourTooltip } from "./get-started-tour-tooltip";
import {
  isGetStartedTourComplete,
  markGetStartedTourComplete,
} from "./get-started-tour-storage";

interface GetStartedTourProps {
  view: View;
  setView: (view: View) => void;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function shouldExpandSidebar(step: GetStartedTourStep): boolean {
  return step.target.includes(TOUR_IDS.sidebarNav);
}

export function GetStartedTour({
  view,
  setView,
  collapsed,
  setCollapsed,
}: GetStartedTourProps): React.JSX.Element {
  const { settings, set: setSetting } = useSettings();
  const session = useSession();
  const [run, setRun] = useState(false);

  const complete = isGetStartedTourComplete(settings);
  const sessionIdle = session.state === "idle";

  const finishTour = useCallback(() => {
    setRun(false);
    markGetStartedTourComplete(setSetting);
  }, [setSetting]);

  useEffect(() => {
    if (!run) return;

    function handleEscape(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      event.preventDefault();
      finishTour();
    }

    document.addEventListener("keydown", handleEscape, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleEscape, { capture: true });
    };
  }, [finishTour, run]);

  const steps = useMemo<Step[]>(
    () =>
      GET_STARTED_TOUR_STEPS.map((step) => ({
        id: step.id,
        target: step.target,
        title: step.title,
        content: step.content,
        placement: step.placement ?? "bottom",
        before: async () => {
          if (step.view !== "current" && step.view !== view) {
            setView(step.view);
          }
          if (shouldExpandSidebar(step) && collapsed) {
            setCollapsed(false);
          }
          await waitForPaint();
          if (step.target !== "body") {
            const el = document.querySelector(step.target as string);
            el?.scrollIntoView({ block: "nearest", behavior: "instant" });
          }
        },
      })),
    [collapsed, setCollapsed, setView, view],
  );

  useEffect(() => {
    if (complete || !sessionIdle) {
      setRun(false);
      return;
    }

    const timer = window.setTimeout(() => setRun(true), 350);
    return () => window.clearTimeout(timer);
  }, [complete, sessionIdle]);

  const handleEvent = useCallback(
    (data: EventData) => {
      if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
        finishTour();
      }
    },
    [finishTour],
  );

  return (
    <Joyride
      continuous
      run={run}
      scrollToFirstStep
      steps={steps}
      tooltipComponent={TourTooltip}
      onEvent={handleEvent}
      options={{
        blockTargetInteraction: true,
        closeButtonAction: "skip",
        dismissKeyAction: false,
        overlayClickAction: false,
        overlayColor: "rgba(15, 23, 42, 0.72)",
        spotlightPadding: 8,
        spotlightRadius: 6,
        targetWaitTimeout: 2000,
        zIndex: 80,
      }}
    />
  );
}
