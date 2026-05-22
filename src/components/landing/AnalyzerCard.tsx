"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Link2, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { parseGitHubUsername } from "@/lib/utils";
import { validateGitHubProfile } from "@/actions/validate-profile";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubmitState = "idle" | "validating" | "navigating";

// ─── Component ────────────────────────────────────────────────────────────────

export const AnalyzerCard = () => {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [jd, setJd] = useState("");
  const [urlError, setUrlError] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const isLoading = submitState !== "idle";

  const handleSubmit = async () => {
    setUrlError("");

    const username = parseGitHubUsername(url);
    if (!username) {
      setUrlError("Please enter a valid GitHub URL or username.");
      return;
    }

    setSubmitState("validating");

    const result = await validateGitHubProfile(url);

    if (!result.success) {
      setUrlError(result.error ?? "Profile validation failed.");
      setSubmitState("idle");
      return;
    }

    setSubmitState("navigating");

    const params = new URLSearchParams();
    if (jd.trim().length > 20) {
      params.set("jd", jd.trim());
    }

    const query = params.toString();
    router.push(`/report/${result.username}${query ? `?${query}` : ""}`);
  };

  const buttonLabel = {
    idle: "Analyze Candidate",
    validating: "Verifying profile...",
    navigating: "Loading report...",
  }[submitState];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative rounded-xl border border-border/30 bg-card/60 backdrop-blur-sm p-6 overflow-hidden shadow-[0_0_40px_-10px_rgba(126,217,158,0.2)]">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />

        <div className="space-y-6 relative z-10">
          {/* GitHub URL */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Link2 className="w-4 h-4" />
              GitHub Profile URL
            </label>

            <div
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-lg border bg-background/60 transition-all",
                urlError
                  ? "border-destructive ring-1 ring-destructive/20"
                  : "border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20",
              )}
            >
              <span className="text-muted-foreground font-mono text-sm select-none shrink-0">
                https://
              </span>
              <Input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (urlError) setUrlError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="github.com/username"
                disabled={isLoading}
                className="bg-transparent border-none shadow-none focus-visible:ring-0 w-full text-foreground placeholder:text-muted-foreground/40 font-mono text-sm p-0 h-auto"
              />
            </div>

            {/* Inline error */}
            {urlError && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{urlError}</span>
              </div>
            )}
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <FileText className="w-4 h-4" />
                Job Description
              </label>
              <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                Optional — Recommended
              </span>
            </div>

            <div
              className={cn(
                "rounded-lg border bg-background/60 transition-all px-4 py-3 h-32",
                "border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20",
              )}
            >
              <Textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the JD here to calculate a match score..."
                disabled={isLoading}
                className="bg-transparent border-none shadow-none focus-visible:ring-0 w-full h-full text-foreground placeholder:text-muted-foreground/40 resize-none text-sm p-0"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className={cn(
              "w-full font-bold py-5 rounded-lg flex items-center justify-center gap-2 transition-all",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(126,217,158,0.3)]",
              "active:scale-[0.98]",
              "disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100",
              "focus-visible:outline-none cursor-pointer",
            )}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {buttonLabel}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                {buttonLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
