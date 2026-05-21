import { IFetchReposResult } from "@/lib/github/repos";
import { INormalizedProfile } from "./github";
import { IFrameworkMap } from "@/lib/github/frameworks";

export type ActivityLevel = "Active" | "Moderate" | "Inactive";
export type CollaborationProfile = "Team Player" | "Mixed" | "Solo Builder";
export type ExperienceLevel = "Junior" | "Mid-Level" | "Senior";

export interface IActivityClassification {
  level: ActivityLevel;
  daysSinceLastPush: number;
  activeRepoCount: number;
  totalOwnedRepos: number;
  // Human-readable reason — used in the report
  summary: string;
}

export interface ICollaborationClassification {
  profile: CollaborationProfile;
  forkedRepoCount: number;
  ownedRepoCount: number;
  forkRatio: number; // 0–1
  summary: string;
}

export interface IExperienceClassification {
  level: ExperienceLevel;
  yearsActive: number;
  totalRepos: number;
  totalStars: number;
  summary: string;
}

export interface IProjectQualityClassification {
  score: number; // 0–100
  reposAnalyzed: number;
  topRepos: IRepoQuality[];
  summary: string;
}

export interface IRepoQuality {
  name: string;
  url: string;
  stars: number;
  hasReadme: boolean;
  hasLicense: boolean;
  hasTopics: boolean;
  daysSinceLastPush: number;
  score: number; // 0–100 per-repo quality score
}

export interface ICandidateClassification {
  activity: IActivityClassification;
  collaboration: ICollaborationClassification;
  experience: IExperienceClassification;
  projectQuality: IProjectQualityClassification;
}

// Scorer
export interface ISectionScore {
  label: string;
  score: number; // 0–100
  weight: number; // contribution to overall (must sum to 1 across all sections)
  weightedScore: number;
}

export interface ICandidateScore {
  overall: number; // 0–100
  sections: ISectionScore[];
  tier: "Strong" | "Promising" | "Weak";
}

// JD Matcher
export type SkillMatchStatus = "found" | "partial" | "missing";

export interface ISkillMatch {
  skill: string;
  status: SkillMatchStatus;
  // Where it was found (e.g. "8 repos", "topics", "language breakdown")
  evidence: string | null;
}

export interface IJDMatchResult {
  score: number; // 0–100
  totalSkills: number;
  matched: number;
  partial: number;
  missing: number;
  breakdown: ISkillMatch[];
  // One-line summary for the report
  summary: string;
}

export interface IGitHubEvent {
  id: string;
  type: string; // "PushEvent" | "PullRequestEvent" | "IssuesEvent" etc.
  created_at: string;
  payload: {
    commits?: { sha: string }[]; // PushEvent
    action?: string; // PullRequestEvent, IssuesEvent
    pull_request?: { merged: boolean };
  };
}

export interface IActivitySummary {
  pushesLast30Days: number;
  pushesLast90Days: number;
  pullRequestsOpened: number;
  issuesOpened: number;
  commitEstimateLast30Days: number; // sum of commits across PushEvents
  mostActiveDay: string | null; // e.g. "Monday"
  eventTypes: Record<string, number>; // { PushEvent: 12, PullRequestEvent: 3 }
}

export interface IGeminiReport {
  raw: string;
  sections: {
    snapshot: string;
    technicalExpertise: string;
    workStyle: string;
    projectQuality: string;
    strengths: string[];
    concerns: string[];
    verdict: string;
    jdFitAssessment?: string;
    technicalMatch?: string;
    roleSuitability?: string;
    strengthsForRole?: string[];
    gapsForRole?: string[];
  };
  generatedAt: Date;
  hasJD: boolean;
}

export type AnalysisStep =
  | "idle"
  | "profile"
  | "repos"
  | "frameworks"
  | "activity"
  | "classifying"
  | "generating"
  | "done"
  | "error";

export interface IAnalysisResult {
  profile: INormalizedProfile;
  reposData: IFetchReposResult;
  frameworkMap: IFrameworkMap;
  activitySummary: IActivitySummary;
  classification: ICandidateClassification;
  score: ICandidateScore;
  jdMatch: IJDMatchResult | null;
  report: IGeminiReport;
}

export interface IAnalysisState {
  step: AnalysisStep;
  result: IAnalysisResult | null;
  error: string | null;
  // Per-step completion flags — lets UI show checkmarks as steps finish
  completedSteps: Set<AnalysisStep>;
}
