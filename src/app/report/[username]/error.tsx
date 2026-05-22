"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/common/Typography";

export default function ReportError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center gap-6 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <Typography variant="h2" className="text-foreground">
        Analysis Failed
      </Typography>
      <Typography variant="muted" className="text-foreground/70 max-w-md">
        {error.message}
      </Typography>
      <Button
        onClick={reset}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Try Again
      </Button>
    </div>
  );
}
