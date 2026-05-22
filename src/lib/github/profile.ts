import { IGitHubProfile, INormalizedProfile } from "@/types";
import { githubFetch, GitHubError } from "./client";
import { normalizeProfile, parseGitHubUsername } from "../utils";

export const fetchGitHubProfile = async (
  usernameOrUrl: string,
): Promise<INormalizedProfile> => {
  const username = parseGitHubUsername(usernameOrUrl);

  if (!username) {
    throw new GitHubError({
      type: "NOT_FOUND",
      message:
        "Invalid GitHub URL or username. Expected formats: 'username' or 'github.com/username'.",
    });
  }

  const raw = await githubFetch<IGitHubProfile>(`/users/${username}`);
  return normalizeProfile(raw);
};
