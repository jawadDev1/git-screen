export type IGithubErrors =
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export interface IGitHubClientError {
  type: IGithubErrors;
  message: string;
  retryAfter?: number;
  resetAt?: Date;
}

export interface IRateLimitState {
  remaining: number;
  resetAt: Date;
  limit: number;
}

// Profile Types
export interface IGitHubProfile {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface INormalizedProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  email: string | null;
  twitterUsername: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  joinedAt: Date;
  updatedAt: Date;
  yearsActive: number;
  accountAgeDays: number;
}

export interface IGitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  private: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  has_issues: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  license: { name: string; spdx_id: string } | null;
  size: number; // in KB
  default_branch: string;
  visibility: "public" | "private";
}

export interface INormalizedRepo {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  isFork: boolean;
  primaryLanguage: string | null;
  topics: string[];
  stars: number;
  forks: number;
  openIssues: number;
  hasLicense: boolean;
  licenseName: string | null;
  hasTopics: boolean;
  sizeKb: number;
  createdAt: Date;
  updatedAt: Date;
  pushedAt: Date | null;
  daysSinceLastPush: number;
  defaultBranch: string;
  languages: IRepoLanguages; // { TypeScript: 12400, CSS: 3200, ... }
  hasReadme: boolean;
  hasPackageJson: boolean;
  hasComposerJson: boolean;
  hasRequirementsTxt: boolean;
}

export type IRepoLanguages = Record<string, number>;

export interface IRepoStats {
  total: number;
  ownedCount: number;
  forkedCount: number;
  staleCount: number;
  activeCount: number;
  totalStars: number;
  totalForks: number;
  avgStars: number;
  mostStarredRepo: INormalizedRepo | null;
  reposWithReadme: number;
  reposWithLicense: number;
  reposWithTopics: number;
  documentationScore: number;
}
