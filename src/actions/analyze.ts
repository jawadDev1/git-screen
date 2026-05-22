"use server";

import { matchJD } from "@/lib/analysis/jd-matcher";
import { generateCandidateReport } from "@/lib/llm/analyzer";
import { GitHubError } from "@/lib/github/client";
import type {
  IProfileData,
  IActionError,
  IReposData,
  IActivitySummary,
  ICandidateClassification,
  ICandidateScore,
} from "@/types";

const toErrorMessage = (error: unknown): string => {
  if (error instanceof GitHubError) {
    switch (error.clientError.type) {
      case "NOT_FOUND":
        return "GitHub profile not found.";
      case "RATE_LIMITED":
        return `Rate limit reached. Resets at ${error.clientError.resetAt?.toLocaleTimeString() ?? "unknown"}.`;
      case "NETWORK_ERROR":
        return "Could not reach GitHub API.";
      case "SERVER_ERROR":
        return "GitHub is having issues. Try again shortly.";
      default:
        return error.clientError.message;
    }
  }
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
};

interface FetchReportDataParams {
  jdText: string;
  profileData: IProfileData;
  reposData: IReposData;
  activitySummary: IActivitySummary;
  candidateCalssification: ICandidateClassification;
  score: ICandidateScore;
}
export interface IReportResult {
  jdMatch: ReturnType<typeof matchJD> | null;
  report: Awaited<ReturnType<typeof generateCandidateReport>>;
}

export const fetchReportData = async ({
  jdText,
  profileData,
  reposData,
  activitySummary,
  candidateCalssification,
  score,
}: FetchReportDataParams): Promise<IReportResult | IActionError> => {
  try {
    const reposOnly = reposData.reposData;
    const frameworkMap = reposData.frameworkMap;

    const jdMatch =
      jdText.trim().length > 20
        ? matchJD(
            jdText,
            reposOnly.repos,
            frameworkMap,
            reposOnly.languageBreakdown,
          )
        : null;

    const report = await generateCandidateReport({
      profile: profileData.profile,
      stats: reposOnly.stats,
      languageBreakdown: reposOnly.languageBreakdown,
      frameworkMap,
      classification: candidateCalssification,
      score,
      activitySummary,
      jdMatch,
    });

    return {
      jdMatch,
      report,
    };
  } catch (error) {
    return {
      error: toErrorMessage(error),
    };
  }
};
