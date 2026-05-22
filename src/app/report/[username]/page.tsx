import { ReportPage } from "@/components/pages";
import { fetchActivitySummary } from "@/lib/analysis/activity";
import { classifyActivity, classifyCandidate } from "@/lib/analysis/classifier";
import { scoreCandidate } from "@/lib/analysis/scorer";
import { detectFrameworks } from "@/lib/github/frameworks";
import { fetchGitHubProfile } from "@/lib/github/profile";
import { fetchAndProcessRepos } from "@/lib/github/repos";
import { IProfileData } from "@/types";

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ jd?: string }>;
}

const Report = async ({ params, searchParams }: PageProps) => {
  const { username } = await params;
  const { jd } = await searchParams;

  const [profile, reposData, activityData] = await Promise.all([
    fetchGitHubProfile(username),
    fetchAndProcessRepos(username),
    fetchActivitySummary(username),
  ]);

  const frameworkMap = await detectFrameworks(reposData.repos);

  const candidateCalssification = classifyCandidate(
    profile,
    reposData.repos,
    reposData.stats,
    activityData.commitEstimateLast30Days,
  );
  const score = scoreCandidate(candidateCalssification);

  const profileData = {
    profile,
    score,
    classification: candidateCalssification,
  };

  const reposSectionData = { reposData, frameworkMap };

  const activityClassification = classifyActivity(
    [],
    {
      activeCount: 0,
      ownedCount: 0,
      total: 0,
      forkedCount: 0,
      staleCount: 0,
      totalStars: 0,
      totalForks: 0,
      avgStars: 0,
      mostStarredRepo: null,
      reposWithReadme: 0,
      reposWithLicense: 0,
      reposWithTopics: 0,
      documentationScore: 0,
    },
    activityData.commitEstimateLast30Days,
  );

  return (
    <>
      <ReportPage
        jd={jd}
        profileData={
          "error" in profileData ? ({} as IProfileData) : profileData
        }
        reposSectionData={reposSectionData}
        activitySummary={activityData}
        activityClassification={activityClassification}
        candidateCalssification={candidateCalssification}
        score={score}
      />
    </>
  );
};

export default Report;
