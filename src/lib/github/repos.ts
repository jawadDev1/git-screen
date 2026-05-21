import { computeDaysSinceLastPush } from "../utils";
import { githubFetch, githubFetchParallel } from "./client";
import {
  IGitHubRepo,
  INormalizedRepo,
  IRepoLanguages,
  IRepoStats,
} from "@/types";
import { detectFrameworks, IFrameworkSignal } from "./frameworks";

const PER_PAGE = 100;
const DEEP_INSPECT_LIMIT = 10;
const STALE_THRESHOLD_DAYS = 365;

const normalizeRepo = (raw: IGitHubRepo): INormalizedRepo => ({
  id: raw.id,
  name: raw.name,
  fullName: raw.full_name,
  url: raw.html_url,
  description: raw.description,
  isFork: raw.fork,
  primaryLanguage: raw.language,
  topics: raw.topics ?? [],
  stars: raw.stargazers_count,
  forks: raw.forks_count,
  openIssues: raw.open_issues_count,
  hasLicense: raw.license !== null,
  licenseName: raw.license?.name ?? null,
  hasTopics: (raw.topics ?? []).length > 0,
  sizeKb: raw.size,
  createdAt: new Date(raw.created_at),
  updatedAt: new Date(raw.updated_at),
  pushedAt: raw.pushed_at ? new Date(raw.pushed_at) : null,
  daysSinceLastPush: computeDaysSinceLastPush(raw.pushed_at),
  defaultBranch: raw.default_branch,
  languages: {},
  hasReadme: false,
  hasPackageJson: false,
  hasComposerJson: false,
  hasRequirementsTxt: false,
});

const fetchAllRepos = async (username: string): Promise<IGitHubRepo[]> => {
  const allRepos: IGitHubRepo[] = [];
  let page = 1;

  while (true) {
    const batch = await githubFetch<IGitHubRepo[]>(
      `/users/${username}/repos?type=owner&sort=pushed&direction=desc&per_page=${PER_PAGE}&page=${page}`,
    );

    allRepos.push(...batch);

    if (batch.length < PER_PAGE) break;

    if (allRepos.length >= 300) break;

    page++;
  }

  return allRepos;
};

const fetchRepoLanguages = async (
  fullName: string,
): Promise<IRepoLanguages> => {
  try {
    return await githubFetch<IRepoLanguages>(`/repos/${fullName}/languages`);
  } catch {
    return {};
  }
};

const fetchRootFilePresence = async (
  fullName: string,
): Promise<{
  hasReadme: boolean;
  hasPackageJson: boolean;
  hasComposerJson: boolean;
  hasRequirementsTxt: boolean;
}> => {
  const [readme, packageJson, composerJson, requirementsTxt] =
    await Promise.allSettled([
      githubFetch(`/repos/${fullName}/contents/README.md`),
      githubFetch(`/repos/${fullName}/contents/package.json`),
      githubFetch(`/repos/${fullName}/contents/composer.json`),
      githubFetch(`/repos/${fullName}/contents/requirements.txt`),
    ]);

  return {
    hasReadme: readme.status === "fulfilled",
    hasPackageJson: packageJson.status === "fulfilled",
    hasComposerJson: composerJson.status === "fulfilled",
    hasRequirementsTxt: requirementsTxt.status === "fulfilled",
  };
};

const enrichRepos = async (
  repos: INormalizedRepo[],
): Promise<INormalizedRepo[]> => {
  const deepRepos = repos.slice(0, DEEP_INSPECT_LIMIT);
  const shallowRepos = repos.slice(DEEP_INSPECT_LIMIT);

  // Deep: languages + file presence (concurrency capped at 5 in githubFetchParallel)
  const deepEnriched = await Promise.all(
    deepRepos.map(async (repo) => {
      const [languages, filePresence] = await Promise.all([
        fetchRepoLanguages(repo.fullName),
        fetchRootFilePresence(repo.fullName),
      ]);
      return { ...repo, languages, ...filePresence };
    }),
  );

  const languageResults = await githubFetchParallel<IRepoLanguages>(
    shallowRepos.map((r) => `/repos/${r.fullName}/languages`),
    5,
  );

  const shallowEnriched = shallowRepos.map((repo, i) => ({
    ...repo,
    languages:
      languageResults[i].status === "fulfilled" ? languageResults[i].value : {},
  }));

  return [...deepEnriched, ...shallowEnriched];
};

// Aggregate languages across ALL repos into a sorted percentage map
// { TypeScript: 58.4, JavaScript: 22.1, PHP: 14.3, CSS: 5.2 }
export const aggregateLanguages = (
  repos: INormalizedRepo[],
): Record<string, number> => {
  const totals: Record<string, number> = {};

  for (const repo of repos) {
    for (const [lang, bytes] of Object.entries(repo.languages)) {
      totals[lang] = (totals[lang] ?? 0) + bytes;
    }
  }

  const totalBytes = Object.values(totals).reduce((a, b) => a + b, 0);
  if (totalBytes === 0) return {};

  return Object.fromEntries(
    Object.entries(totals)
      .map(([lang, bytes]) => [
        lang,
        Math.round((bytes / totalBytes) * 1000) / 10,
      ])
      .sort(([, a], [, b]) => Number(b) - Number(a)),
  );
};

export const computeRepoStats = (repos: INormalizedRepo[]): IRepoStats => {
  const owned = repos.filter((r) => !r.isFork);
  const forked = repos.filter((r) => r.isFork);
  const stale = owned.filter((r) => r.daysSinceLastPush > STALE_THRESHOLD_DAYS);
  const active = owned.filter(
    (r) => r.daysSinceLastPush <= STALE_THRESHOLD_DAYS,
  );

  const totalStars = owned.reduce((sum, r) => sum + r.stars, 0);
  const totalForks = owned.reduce((sum, r) => sum + r.forks, 0);

  const mostStarred =
    owned.length > 0
      ? owned.reduce((best, r) => (r.stars > best.stars ? r : best), owned[0])
      : null;

  const reposWithReadme = owned.filter((r) => r.hasReadme).length;
  const reposWithLicense = owned.filter((r) => r.hasLicense).length;
  const reposWithTopics = owned.filter((r) => r.hasTopics).length;

  // Documentation score: weighted average of README + license + topics presence
  // across owned repos. Max score = 100.
  const docScore =
    owned.length === 0
      ? 0
      : Math.round(
          ((reposWithReadme * 0.5 +
            reposWithLicense * 0.3 +
            reposWithTopics * 0.2) /
            owned.length) *
            100,
        );

  return {
    total: repos.length,
    ownedCount: owned.length,
    forkedCount: forked.length,
    staleCount: stale.length,
    activeCount: active.length,
    totalStars,
    totalForks,
    avgStars: owned.length > 0 ? Math.round(totalStars / owned.length) : 0,
    mostStarredRepo: mostStarred,
    reposWithReadme,
    reposWithLicense,
    reposWithTopics,
    documentationScore: docScore,
  };
};

export interface IFetchReposResult {
  repos: INormalizedRepo[];
  stats: IRepoStats;
  languageBreakdown: Record<string, number>;
  frameworkMap: Record<string, IFrameworkSignal>;
}

export const fetchAndProcessRepos = async (
  username: string,
): Promise<IFetchReposResult> => {
  const rawRepos = await fetchAllRepos(username);

  const normalized = rawRepos.map(normalizeRepo);

  // enrich top repos with deep data
  const sorted = [...normalized].sort(
    (a, b) => (b.pushedAt?.getTime() ?? 0) - (a.pushedAt?.getTime() ?? 0),
  );

  // Enrich with languages + file presence
  const enriched = await enrichRepos(sorted);
  const frameworkMap = await detectFrameworks(enriched);

  //  Compute aggregate stats
  const stats = computeRepoStats(enriched);
  const languageBreakdown = aggregateLanguages(enriched);

  return { repos: enriched, stats, languageBreakdown, frameworkMap };
};
