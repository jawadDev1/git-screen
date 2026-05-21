import { IGitHubClientError } from "@/types";

export const parseErrorResponse = (
  status: number,
  headers: Headers,
): IGitHubClientError => {
  const retryAfter = headers.get("retry-after");

  // Rate limited
  if (status === 403 || status === 429) {
    const resetHeader = headers.get("x-ratelimit-reset");
    const resetAt = resetHeader
      ? new Date(parseInt(resetHeader, 10) * 1000)
      : undefined;

    return {
      type: "RATE_LIMITED",
      message: retryAfter
        ? `Rate limited. Retry after ${retryAfter} seconds.`
        : `GitHub API rate limit exceeded. Resets at ${resetAt?.toLocaleTimeString() ?? "unknown"}.`,
      retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
      resetAt,
    };
  }

  if (status === 401) {
    return {
      type: "UNAUTHORIZED",
      message:
        "GitHub token is invalid or expired. Check your GITHUB_TOKEN env variable.",
    };
  }

  if (status === 404) {
    return {
      type: "NOT_FOUND",
      message: "GitHub resource not found. The user or repo may not exist.",
    };
  }

  if (status >= 500) {
    return {
      type: "SERVER_ERROR",
      message: `GitHub API server error (${status}). Try again in a moment.`,
    };
  }

  return {
    type: "UNKNOWN",
    message: `Unexpected GitHub API response (${status}).`,
  };
};
