// Local provider placeholder — disabled card with "Coming soon" badge.
// The full implementation lives in the planned offline-local-translation-provider phase.

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LocalComingSoon(): React.JSX.Element {
  return (
    <Card className="cursor-not-allowed opacity-60" aria-disabled="true">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Local Model</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Coming soon
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Run translation entirely on-device — no API key required. Zero network latency,
          full privacy.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs font-normal">
            &lt;500ms
          </Badge>
          <Badge variant="outline" className="text-xs font-normal">
            Free
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
