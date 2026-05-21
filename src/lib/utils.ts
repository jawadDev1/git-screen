import { IGitHubProfile, INormalizedProfile } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const computeYearsActive = (createdAt: string) => {
  const joined = new Date(createdAt);
  const now = new Date();
  const diff = now.getFullYear() - joined.getFullYear();
  const hasHadAnniversary =
    now.getMonth() > joined.getMonth() ||
    (now.getMonth() === joined.getMonth() && now.getDate() >= joined.getDate());
  return hasHadAnniversary ? diff : Math.max(diff - 1, 0);
};

export const computeAccountAgeDays = (createdAt: string) => {
  const joined = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - joined.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export const normalizeProfile = (raw: IGitHubProfile): INormalizedProfile => ({
  username: raw.login,
  displayName: raw.name ?? raw.login,
  avatarUrl: raw.avatar_url,
  profileUrl: raw.html_url,
  bio: raw.bio,
  location: raw.location,
  company: raw.company?.replace(/^@/, "") ?? null,
  blog: raw.blog || null,
  email: raw.email,
  twitterUsername: raw.twitter_username,
  publicRepos: raw.public_repos,
  followers: raw.followers,
  following: raw.following,
  joinedAt: new Date(raw.created_at),
  updatedAt: new Date(raw.updated_at),
  yearsActive: computeYearsActive(raw.created_at),
  accountAgeDays: computeAccountAgeDays(raw.created_at),
});

export const parseGitHubUsername = (input: string): string | null => {
  const trimmed = input.trim();

  // Already a plain username
  if (/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(trimmed)) {
    return trimmed;
  }

  // Full URL — github.com/username or github.com/username/
  try {
    const url = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
    );

    if (!url.hostname.includes("github.com")) return null;

    // pathname = "/username" or "/username/" or "/username/repo"
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;

    const username = parts[0];

    // Validate extracted username
    if (/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username)) {
      return username;
    }

    return null;
  } catch {
    return null;
  }
};

export const computeDaysSinceLastPush = (pushedAt: string | null): number => {
  if (!pushedAt) return Infinity;
  const diff = Date.now() - new Date(pushedAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};
