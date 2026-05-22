// Weights
// Activity    30% — are they actually coding?
// Quality     35% — is their work well-crafted?
// Experience  20% — depth of track record
// Teamwork    15% — collaboration signals

import {
  ICandidateClassification,
  ICandidateScore,
  ISectionScore,
} from "@/types";

const WEIGHTS = {
  activity: 0.3,
  quality: 0.35,
  experience: 0.2,
  collaboration: 0.15,
} as const;

//  Section Score Converters
// Each classifier output maps to a 0–100 numeric score.

const activityScore = (
  level: ICandidateClassification["activity"]["level"],
): number => {
  switch (level) {
    case "Active":
      return 100;
    case "Moderate":
      return 55;
    case "Inactive":
      return 10;
  }
};

const experienceScore = (
  level: ICandidateClassification["experience"]["level"],
): number => {
  switch (level) {
    case "Senior":
      return 100;
    case "Mid-Level":
      return 65;
    case "Junior":
      return 30;
  }
};

const collaborationScore = (
  profile: ICandidateClassification["collaboration"]["profile"],
): number => {
  switch (profile) {
    case "Team Player":
      return 100;
    case "Mixed":
      return 65;
    case "Solo Builder":
      return 30;
  }
};

//  Main Scorer

export const scoreCandidate = (
  classification: ICandidateClassification,
): ICandidateScore => {
  const sections: ISectionScore[] = [
    {
      label: "Activity",
      score: activityScore(classification.activity.level),
      weight: WEIGHTS.activity,
      weightedScore: 0,
    },
    {
      label: "Project Quality",
      score: classification.projectQuality.score,
      weight: WEIGHTS.quality,
      weightedScore: 0,
    },
    {
      label: "Experience",
      score: experienceScore(classification.experience.level),
      weight: WEIGHTS.experience,
      weightedScore: 0,
    },
    {
      label: "Collaboration",
      score: collaborationScore(classification.collaboration.profile),
      weight: WEIGHTS.collaboration,
      weightedScore: 0,
    },
  ];

  for (const section of sections) {
    section.weightedScore = Math.round(section.score * section.weight);
  }

  const overall = Math.round(
    sections.reduce((sum, s) => sum + s.weightedScore, 0),
  );

  const tier: ICandidateScore["tier"] =
    overall >= 70 ? "Strong" : overall >= 45 ? "Promising" : "Weak";

  return { overall, sections, tier };
};
