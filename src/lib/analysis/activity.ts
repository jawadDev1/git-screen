//  Constants

import { IActivitySummary, IGitHubEvent } from "@/types";
import { githubFetch } from "../github/client";

// GitHub returns max 100 events, up to 10 pages (300 events = ~3 months of activity)
const MAX_PAGES = 3;
const PER_PAGE = 100;

const DAY_MS = 1000 * 60 * 60 * 24;
const DAYS_30 = 30 * DAY_MS;
const DAYS_90 = 90 * DAY_MS;

//  Fetcher
const fetchUserEvents = async (username: string): Promise<IGitHubEvent[]> => {
  const allEvents: IGitHubEvent[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const batch = await githubFetch<IGitHubEvent[]>(
        `/users/${username}/events/public?per_page=${PER_PAGE}&page=${page}`,
      );

      allEvents.push(...batch);

      // Stop early if we got a partial page — no more events
      if (batch.length < PER_PAGE) break;
    } catch {
      // Events endpoint failing is non-fatal — return what we have
      break;
    }
  }

  return allEvents;
};

//  Analyzer
const analyzeEvents = (events: IGitHubEvent[]): IActivitySummary => {
  const now = Date.now();

  let pushesLast30 = 0;
  let pushesLast90 = 0;
  let pullRequestsOpened = 0;
  let issuesOpened = 0;
  let commitEstimate = 0;

  const eventTypes: Record<string, number> = {};
  const dayCounts: Record<string, number> = {}; // "Monday" → count

  for (const event of events) {
    const age = now - new Date(event.created_at).getTime();

    // Count event types
    eventTypes[event.type] = (eventTypes[event.type] ?? 0) + 1;

    // Track day of week for most active day
    const day = new Date(event.created_at).toLocaleDateString("en-US", {
      weekday: "long",
    });
    dayCounts[day] = (dayCounts[day] ?? 0) + 1;

    if (event.type === "PushEvent") {
      const commits = event.payload.commits?.length ?? 0;

      if (age <= DAYS_30) {
        pushesLast30++;
        commitEstimate += commits;
      }
      if (age <= DAYS_90) {
        pushesLast90++;
      }
    }

    if (
      event.type === "PullRequestEvent" &&
      event.payload.action === "opened"
    ) {
      pullRequestsOpened++;
    }

    if (event.type === "IssuesEvent" && event.payload.action === "opened") {
      issuesOpened++;
    }
  }

  const mostActiveDay =
    Object.keys(dayCounts).length === 0
      ? null
      : Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0][0];

  return {
    pushesLast30Days: pushesLast30,
    pushesLast90Days: pushesLast90,
    pullRequestsOpened,
    issuesOpened,
    commitEstimateLast30Days: commitEstimate,
    mostActiveDay,
    eventTypes,
  };
};

//  Public API

export const fetchActivitySummary = async (
  username: string,
): Promise<IActivitySummary> => {
  const events = await fetchUserEvents(username);
  return analyzeEvents(events);
};
