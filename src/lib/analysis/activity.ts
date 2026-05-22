import { IActivitySummary } from "@/types";
import { GitHubError } from "../github/client";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// ─── GraphQL Query ────────────────────────────────────────────────────────────
// Fetches contribution calendar + recent PR/issue counts in one round trip.

const CONTRIBUTIONS_QUERY = `
  query ContributionData($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalRepositoriesWithContributedCommits
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
      }
    }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface IContributionDay {
  date: string; // "2024-05-01"
  contributionCount: number;
  weekday: number; // 0 = Sunday
}

interface IGraphQLResponse {
  data?: {
    user?: {
      contributionsCollection: {
        totalCommitContributions: number;
        totalPullRequestContributions: number;
        totalIssueContributions: number;
        totalRepositoriesWithContributedCommits: number;
        contributionCalendar: {
          totalContributions: number;
          weeks: { contributionDays: IContributionDay[] }[];
        };
      };
    } | null;
  };
  errors?: { message: string }[];
}

// ─── GraphQL Fetcher ──────────────────────────────────────────────────────────

const fetchContributions = async (
  username: string,
): Promise<IGraphQLResponse> => {
  if (!GITHUB_TOKEN) {
    throw new GitHubError({
      type: "UNAUTHORIZED",
      message:
        "GITHUB_TOKEN is required for activity data. Add it to your .env file.",
    });
  }

  // Query the last 365 days
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);

  const response = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: {
        username,
        from: from.toISOString(),
        to: to.toISOString(),
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new GitHubError({
      type: response.status === 401 ? "UNAUTHORIZED" : "SERVER_ERROR",
      message: `GitHub GraphQL request failed: ${response.status}`,
    });
  }

  return response.json() as Promise<IGraphQLResponse>;
};

// ─── Analyzer ─────────────────────────────────────────────────────────────────

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const analyzeContributions = (
  collection: NonNullable<
    NonNullable<IGraphQLResponse["data"]>["user"]
  >["contributionsCollection"],
): IActivitySummary => {
  const now = Date.now();
  const MS_30 = 30 * 24 * 60 * 60 * 1000;
  const MS_90 = 90 * 24 * 60 * 60 * 1000;

  const allDays: IContributionDay[] =
    collection.contributionCalendar.weeks.flatMap((w) => w.contributionDays);

  let commitsLast30 = 0;
  let commitsLast90 = 0;
  let pushesLast30 = 0; // days with at least 1 commit in last 30d
  let pushesLast90 = 0; // days with at least 1 commit in last 90d

  // weekday index → total contributions (for most active day)
  const weekdayTotals: number[] = new Array(7).fill(0);

  for (const day of allDays) {
    const age = now - new Date(day.date).getTime();
    const count = day.contributionCount;

    if (count > 0) {
      weekdayTotals[day.weekday] += count;
    }

    if (age <= MS_30) {
      commitsLast30 += count;
      if (count > 0) pushesLast30++;
    }
    if (age <= MS_90) {
      commitsLast90 += count;
      if (count > 0) pushesLast90++;
    }
  }

  const maxWeekdayTotal = Math.max(...weekdayTotals);
  const mostActiveDay =
    maxWeekdayTotal === 0
      ? null
      : DAY_NAMES[weekdayTotals.indexOf(maxWeekdayTotal)];

  return {
    // Commit counts from GraphQL are accurate — include private if token allows
    commitEstimateLast30Days: commitsLast30,
    commitsLast90Days: commitsLast90,
    totalCommitsLastYear: collection.totalCommitContributions,
    // "pushes" = active days (days where at least 1 commit happened)
    pushesLast30Days: pushesLast30,
    pushesLast90Days: pushesLast90,
    pullRequestsOpened: collection.totalPullRequestContributions,
    issuesOpened: collection.totalIssueContributions,
    reposContributedTo: collection.totalRepositoriesWithContributedCommits,
    mostActiveDay,
    // Keep eventTypes as empty — GraphQL doesn't return raw events
    eventTypes: {},
  };
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const fetchActivitySummary = async (
  username: string,
): Promise<IActivitySummary> => {
  const data = await fetchContributions(username);

  if (data.errors?.length) {
    // GraphQL errors are in the response body, not HTTP status
    const msg = data.errors[0].message;

    // User not found comes back as a GraphQL error
    if (msg.toLowerCase().includes("could not resolve")) {
      throw new GitHubError({
        type: "NOT_FOUND",
        message: `User '${username}' not found.`,
      });
    }

    throw new GitHubError({ type: "SERVER_ERROR", message: msg });
  }

  if (!data.data?.user) {
    throw new GitHubError({
      type: "NOT_FOUND",
      message: `No contribution data found for '${username}'.`,
    });
  }

  return analyzeContributions(data.data.user.contributionsCollection);
};
