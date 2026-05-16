// DiagnosticsScreen — tabbed panel: Setup Doctor | Latency | Developer (gated).
// Developer tab visibility gated by localStorage mt.developer_mode === 'true'.

import React, { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { SetupDoctorPanel } from "./setup-doctor-panel";
import { LatencyChart } from "./latency-chart";
import { DebugEventLog } from "./debug-event-log";

function useDeveloperMode(): boolean {
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem("mt.developer_mode") === "true",
  );

  useEffect(() => {
    // Listen for storage changes from other tabs / settings toggles.
    function onStorage(e: StorageEvent) {
      if (e.key === "mt.developer_mode") {
        setEnabled(e.newValue === "true");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return enabled;
}

export function DiagnosticsScreen(): React.JSX.Element {
  const developerMode = useDeveloperMode();

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-foreground">Diagnostics</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Verify your audio setup, monitor translation latency, and export debug bundles.
      </p>

      <Tabs defaultValue="setup" className="mt-6">
        <TabsList>
          <TabsTrigger value="setup">Setup Doctor</TabsTrigger>
          <TabsTrigger value="latency">Latency</TabsTrigger>
          {developerMode && (
            <TabsTrigger value="developer">Developer</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="setup" className="mt-4">
          <SetupDoctorPanel />
        </TabsContent>

        <TabsContent value="latency" className="mt-4">
          <LatencyChart />
        </TabsContent>

        {developerMode && (
          <TabsContent value="developer" className="mt-4">
            <DebugEventLog />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
