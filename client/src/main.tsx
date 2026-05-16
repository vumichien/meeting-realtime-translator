import "@fontsource/inter";
import "./styles/globals.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AppShell } from "@/components/shell/app-shell";

const mountNode = document.getElementById("app");

if (!mountNode) {
  console.error("[main] #app mount point not found in index.html");
} else {
  createRoot(mountNode).render(
    <StrictMode>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </StrictMode>,
  );
}
