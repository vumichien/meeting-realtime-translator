// Banner shown when microphone permission is denied (device labels are empty).
// Uses shadcn Alert with destructive variant + action button to request access.

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface PermissionsBannerProps {
  visible: boolean;
  onRequestPermission: () => void;
}

/**
 * Inline destructive alert that prompts the user to grant microphone access.
 * Rendered only when `visible` is true (i.e., device labels are empty).
 */
export function PermissionsBanner({
  visible,
  onRequestPermission,
}: PermissionsBannerProps): React.JSX.Element | null {
  if (!visible) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Microphone access required</AlertTitle>
      <AlertDescription className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Device names are hidden until microphone permission is granted. Grant
          access so you can choose the right input device.
        </span>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={onRequestPermission}
        >
          Grant microphone access
        </Button>
      </AlertDescription>
    </Alert>
  );
}
