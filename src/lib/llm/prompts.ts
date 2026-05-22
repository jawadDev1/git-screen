import { INormalizedProfile, IActivitySummary, IRepoStats } from "@/types";
import {
  ICandidateClassification,
  ICandidateScore,
  IJDMatchResult,
} from "@/types";
import { IFrameworkMap } from "@/lib/github/frameworks";
import { getTopFrameworks } from "@/lib/github/frameworks";

// Context Builder
// Assembles all data into a compact, structured string for the prompt.

const buildCandidateContext = (
  profile: INormalizedProfile,
  stats: IRepoStats,
  languageBreakdown: Record<string, number>,
  frameworkMap: IFrameworkMap,
  classification: ICandidateClassification,
  score: ICandidateScore,
  activitySummary: IActivitySummary,
  jdMatch: IJDMatchResult | null,
): string => {
  const topLanguages = Object.entries(languageBreakdown)
    .slice(0, 5)
    .map(([lang, pct]) => `${lang} (${pct}%)`)
    .join(", ");

  const topFrameworks = getTopFrameworks(frameworkMap, "medium")
    .slice(0, 8)
    .map((f) => `${f.name} (${f.repoCount} repos, ${f.confidence} confidence)`)
    .join(", ");

  const topRepos = classification.projectQuality.topRepos
    .map(
      (r) =>
        `  - ${r.name}: score ${r.score}/100, ${r.stars} stars, README: ${r.hasReadme ? "yes" : "no"}, License: ${r.hasLicense ? "yes" : "no"}`,
    )
    .join("\n");

  const jdSection = jdMatch
    ? `
JD MATCH:
  Score: ${jdMatch.score}/100
  Summary: ${jdMatch.summary}
  Found: ${
    jdMatch.breakdown
      .filter((s) => s.status === "found")
      .map((s) => s.skill)
      .join(", ") || "none"
  }
  Partial: ${
    jdMatch.breakdown
      .filter((s) => s.status === "partial")
      .map((s) => s.skill)
      .join(", ") || "none"
  }
  Missing: ${
    jdMatch.breakdown
      .filter((s) => s.status === "missing")
      .map((s) => s.skill)
      .join(", ") || "none"
  }`
    : "JD MATCH: Not provided";

  return `
CANDIDATE PROFILE:
  Username: ${profile.username}
  Name: ${profile.displayName}
  Bio: ${profile.bio ?? "Not provided"}
  Location: ${profile.location ?? "Not provided"}
  GitHub since: ${profile.joinedAt.getFullYear()} (${profile.yearsActive} years active)
  Followers: ${profile.followers}

REPOSITORIES:
  Total public repos: ${stats.total}
  Original (non-fork): ${stats.ownedCount}
  Forked: ${stats.forkedCount}
  Active repos (pushed < 1 year): ${stats.activeCount}
  Total stars earned: ${stats.totalStars}
  Most starred repo: ${stats.mostStarredRepo?.name ?? "none"} (${stats.mostStarredRepo?.stars ?? 0} stars)

TECHNICAL STACK:
  Languages: ${topLanguages || "none detected"}
  Frameworks: ${topFrameworks || "none detected"}

RECENT ACTIVITY (last 90 days):
  Pushes (last 30 days): ${activitySummary.pushesLast30Days}
  Pushes (last 90 days): ${activitySummary.pushesLast90Days}
  Commits estimated (last 30 days): ${activitySummary.commitEstimateLast30Days}
  PRs opened: ${activitySummary.pullRequestsOpened}
  Issues opened: ${activitySummary.issuesOpened}
  Most active day: ${activitySummary.mostActiveDay ?? "unknown"}

CLASSIFICATIONS:
  Activity level: ${classification.activity.level} — ${classification.activity.summary}
  Experience level: ${classification.experience.level} — ${classification.experience.summary}
  Collaboration style: ${classification.collaboration.profile} — ${classification.collaboration.summary}
  Project quality score: ${classification.projectQuality.score}/100 — ${classification.projectQuality.summary}

TOP REPOS ANALYZED:
${topRepos || "  No repos available"}

OVERALL CANDIDATE SCORE: ${score.overall}/100 (${score.tier})
  - Activity: ${score.sections.find((s) => s.label === "Activity")?.score}/100
  - Project Quality: ${score.sections.find((s) => s.label === "Project Quality")?.score}/100
  - Experience: ${score.sections.find((s) => s.label === "Experience")?.score}/100
  - Collaboration: ${score.sections.find((s) => s.label === "Collaboration")?.score}/100

${jdSection}
`.trim();
};

// Prompt Templates

export const buildGeneralReportPrompt = (context: string) =>
  `
You are an expert technical recruiter assistant. A recruiter has shared a candidate's GitHub profile data with you.

Your job is to generate a clear, honest, professional candidate report — written for a non-technical recruiter who cannot read code.

CANDIDATE DATA:
${context}

Generate a structured report with EXACTLY these sections. Use plain language, no jargon. Be concise but specific — avoid generic filler phrases.

SECTIONS TO GENERATE:

1. SNAPSHOT (2-3 sentences)
Who is this developer? Summarize their background, experience level, and what they primarily build. Translate technical data into plain language.

2. TECHNICAL EXPERTISE (3-5 sentences)
What technologies do they know well? What is their primary stack? Are they a specialist or generalist? Mention specific frameworks, not just languages.

3. WORK STYLE & ACTIVITY (2-3 sentences)
How actively are they coding? Are they a solo builder or team contributor? What does their consistency look like?

4. PROJECT QUALITY (2-3 sentences)
Are their projects well-maintained? Do they document their work? Any standout projects worth noting?

5. STRENGTHS (3 bullet points, one line each)
The strongest signals from this profile for a hiring context.

6. CONCERNS (2-3 bullet points, one line each)
Honest gaps or risks a recruiter should be aware of. Do not omit this section — if the profile is strong, note minor gaps.

7. RECRUITER VERDICT (2-3 sentences)
A direct hiring recommendation. What type of role and seniority level is this candidate suited for? Would you recommend moving them to the next stage?

Be honest. Avoid hype. Write as if advising a colleague, not writing a marketing pitch.
`.trim();

export const buildJDReportPrompt = (context: string): string =>
  `
You are an expert technical recruiter assistant. A recruiter has shared a candidate's GitHub profile data along with a job description.

Your job is to evaluate how well this candidate matches the specific role and generate a targeted screening report.

CANDIDATE DATA:
${context}

Generate a structured report with EXACTLY these sections. Write for a non-technical recruiter. Be specific and direct.

SECTIONS TO GENERATE:

1. SNAPSHOT (2 sentences)
Brief summary of who this candidate is.

2. JD FIT ASSESSMENT (3-4 sentences)
How well does this candidate match the job description? Reference specific skills found, partially found, and missing. Give an honest overall fit verdict.

3. TECHNICAL MATCH (3-5 sentences)
Which required technical skills are clearly demonstrated? Which are unverified or missing? Where are the strongest and weakest matches?

4. ROLE SUITABILITY (2-3 sentences)
Is this candidate's experience level appropriate for the role? Are there seniority mismatches (over or under qualified)?

5. STRENGTHS FOR THIS ROLE (3 bullet points, one line each)
Specific reasons this candidate suits THIS job, not generic praise.

6. GAPS FOR THIS ROLE (2-3 bullet points, one line each)
Specific skill or experience gaps relative to THIS job description.

7. RECRUITER VERDICT (2-3 sentences)
Should this candidate advance to the next stage for this specific role? Be direct — yes, no, or conditional (if yes, what to verify in interview).

Be honest. Do not oversell candidates. Write as if advising a colleague making a real hiring decision.
`.trim();

// Public API

export interface IPromptInput {
  profile: INormalizedProfile;
  stats: IRepoStats;
  languageBreakdown: Record<string, number>;
  frameworkMap: IFrameworkMap;
  classification: ICandidateClassification;
  score: ICandidateScore;
  activitySummary: IActivitySummary;
  jdMatch: IJDMatchResult | null;
}

export const buildPrompt = (input: IPromptInput): string => {
  const context = buildCandidateContext(
    input.profile,
    input.stats,
    input.languageBreakdown,
    input.frameworkMap,
    input.classification,
    input.score,
    input.activitySummary,
    input.jdMatch,
  );

  return input.jdMatch
    ? buildJDReportPrompt(context)
    : buildGeneralReportPrompt(context);
};
