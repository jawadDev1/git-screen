import { githubFetch } from "./client";
import { INormalizedRepo } from "@/types";

//  Framework Registry
const NPM_FRAMEWORK_MAP: Record<string, string[]> = {
  //  Frontend Frameworks
  "Next.js": ["next"],
  Remix: ["@remix-run/react", "@remix-run/node"],
  "Nuxt.js": ["nuxt", "@nuxt/core"],
  SvelteKit: ["@sveltejs/kit"],
  Svelte: ["svelte"],
  Astro: ["astro"],
  Gatsby: ["gatsby"],
  "Vue.js": ["vue", "@vue/core"],
  React: ["react"],
  Angular: ["@angular/core"],
  SolidJS: ["solid-js"],
  Qwik: ["@builder.io/qwik"],

  //  UI & Styling
  TailwindCSS: ["tailwindcss"],
  "Shadcn/ui": ["@radix-ui/react-dialog"], // shadcn ships radix as peer dep
  "Material UI": ["@mui/material", "@material-ui/core"],
  "Ant Design": ["antd"],
  "Chakra UI": ["@chakra-ui/react"],
  "Styled Components": ["styled-components"],
  Emotion: ["@emotion/react", "@emotion/styled"],

  //  State Management
  Redux: ["redux", "@reduxjs/toolkit"],
  Zustand: ["zustand"],
  Jotai: ["jotai"],
  MobX: ["mobx"],
  Recoil: ["recoil"],
  "TanStack Query": ["@tanstack/react-query", "react-query"],

  // Backend / Node
  NestJS: ["@nestjs/core"],
  Express: ["express"],
  Fastify: ["fastify"],
  Hono: ["hono"],
  tRPC: ["@trpc/server", "@trpc/client"],
  Prisma: ["prisma", "@prisma/client"],
  "Drizzle ORM": ["drizzle-orm"],
  TypeORM: ["typeorm"],
  Mongoose: ["mongoose"],
  "Socket.io": ["socket.io"],
  GraphQL: ["graphql", "@apollo/server", "@apollo/client", "apollo-server"],
  "Inertia.js": ["@inertiajs/react", "@inertiajs/vue3", "@inertiajs/svelte"],

  // Testing
  Vitest: ["vitest"],
  Jest: ["jest"],
  Playwright: ["@playwright/test"],
  Cypress: ["cypress"],

  //  Build Tools / Runtimes
  Vite: ["vite"],
  Webpack: ["webpack"],
  Turbopack: ["turbopack"],
  Electron: ["electron"],
  Tauri: ["@tauri-apps/api"],
};

const COMPOSER_FRAMEWORK_MAP: Record<string, string[]> = {
  Laravel: ["laravel/framework"],
  Symfony: ["symfony/framework-bundle"],
  Lumen: ["laravel/lumen-framework"],
  CakePHP: ["cakephp/cakephp"],
  Slim: ["slim/slim"],
  "Inertia.js": ["inertiajs/inertia-laravel"],
  Livewire: ["livewire/livewire"],
  Filament: ["filament/filament"],
};

const REQUIREMENTS_FRAMEWORK_MAP: Record<string, string[]> = {
  Django: ["django", "Django"],
  FastAPI: ["fastapi", "FastAPI"],
  Flask: ["flask", "Flask"],
  SQLAlchemy: ["sqlalchemy", "SQLAlchemy"],
  Pandas: ["pandas"],
  NumPy: ["numpy"],
  TensorFlow: ["tensorflow"],
  PyTorch: ["torch"],
  Celery: ["celery", "Celery"],
  Pydantic: ["pydantic"],
  Pytest: ["pytest"],
};

// Topics / name+desc keyword signals (weak, but useful for filling gaps)
const TOPIC_KEYWORD_MAP: Record<string, string[]> = {
  "Next.js": ["nextjs", "next-js", "next.js"],
  React: ["react", "reactjs", "react-js"],
  "Vue.js": ["vue", "vuejs", "vue-js", "vue3"],
  Angular: ["angular", "angularjs"],
  Svelte: ["svelte", "sveltekit"],
  "Nuxt.js": ["nuxt", "nuxtjs"],
  Laravel: ["laravel"],
  Symfony: ["symfony"],
  Django: ["django"],
  FastAPI: ["fastapi"],
  Flask: ["flask"],
  NestJS: ["nestjs", "nest-js"],
  Express: ["express", "expressjs"],
  TailwindCSS: ["tailwind", "tailwindcss"],
  GraphQL: ["graphql"],
  Prisma: ["prisma"],
  Docker: ["docker", "containerized"],
  Kubernetes: ["kubernetes", "k8s"],
  TensorFlow: ["tensorflow"],
  PyTorch: ["pytorch"],
};

//  Types

export type FrameworkSignalSource =
  | "package.json"
  | "composer.json"
  | "requirements.txt"
  | "topics"
  | "name_description";

export interface IFrameworkSignal {
  name: string;
  repoCount: number; // how many repos it was found in
  sources: FrameworkSignalSource[]; // which sources confirmed it
  confidence: "high" | "medium" | "low";
}

export type IFrameworkMap = Record<string, IFrameworkSignal>;

// Per-repo detection result — used internally before aggregation
interface IRepoFrameworks {
  repoName: string;
  detected: {
    name: string;
    source: FrameworkSignalSource;
  }[];
}

// ─── File Content Fetchers ────────────────────────────────────────────────────

const fetchDecodedFile = async (
  fullName: string,
  filePath: string,
): Promise<string | null> => {
  try {
    const data = await githubFetch<{ content?: string; encoding?: string }>(
      `/repos/${fullName}/contents/${filePath}`,
    );

    if (!data.content || data.encoding !== "base64") return null;

    // Strip newlines GitHub injects into base64 chunks, then decode
    const cleaned = data.content.replace(/\n/g, "");
    return atob(cleaned);
  } catch {
    return null;
  }
};

// ─── Per-file Parsers ─────────────────────────────────────────────────────────

const detectFromPackageJson = (content: string): string[] => {
  try {
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };

    const allDeps = new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
    ]);

    const found: string[] = [];

    for (const [framework, packageKeys] of Object.entries(NPM_FRAMEWORK_MAP)) {
      if (packageKeys.some((key) => allDeps.has(key))) {
        found.push(framework);
      }
    }

    return found;
  } catch {
    return [];
  }
};

const detectFromComposerJson = (content: string): string[] => {
  try {
    const composer = JSON.parse(content) as {
      require?: Record<string, string>;
      "require-dev"?: Record<string, string>;
    };

    const allDeps = new Set([
      ...Object.keys(composer.require ?? {}),
      ...Object.keys(composer["require-dev"] ?? {}),
    ]);

    const found: string[] = [];

    for (const [framework, packageKeys] of Object.entries(
      COMPOSER_FRAMEWORK_MAP,
    )) {
      if (packageKeys.some((key) => allDeps.has(key))) {
        found.push(framework);
      }
    }

    return found;
  } catch {
    return [];
  }
};

const detectFromRequirementsTxt = (content: string): string[] => {
  // requirements.txt lines: "django==4.2.0", "fastapi>=0.100", "# comment"
  const packages = content
    .split("\n")
    .map((line) =>
      line
        .trim()
        .split(/[=><!\[;]/)[0]
        .trim()
        .toLowerCase(),
    )
    .filter((pkg) => pkg.length > 0 && !pkg.startsWith("#"));

  const packageSet = new Set(packages);
  const found: string[] = [];

  for (const [framework, packageKeys] of Object.entries(
    REQUIREMENTS_FRAMEWORK_MAP,
  )) {
    if (packageKeys.some((key) => packageSet.has(key.toLowerCase()))) {
      found.push(framework);
    }
  }

  return found;
};

const detectFromTopics = (topics: string[]): string[] => {
  const found: string[] = [];
  const topicSet = new Set(topics.map((t) => t.toLowerCase()));

  for (const [framework, keywords] of Object.entries(TOPIC_KEYWORD_MAP)) {
    if (keywords.some((kw) => topicSet.has(kw))) {
      found.push(framework);
    }
  }

  return found;
};

const detectFromNameDescription = (
  name: string,
  description: string | null,
): string[] => {
  const text = `${name} ${description ?? ""}`.toLowerCase();
  const found: string[] = [];

  for (const [framework, keywords] of Object.entries(TOPIC_KEYWORD_MAP)) {
    if (keywords.some((kw) => text.includes(kw))) {
      found.push(framework);
    }
  }

  return found;
};

// ─── Per-repo Detection ───────────────────────────────────────────────────────

const detectFrameworksForRepo = async (
  repo: INormalizedRepo,
): Promise<IRepoFrameworks> => {
  const detected: IRepoFrameworks["detected"] = [];

  const addAll = (names: string[], source: FrameworkSignalSource) => {
    for (const name of names) {
      detected.push({ name, source });
    }
  };

  // 1. Topics — already fetched, no API call needed
  addAll(detectFromTopics(repo.topics), "topics");

  // 2. Name + description — weak signal, no API call
  addAll(
    detectFromNameDescription(repo.name, repo.description),
    "name_description",
  );

  // 3. package.json — only if we know it exists (enriched repos set hasPackageJson)
  if (repo.hasPackageJson) {
    const content = await fetchDecodedFile(repo.fullName, "package.json");
    if (content) addAll(detectFromPackageJson(content), "package.json");
  }

  // 4. composer.json — PHP repos
  if (repo.hasComposerJson) {
    const content = await fetchDecodedFile(repo.fullName, "composer.json");
    if (content) addAll(detectFromComposerJson(content), "composer.json");
  }

  // 5. requirements.txt — Python repos
  if (repo.hasRequirementsTxt) {
    const content = await fetchDecodedFile(repo.fullName, "requirements.txt");
    if (content) addAll(detectFromRequirementsTxt(content), "requirements.txt");
  }

  return { repoName: repo.name, detected };
};

// ─── Source Confidence Rules ──────────────────────────────────────────────────

const resolveConfidence = (
  sources: FrameworkSignalSource[],
): IFrameworkSignal["confidence"] => {
  const strong: FrameworkSignalSource[] = [
    "package.json",
    "composer.json",
    "requirements.txt",
  ];

  if (sources.some((s) => strong.includes(s))) return "high";
  if (sources.includes("topics")) return "medium";
  return "low";
};

// ─── Aggregator ───────────────────────────────────────────────────────────────

const aggregateFrameworks = (results: IRepoFrameworks[]): IFrameworkMap => {
  // framework → { repoNames seen, sources seen }
  const accumulator: Record<
    string,
    { repos: Set<string>; sources: Set<FrameworkSignalSource> }
  > = {};

  for (const { repoName, detected } of results) {
    for (const { name, source } of detected) {
      if (!accumulator[name]) {
        accumulator[name] = { repos: new Set(), sources: new Set() };
      }
      accumulator[name].repos.add(repoName);
      accumulator[name].sources.add(source);
    }
  }

  const frameworkMap: IFrameworkMap = {};

  for (const [name, { repos, sources }] of Object.entries(accumulator)) {
    const sourcesArray = [...sources];
    frameworkMap[name] = {
      name,
      repoCount: repos.size,
      sources: sourcesArray,
      confidence: resolveConfidence(sourcesArray),
    };
  }

  // Sort by repoCount descending so consumers get most prevalent first
  return Object.fromEntries(
    Object.entries(frameworkMap).sort(
      ([, a], [, b]) => b.repoCount - a.repoCount,
    ),
  );
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Detect frameworks across a set of repos.
 *
 * Repos passed here should already be enriched (hasPackageJson etc. set),
 * so we skip redundant content fetches for repos that don't have manifest files.
 *
 * Processing is done concurrently with a concurrency cap to stay rate-limit safe.
 */
export const detectFrameworks = async (
  repos: INormalizedRepo[],
  concurrency = 5,
): Promise<IFrameworkMap> => {
  const results: IRepoFrameworks[] = [];

  for (let i = 0; i < repos.length; i += concurrency) {
    const chunk = repos.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((repo) => detectFrameworksForRepo(repo)),
    );
    results.push(...chunkResults);
  }

  return aggregateFrameworks(results);
};

/**
 * Returns a flat sorted array of frameworks filtered by minimum confidence.
 * Useful for passing into the LLM prompt or rendering the UI.
 *
 * e.g. getTopFrameworks(map, "medium") → [Next.js, React, Laravel, ...]
 */
export const getTopFrameworks = (
  frameworkMap: IFrameworkMap,
  minConfidence: IFrameworkSignal["confidence"] = "low",
): IFrameworkSignal[] => {
  const rank: Record<IFrameworkSignal["confidence"], number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return Object.values(frameworkMap).filter(
    (f) => rank[f.confidence] >= rank[minConfidence],
  );
};

/**
 * Formats framework data into a compact string for LLM prompts.
 *
 * Output example:
 *   Next.js (found in 6 repos via package.json) [high confidence]
 *   React (found in 8 repos via package.json, topics) [high confidence]
 *   TailwindCSS (found in 5 repos via topics, name_description) [medium confidence]
 */
export const formatFrameworksForPrompt = (
  frameworkMap: IFrameworkMap,
  minConfidence: IFrameworkSignal["confidence"] = "medium",
): string => {
  const top = getTopFrameworks(frameworkMap, minConfidence);

  if (top.length === 0)
    return "No frameworks detected with sufficient confidence.";

  return top
    .map(
      (f) =>
        `${f.name} (found in ${f.repoCount} repo${f.repoCount !== 1 ? "s" : ""} via ${f.sources.join(", ")}) [${f.confidence} confidence]`,
    )
    .join("\n");
};
