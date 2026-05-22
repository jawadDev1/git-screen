"use server";

import { fetchGitHubProfile } from "@/lib/github/profile";
import { GitHubError } from "@/lib/github/client";

export interface IValidateProfileResult {
  success: boolean;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  error?: string;
}

export const validateGitHubProfile = async (
  url: string,
): Promise<IValidateProfileResult> => {
  try {
    const profile = await fetchGitHubProfile(url);

    return {
      success: true,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
    };
  } catch (error) {
    if (error instanceof GitHubError) {
      switch (error.clientError.type) {
        case "NOT_FOUND":
          return {
            success: false,
            error: "GitHub profile not found. Check the URL and try again.",
          };
        case "RATE_LIMITED":
          return {
            success: false,
            error: error.clientError.resetAt
              ? `GitHub API rate limit reached. Resets at ${error.clientError.resetAt.toLocaleTimeString()}.`
              : "GitHub API rate limit reached. Please wait a moment.",
          };
        case "NETWORK_ERROR":
          return {
            success: false,
            error: "Could not reach GitHub. Check your connection.",
          };
        default:
          return {
            success: false,
            error: error.clientError.message,
          };
      }
    }

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
};
