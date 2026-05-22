# ANSWERS.md

---

## 1. How to Run

**Prerequisites**

- Node.js v18 or higher
- pnpm (`npm install -g pnpm` if not installed)

**Setup**

```bash
# Clone the repo
git clone https://github.com/jawadDev1/git-screen.git
cd git-screen

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
```

Fill in `.env`:

```env
GITHUB_TOKEN=your-github-token
GITHUB_API_BASE="https://api.github.com"
GEMINI_API_KEY=your-google-api-key
```

- **GitHub Token** — [github.com/settings/tokens](https://github.com/settings/tokens) → Generate new classic token → scope: `public_repo`
- **Gemini API Key** — [aistudio.google.com](https://aistudio.google.com) → Get API key → Create API key

```bash
# Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 2. Stack Choice

I chose **Next.js** because the project needs backend processing — GitHub API calls with a secret token, LLM calls via Gemini — and Next.js Server Actions let me do all of that without a separate backend.

Next.js also comes with a built-in router and a sensible project structure out of the box, which made development fast under a 48-hour constraint.

**A worse choice would have been a pure client-side React app (Vite/CRA).** All GitHub API calls would have to go through the browser, exposing the `GITHUB_TOKEN` to anyone who opens DevTools. I'd also have to build a separate backend anyway to protect the Gemini API key, which defeats the purpose.

---

## 3. One Real Edge Case

**File:** `src/lib/github/client.ts` — `assertRateLimitSafe()` and `updateRateLimitState()`

Every GitHub API response includes `x-ratelimit-remaining` and `x-ratelimit-reset` headers. After every fetch, `updateRateLimitState()` reads these headers and tracks the current rate limit state in memory. Before kicking off a full analysis which can make 25–40 API calls, `assertRateLimitSafe()` is called — if fewer than 10 requests remain, it throws a typed `RATE_LIMITED` error with the reset time before a single analysis call is made.

**Without this:** the analysis would start, succeed for the first few API calls, then silently fail mid-way through — returning a partial report with missing repo data, framework detection results, or activity stats, with no clear error message to the user. The failure would happen at a random point in the pipeline depending on how many requests were left.

The evaluator can trigger this by running several analyses back-to-back without a `GITHUB_TOKEN` set (60 requests/hour unauthenticated limit).

---

## 4. AI Usage

**Tools used: Claude, Stitch**

- **Stitch** — used for designing the UI. It generated the initial landing page and report page visual designs which I used as inspiration and reference while building the actual components.

- **Claude** — used throughout the project:
  - Researching free public APIs, exploring what problems I could solve, and landing on the final project idea
  - Generating the `jd-matcher.ts` skill alias map — a large static data structure mapping hundreds of skill name variations to canonical names (e.g. `"reactjs"`, `"react.js"` → `"React"`)
  - Writing the Gemini prompt templates in `lib/llm/prompts.ts`
  - Scaffolding boilerplate for GitHub API layer, types, and report components

**What I changed:**

_Scoring formula_ — Claude generated a `scoreRepo()` function that awarded 20 points for a repo having topics. That felt too high — topics are a weak quality signal (anyone can slap tags on a bad repo). I reduced topics to 10 points and increased the recency bonus from 15 to 20 points, since a repo being actively maintained is a stronger quality indicator than its tags.

_Architecture_ — Claude's initial suggestion was to run the full analysis on the landing page, store the result in `sessionStorage`, and read it on the report page via a custom hook. I scrapped this entirely. Storing a large analysis object in `sessionStorage` is fragile (size limits, stale data on refresh), and it meant the user waits on the landing page with a spinner. I switched to Server Actions: the landing page only validates that the profile exists (one API call), then navigates immediately. All fetching and the LLM call happen on the report page server-side, with the verdict section streaming in last via React Suspense.

---

## 5. Honest Gap

The LLM report output is not well-formatted enough. Right now Gemini returns a long block of text that gets parsed by section headers and displayed as plain paragraphs. On a strong candidate profile the verdict section becomes a wall of text readable but not visually scannable for a recruiter who wants a quick answer.
