import { IJDMatchResult, INormalizedRepo, ISkillMatch } from "@/types";
import { IFrameworkMap } from "@/lib/github/frameworks";

// Skill Aliases
const SKILL_ALIASES: Record<string, string> = {
  // JavaScript
  javascript: "JavaScript",
  js: "JavaScript",
  // TypeScript
  typescript: "TypeScript",
  ts: "TypeScript",
  // React
  react: "React",
  reactjs: "React",
  "react.js": "React",
  // Next.js
  next: "Next.js",
  nextjs: "Next.js",
  "next.js": "Next.js",
  // Vue
  vue: "Vue.js",
  vuejs: "Vue.js",
  "vue.js": "Vue.js",
  // Angular
  angular: "Angular",
  angularjs: "Angular",
  // Node
  node: "Node.js",
  nodejs: "Node.js",
  "node.js": "Node.js",
  // Python
  python: "Python",
  // PHP
  php: "PHP",
  // Laravel
  laravel: "Laravel",
  // Django
  django: "Django",
  // FastAPI
  fastapi: "FastAPI",
  // Go
  go: "Go",
  golang: "Go",
  // Rust
  rust: "Rust",
  // Java
  java: "Java",
  // Kotlin
  kotlin: "Kotlin",
  // Swift
  swift: "Swift",
  // Ruby
  ruby: "Ruby",
  rails: "Ruby on Rails",
  "ruby on rails": "Ruby on Rails",
  // Databases
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
  mongo: "MongoDB",
  redis: "Redis",
  sqlite: "SQLite",
  // Cloud
  aws: "AWS",
  "amazon web services": "AWS",
  gcp: "GCP",
  "google cloud": "GCP",
  azure: "Azure",
  // DevOps
  docker: "Docker",
  kubernetes: "Kubernetes",
  k8s: "Kubernetes",
  terraform: "Terraform",
  "ci/cd": "CI/CD",
  cicd: "CI/CD",
  "github actions": "GitHub Actions",
  // CSS/UI
  tailwind: "TailwindCSS",
  tailwindcss: "TailwindCSS",
  css: "CSS",
  sass: "SASS",
  // GraphQL / API
  graphql: "GraphQL",
  rest: "REST APIs",
  "rest api": "REST APIs",
  restful: "REST APIs",
  // Testing
  jest: "Jest",
  vitest: "Vitest",
  cypress: "Cypress",
  playwright: "Playwright",
  // Other
  nestjs: "NestJS",
  nest: "NestJS",
  express: "Express",
  prisma: "Prisma",
  redux: "Redux",
  git: "Git",
  linux: "Linux",
};

// Tech terms that appear in JDs but aren't skills to match against
const STOP_WORDS = new Set([
  "experience",
  "years",
  "strong",
  "knowledge",
  "understanding",
  "proficient",
  "familiar",
  "work",
  "team",
  "communication",
  "ability",
  "english",
  "written",
  "verbal",
  "problem",
  "solving",
  "agile",
  "scrum",
  "skills",
  "with",
  "and",
  "or",
  "in",
  "of",
  "the",
  "a",
  "to",
  "for",
  "using",
  "based",
  "driven",
  "oriented",
  "first",
  "native",
  "stack",
  "full",
  "back",
  "end",
  "front",
  "web",
  "mobile",
  "app",
  "applications",
  "development",
  "developer",
  "engineer",
  "senior",
  "junior",
  "mid",
  "level",
  "plus",
  "bonus",
]);

export const extractSkillsFromJD = (jdText: string): string[] => {
  if (!jdText || jdText.trim().length < 20) return [];

  const lower = jdText.toLowerCase();
  const found = new Set<string>();

  // 1. Direct alias match
  for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
    // Use word boundary check: the alias must be a standalone term
    const pattern = new RegExp(
      `(?<![a-z0-9])${escapeRegex(alias)}(?![a-z0-9])`,
      "i",
    );
    if (pattern.test(lower)) {
      found.add(canonical);
    }
  }

  // 2. Token pass
  const tokens = jdText
    .replace(/[^\w\s.#+]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t.toLowerCase()));

  for (const token of tokens) {
    // Capitalized tokens that aren't already covered by alias map
    if (/^[A-Z][a-zA-Z0-9.#+]*$/.test(token) && !found.has(token)) {
      const normalized = SKILL_ALIASES[token.toLowerCase()];
      if (normalized) {
        found.add(normalized);
      } else if (token.length >= 3) {
        // Unknown tech term — include as-is, will show as "missing" if not matched
        found.add(token);
      }
    }
  }

  return [...found];
};

// Candidate Data Indexer
interface ICandidateSkillIndex {
  frameworkRepoCount: Record<string, number>;
  languageBreakdown: Record<string, number>;
  allTopics: Set<string>;
  nameDescText: string;
}

const buildCandidateIndex = (
  repos: INormalizedRepo[],
  frameworkMap: IFrameworkMap,
  languageBreakdown: Record<string, number>,
): ICandidateSkillIndex => {
  const frameworkRepoCount: Record<string, number> = {};
  for (const [name, signal] of Object.entries(frameworkMap)) {
    frameworkRepoCount[name] = signal.repoCount;
  }

  const allTopics = new Set<string>();
  const nameDescParts: string[] = [];

  for (const repo of repos) {
    repo.topics.forEach((t) => allTopics.add(t.toLowerCase()));
    nameDescParts.push(repo.name.toLowerCase());
    if (repo.description) nameDescParts.push(repo.description.toLowerCase());
  }

  return {
    frameworkRepoCount,
    languageBreakdown,
    allTopics,
    nameDescText: nameDescParts.join(" "),
  };
};

// Skill Cross-Referencer
const matchSkill = (
  skill: string,
  index: ICandidateSkillIndex,
): ISkillMatch => {
  const skillLower = skill.toLowerCase();

  //  Framework map
  const repoCount = index.frameworkRepoCount[skill];
  if (repoCount !== undefined) {
    return {
      skill,
      status: repoCount >= 3 ? "found" : "partial",
      evidence: `found in ${repoCount} repo${repoCount !== 1 ? "s" : ""}`,
    };
  }

  // Language
  const langMatch = Object.entries(index.languageBreakdown).find(
    ([lang]) => lang.toLowerCase() === skillLower,
  );
  if (langMatch) {
    const [langName, pct] = langMatch;
    return {
      skill,
      status: pct >= 10 ? "found" : "partial",
      evidence: `${pct}% of codebase (${langName})`,
    };
  }

  // Topics
  const topicKeywords = SKILL_ALIASES[skillLower]
    ? [skillLower]
    : [
        skillLower,
        skillLower.replace(/[.\s]/g, ""),
        skillLower.replace(/[.\s]/g, "-"),
      ];

  if (topicKeywords.some((kw) => index.allTopics.has(kw))) {
    return {
      skill,
      status: "partial",
      evidence: "found in repo topics",
    };
  }

  // Name + description weak signal
  if (
    topicKeywords.some((kw) => index.nameDescText.includes(kw)) ||
    index.nameDescText.includes(skillLower)
  ) {
    return {
      skill,
      status: "partial",
      evidence: "mentioned in repo names/descriptions",
    };
  }

  return { skill, status: "missing", evidence: null };
};

//  Score Calculator
// found   → full point (1.0)
// partial → half point (0.5)
// missing → no point

const calcMatchScore = (breakdown: ISkillMatch[]): number => {
  if (breakdown.length === 0) return 0;

  const points = breakdown.reduce((sum, s) => {
    if (s.status === "found") return sum + 1;
    if (s.status === "partial") return sum + 0.5;
    return sum;
  }, 0);

  return Math.round((points / breakdown.length) * 100);
};

//  Public API

export const matchJD = (
  jdText: string,
  repos: INormalizedRepo[],
  frameworkMap: IFrameworkMap,
  languageBreakdown: Record<string, number>,
): IJDMatchResult | null => {
  const skills = extractSkillsFromJD(jdText);

  if (skills.length === 0) return null;

  const index = buildCandidateIndex(repos, frameworkMap, languageBreakdown);
  const breakdown = skills.map((skill) => matchSkill(skill, index));

  const found = breakdown.filter((s) => s.status === "found").length;
  const partial = breakdown.filter((s) => s.status === "partial").length;
  const missing = breakdown.filter((s) => s.status === "missing").length;
  const score = calcMatchScore(breakdown);

  let summary: string;
  if (score >= 75) {
    summary = `Strong match — candidate covers ${found} of ${skills.length} required skills directly.`;
  } else if (score >= 45) {
    summary = `Moderate match — covers some requirements but gaps exist in ${missing} skill(s).`;
  } else {
    summary = `Weak match — significant skill gaps detected. ${missing} of ${skills.length} required skills not found.`;
  }

  return {
    score,
    totalSkills: skills.length,
    matched: found,
    partial,
    missing,
    breakdown,
    summary,
  };
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
