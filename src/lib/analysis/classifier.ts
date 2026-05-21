import {
  ActivityLevel,
  CollaborationProfile,
  ExperienceLevel,
  IActivityClassification,
  ICandidateClassification,
  ICollaborationClassification,
  IExperienceClassification,
  INormalizedProfile,
  INormalizedRepo,
  IProjectQualityClassification,
  IRepoQuality,
  IRepoStats,
} from "@/types";

//  Activity Classifier
// Active     → pushed within 90 days OR 3+ active repos
// Moderate   → pushed within 365 days OR 1+ active repos
// Inactive   → nothing pushed in over a year

export const classifyActivity = (
  repos: INormalizedRepo[],
  stats: IRepoStats,
): IActivityClassification => {
  const owned = repos.filter((r) => !r.isFork);

  const daysSinceLastPush =
    owned.length === 0
      ? Infinity
      : Math.min(...owned.map((r) => r.daysSinceLastPush));

  let level: ActivityLevel;
  let summary: string;

  if (daysSinceLastPush <= 90 || stats.activeCount >= 3) {
    level = "Active";
    summary =
      daysSinceLastPush === 0
        ? "Pushed code today — highly active."
        : daysSinceLastPush <= 7
          ? `Last pushed ${daysSinceLastPush} day(s) ago — consistently active.`
          : `Last pushed ${daysSinceLastPush} days ago with ${stats.activeCount} active repo(s).`;
  } else if (daysSinceLastPush <= 365 || stats.activeCount >= 1) {
    level = "Moderate";
    summary = `Last pushed ${daysSinceLastPush} days ago. Periodic activity — not consistently coding publicly.`;
  } else {
    level = "Inactive";
    summary =
      daysSinceLastPush === Infinity
        ? "No public pushes found."
        : `No public activity in over a year (${Math.round(daysSinceLastPush / 30)} months since last push).`;
  }

  return {
    level,
    daysSinceLastPush: daysSinceLastPush === Infinity ? -1 : daysSinceLastPush,
    activeRepoCount: stats.activeCount,
    totalOwnedRepos: stats.ownedCount,
    summary,
  };
};

// Collaboration Classifier
// Fork ratio = forked / total
// Team Player  → forkRatio >= 0.3 (actively builds on others' work)
// Mixed        → forkRatio 0.1–0.3
// Solo Builder → forkRatio < 0.1

export const classifyCollaboration = (
  stats: IRepoStats,
): ICollaborationClassification => {
  const total = stats.total;
  const forkRatio = total === 0 ? 0 : stats.forkedCount / total;

  let profile: CollaborationProfile;
  let summary: string;

  if (forkRatio >= 0.3) {
    profile = "Team Player";
    summary = `${stats.forkedCount} of ${total} repos are forks — regularly contributes to and builds on others' work.`;
  } else if (forkRatio >= 0.1) {
    profile = "Mixed";
    summary = `Mix of original projects and forked work. Comfortable in both solo and collaborative environments.`;
  } else {
    profile = "Solo Builder";
    summary = `Primarily builds original projects. ${stats.forkedCount > 0 ? "Minimal forking suggests independent work style." : "No forked repos — exclusively independent contributor."}`;
  }

  return {
    profile,
    forkedRepoCount: stats.forkedCount,
    ownedRepoCount: stats.ownedCount,
    forkRatio: Math.round(forkRatio * 100) / 100,
    summary,
  };
};

//  Experience Classifier
// Looks at years active + repo count + stars as a proxy for depth
// Junior    → < 2 years OR < 10 repos
// Mid-Level → 2–5 years AND 10–40 repos
// Senior    → 5+ years OR 40+ repos OR 50+ total stars

export const classifyExperience = (
  profile: INormalizedProfile,
  stats: IRepoStats,
): IExperienceClassification => {
  const { yearsActive } = profile;
  const { ownedCount, totalStars } = stats;

  let level: ExperienceLevel;
  let summary: string;

  if (yearsActive >= 5 || ownedCount >= 40 || totalStars >= 50) {
    level = "Senior";
    summary = `${yearsActive} year(s) on GitHub with ${ownedCount} original repos and ${totalStars} total stars — strong track record.`;
  } else if (yearsActive >= 2 && ownedCount >= 10) {
    level = "Mid-Level";
    summary = `${yearsActive} year(s) active with ${ownedCount} original repos — solid mid-level presence.`;
  } else {
    level = "Junior";
    summary = `${yearsActive} year(s) on GitHub with ${ownedCount} original repos — earlier stage developer or limited public work.`;
  }

  return { level, yearsActive, totalRepos: ownedCount, totalStars, summary };
};

//  Project Quality Classifier
// Score per repo (0–100):
//   README present    → +35
//   License present   → +20
//   Topics tagged     → +15
//   Stars > 0         → +15 (capped, scaled)
//   Pushed < 180 days → +15
//
// Overall = average of top-5 repo scores

const scoreRepo = (repo: INormalizedRepo): number => {
  let score = 0;

  if (repo.hasReadme) score += 35;
  if (repo.hasLicense) score += 20;
  if (repo.hasTopics) score += 15;

  // Star signal — diminishing returns, max +15
  if (repo.stars > 0) {
    score += Math.min(15, Math.round(Math.log2(repo.stars + 1) * 4));
  }

  // Recency
  if (repo.daysSinceLastPush <= 180) score += 15;

  return Math.min(score, 100);
};

export const classifyProjectQuality = (
  repos: INormalizedRepo[],
): IProjectQualityClassification => {
  const owned = repos.filter((r) => !r.isFork);

  // Top 5 by stars, then recency
  const top5 = [...owned]
    .sort(
      (a, b) => b.stars - a.stars || a.daysSinceLastPush - b.daysSinceLastPush,
    )
    .slice(0, 5);

  const repoQualities: IRepoQuality[] = top5.map((repo) => ({
    name: repo.name,
    url: repo.url,
    stars: repo.stars,
    hasReadme: repo.hasReadme,
    hasLicense: repo.hasLicense,
    hasTopics: repo.hasTopics,
    daysSinceLastPush: repo.daysSinceLastPush,
    score: scoreRepo(repo),
  }));

  const overallScore =
    repoQualities.length === 0
      ? 0
      : Math.round(
          repoQualities.reduce((sum, r) => sum + r.score, 0) /
            repoQualities.length,
        );

  let summary: string;
  if (overallScore >= 75) {
    summary =
      "Well-maintained projects with good documentation and active development.";
  } else if (overallScore >= 45) {
    summary =
      "Decent project quality. Some repos are well-documented; others lack README or license.";
  } else {
    summary =
      "Projects appear sparse on documentation. May be personal/experimental work.";
  }

  return {
    score: overallScore,
    reposAnalyzed: repoQualities.length,
    topRepos: repoQualities,
    summary,
  };
};

// Main Export

export const classifyCandidate = (
  profile: INormalizedProfile,
  repos: INormalizedRepo[],
  stats: IRepoStats,
): ICandidateClassification => ({
  activity: classifyActivity(repos, stats),
  collaboration: classifyCollaboration(stats),
  experience: classifyExperience(profile, stats),
  projectQuality: classifyProjectQuality(repos),
});
