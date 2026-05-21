import { IGitHubClientError, IRateLimitState } from "@/types";
import { parseErrorResponse } from "@/lib/errors";

const GITHUB_API_BASE = process.env.GITHUB_API_BASE || "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export class GitHubError extends Error {
  public readonly clientError: IGitHubClientError;

  constructor(clientError: IGitHubClientError) {
    super(clientError.message);
    this.name = "GitHubError";
    this.clientError = clientError;
  }
}

let rateLimitState: IRateLimitState | null = null;

export function getRateLimitState(): IRateLimitState | null {
  return rateLimitState;
}

const updateRateLimitState = (headers: Headers) => {
  const remaining = headers.get("x-ratelimit-remaining");
  const reset = headers.get("x-ratelimit-reset");
  const limit = headers.get("x-ratelimit-limit");

  if (remaining !== null && reset !== null && limit !== null) {
    rateLimitState = {
      remaining: parseInt(remaining, 10),
      resetAt: new Date(parseInt(reset, 10) * 1000),
      limit: parseInt(limit, 10),
    };
  }
};

export const githubFetch = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const url = endpoint.startsWith("https://")
    ? endpoint
    : `${GITHUB_API_BASE}${endpoint}`;

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    ...options.headers,
  };

  // Abort after 10 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    updateRateLimitState(response.headers);

    if (!response.ok) {
      throw new GitHubError(
        parseErrorResponse(response.status, response.headers),
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof GitHubError) throw error;

    // Timeout
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new GitHubError({
        type: "NETWORK_ERROR",
        message: "GitHub API request timed out after 10 seconds.",
      });
    }

    // Network failure
    throw new GitHubError({
      type: "NETWORK_ERROR",
      message: "Could not reach GitHub API. Check your internet connection.",
    });
  }
};

// Parallel Fetcher
export const githubFetchParallel = async <T>(
  endpoints: string[],
  concurrency = 5,
): Promise<PromiseSettledResult<T>[]> => {
  const results: PromiseSettledResult<T>[] = [];

  // Process in chunks of `concurrency`
  for (let i = 0; i < endpoints.length; i += concurrency) {
    const chunk = endpoints.slice(i, i + concurrency);
    const chunkResults = await Promise.allSettled(
      chunk.map((endpoint) => githubFetch<T>(endpoint)),
    );
    results.push(...chunkResults);
  }

  return results;
};

// Rate Limit Guard

export function assertRateLimitSafe(minRemaining = 10): void {
  if (!rateLimitState) return;

  if (rateLimitState.remaining < minRemaining) {
    throw new GitHubError({
      type: "RATE_LIMITED",
      message: `Only ${rateLimitState.remaining} GitHub API requests remaining. Resets at ${rateLimitState.resetAt.toLocaleTimeString()}.`,
      resetAt: rateLimitState.resetAt,
    });
  }
}
