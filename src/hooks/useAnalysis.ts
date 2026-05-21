import { useState, useCallback } from "react";
import { fetchGitHubProfile } from "@/lib/github/profile";
import { fetchAndProcessRepos } from "@/lib/github/repos";
import { detectFrameworks } from "@/lib/github/frameworks";
import { classifyCandidate } from "@/lib/analysis/classifier";
import { scoreCandidate } from "@/lib/analysis/scorer";
import { matchJD } from "@/lib/analysis/jd-matcher";
import { generateCandidateReport } from "@/lib/llm/analyzer";
import { GitHubError } from "@/lib/github/client";
import { assertRateLimitSafe } from "@/lib/github/client";
import { AnalysisStep, IAnalysisState } from "@/types";
import { fetchActivitySummary } from "@/lib/analysis/activity";

export const STEP_LABELS: Record<AnalysisStep, string> = {
  idle: "Waiting",
  profile: "Fetching GitHub profile...",
  repos: "Analyzing repositories...",
  frameworks: "Detecting frameworks & stack...",
  activity: "Reading activity data...",
  classifying: "Scoring candidate...",
  generating: "Generating recruiter report...",
  done: "Done",
  error: "Error",
};

const initialState: IAnalysisState = {
  step: "idle",
  result: null,
  error: null,
  completedSteps: new Set(),
};

export const useAnalysis = () => {
  const [state, setState] = useState<IAnalysisState>(initialState);

  // Helper — update step and mark previous step complete
  const setStep = useCallback((step: AnalysisStep, prevStep?: AnalysisStep) => {
    setState((prev) => {
      const completedSteps = new Set(prev.completedSteps);
      if (prevStep) completedSteps.add(prevStep);
      return { ...prev, step, completedSteps };
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const analyze = useCallback(
    async (githubUrl: string, jdText: string) => {
      // Reset any previous state
      setState({ ...initialState, step: "profile" });

      try {
        assertRateLimitSafe(20);

        const profile = await fetchGitHubProfile(githubUrl);
        setStep("repos", "profile");

        const reposData = await fetchAndProcessRepos(profile.username);
        setStep("frameworks", "repos");

        const frameworkMap = await detectFrameworks(reposData.repos);
        setStep("activity", "frameworks");

        const activitySummary = await fetchActivitySummary(profile.username);
        setStep("classifying", "activity");

        const classification = classifyCandidate(
          profile,
          reposData.repos,
          reposData.stats,
        );
        const score = scoreCandidate(classification);

        // JD matching
        const jdMatch =
          jdText.trim().length > 20
            ? matchJD(
                jdText,
                reposData.repos,
                frameworkMap,
                reposData.languageBreakdown,
              )
            : null;

        setStep("generating", "classifying");

        // LLM Report
        const report = await generateCandidateReport({
          profile,
          stats: reposData.stats,
          languageBreakdown: reposData.languageBreakdown,
          frameworkMap,
          classification,
          score,
          activitySummary,
          jdMatch,
        });

        setState({
          step: "done",
          error: null,
          completedSteps: new Set([
            "profile",
            "repos",
            "frameworks",
            "activity",
            "classifying",
            "generating",
          ]),
          result: {
            profile,
            reposData,
            frameworkMap,
            activitySummary,
            classification,
            score,
            jdMatch,
            report,
          },
        });
      } catch (error) {
        let message: string;

        if (error instanceof GitHubError) {
          const { type, resetAt } = error.clientError;

          switch (type) {
            case "NOT_FOUND":
              message =
                "GitHub profile not found. Check the URL and try again.";
              break;
            case "RATE_LIMITED":
              message = resetAt
                ? `GitHub API rate limit reached. Resets at ${resetAt.toLocaleTimeString()}.`
                : "GitHub API rate limit reached. Please wait a moment and try again.";
              break;
            case "UNAUTHORIZED":
              message =
                "GitHub token is invalid. Check your GITHUB_TOKEN environment variable.";
              break;
            case "SERVER_ERROR":
              message =
                "GitHub is having issues right now. Try again in a moment.";
              break;
            case "NETWORK_ERROR":
              message =
                "Network error — request timed out or connection failed.";
              break;
            default:
              message = error.clientError.message;
          }
        } else if (error instanceof Error) {
          message = error.message;
        } else {
          message = "An unexpected error occurred. Please try again.";
        }

        setState((prev) => ({
          ...prev,
          step: "error",
          error: message,
        }));
      }
    },
    [setStep],
  );

  return {
    ...state,
    analyze,
    reset,
    isLoading:
      state.step !== "idle" && state.step !== "done" && state.step !== "error",
    isIdle: state.step === "idle",
    isDone: state.step === "done",
    isError: state.step === "error",
  };
};
