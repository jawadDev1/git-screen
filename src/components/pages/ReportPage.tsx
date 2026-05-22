import { Suspense } from "react";
import { CandidateHeader } from "@/components/report/CandidateHeader";
import { TechnicalStack } from "@/components/report/TechnicalStack";
import { ActivitySection } from "@/components/report/ActivitySection";
import { ProjectQuality } from "@/components/report/ProjectQuality";
import { CollaborationProfile } from "@/components/report/CollaborationProfile";
import { JDMatchSection } from "@/components/report/JDMatchSection";
import { RecruiterVerdict } from "@/components/report/RecruiterVerdict";
import { VerdictSkeleton } from "@/components/report/skeletons/VerdictSkeleton";
import {
  IActivityClassification,
  IActivitySummary,
  ICandidateClassification,
  ICandidateScore,
  IProfileData,
  IReposData,
} from "@/types";
import { fetchReportData } from "@/actions/analyze";

interface VerdictSectionProps {
  jdText: string;
  profileData: IProfileData;
  reposData: IReposData;
  activityClassification: IActivityClassification;
  activitySummary: IActivitySummary;
  candidateCalssification: ICandidateClassification;
  score: ICandidateScore;
}

const VerdictSection = async ({
  jdText,
  profileData,
  reposData,
  activitySummary,
  candidateCalssification,
  score,
}: VerdictSectionProps) => {
  const reportData = await fetchReportData({
    jdText,
    profileData,
    reposData,
    activitySummary,
    candidateCalssification,
    score,
  });

  if ("error" in reportData || "error" in profileData) return null;

  return (
    <>
      {reportData.jdMatch && <JDMatchSection jdMatch={reportData.jdMatch} />}
      <RecruiterVerdict report={reportData.report} score={profileData.score} />
    </>
  );
};

interface ReportPageProps {
  jd?: string;
  profileData: IProfileData;
  reposSectionData: IReposData;
  activityClassification: IActivityClassification;
  activitySummary: IActivitySummary;
  candidateCalssification: ICandidateClassification;
  score: ICandidateScore;
}

export const ReportPage = async ({
  jd = "",
  profileData,
  reposSectionData,
  activitySummary,
  activityClassification,
  candidateCalssification,
  score,
}: ReportPageProps) => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <CandidateHeader {...profileData} />

      {/* Middle row — 3 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TechnicalStack {...reposSectionData} />
        <ActivitySection
          activitySummary={activitySummary}
          classification={activityClassification}
        />
        <ProjectQuality
          projectQuality={candidateCalssification.projectQuality}
        />
        <CollaborationProfile
          collaboration={candidateCalssification.collaboration}
        />
      </div>

      {/* JD Match + Verdict — slowest (LLM) */}
      <Suspense fallback={<VerdictSkeleton />}>
        <VerdictSection
          activityClassification={activityClassification}
          activitySummary={activitySummary}
          candidateCalssification={candidateCalssification}
          profileData={profileData}
          reposData={reposSectionData}
          score={score}
          jdText={jd}
        />
      </Suspense>
    </div>
  );
};
