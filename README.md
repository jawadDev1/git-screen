# [GitScreen](https://git-screen.vercel.app)

AI-powered GitHub candidate screener — paste a GitHub profile URL, get a structured recruiter report in seconds. Optionally paste a job description to generate a skill match score.

---

## Prerequisites

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **pnpm** v9 or higher

If you don't have pnpm installed:

```bash
npm install -g pnpm
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/jawadDev1/git-screen.git
cd git-screen
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Then fill in the values in `.env`:

```env
GITHUB_TOKEN=your-github-token
GITHUB_API_BASE="https://api.github.com"
GEMINI_API_KEY=your-google-api-key
```

---

## Getting Your API Keys

### GitHub Token (Required for higher rate limits)

Without a token, GitHub limits you to **60 requests/hour**. With a token, you get **5,000/hour** — required for analyzing profiles with many repos.

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token → Generate new token (classic)**
3. Give it a name e.g. `gitscreen`
4. Under **Select scopes**, you only need **`public_repo`** (read-only access to public repositories)
5. Click **Generate token** and copy it into `GITHUB_TOKEN`

> The `GITHUB_API_BASE` value should stay as `https://api.github.com` — no changes needed.

### Gemini API Key (Required)

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **Get API key → Create API key**
4. Copy it into `GEMINI_API_KEY`

> The free tier is generous enough for development and demo use.

---

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
gitscreen/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing page
│   │   └── report/[username]/  # Report page (server-rendered)
│   ├── actions/                # Next.js Server Actions
│   │   ├── analyze.ts          # Full analysis pipeline
│   │   └── validate-profile.ts # Profile existence check
│   ├── components/
│   │   ├── landing/            # Landing page components
│   │   ├── report/             # Report section components + skeletons
│   │   ├── common/             # Shared components (Typography etc.)
│   │   └── ui/                 # shadcn/ui primitives
│   ├── lib/
│   │   ├── github/             # GitHub API layer (profile, repos, frameworks, activity)
│   │   ├── analysis/           # Scoring, classification, JD matching
│   │   └── llm/                # Gemini client, prompts, analyzer
│   └── types/                  # Shared TypeScript interfaces
├── .env.example                # Environment variable template
└── README.md
```

---

## Tech Stack

| Category        | Technology                           |
| --------------- | ------------------------------------ |
| Framework       | Next.js 16 (App Router)              |
| Language        | TypeScript                           |
| Styling         | Tailwind CSS v4                      |
| Components      | shadcn/ui                            |
| LLM             | Google Gemini 2.5 Flash              |
| Data            | GitHub REST API + GitHub GraphQL API |
| Package Manager | pnpm                                 |

---

## How It Works

1. **Recruiter** pastes a GitHub profile URL on the landing page
2. A **server action** validates the profile exists (single API call)
3. On navigation to the report page, the server **fetches in parallel**:
   - Profile metadata
   - All public repositories (paginated, up to 500)
   - Framework detection via `package.json` / `composer.json` / `requirements.txt`
   - Activity data via GitHub GraphQL API
4. A **scoring algorithm** classifies the candidate across activity, project quality, experience, and collaboration
5. If a **job description** was provided, skills are extracted and cross-referenced against the candidate's detected stack
6. All data is passed to **Gemini 2.5 Flash** which generates a structured, recruiter-friendly report
7. The verdict section **streams in last** via React Suspense, so the rest of the report renders immediately

---

## Error Handling

The app handles the following failure cases gracefully:

- **Invalid GitHub URL** — inline validation error before any API call is made
- **Profile not found** — clear error message, no navigation
- **GitHub API rate limit** — shows reset time, prompts to add a token
- **Slow or timing out API** — 10s timeout per request via `AbortController`
- **Gemini timeout** — 30s timeout, error surfaced in the verdict section only
- **Partial data** — if a secondary fetch fails (e.g. activity), the rest of the report still renders

---

## Environment Variables Reference

| Variable          | Required    | Description                                                      |
| ----------------- | ----------- | ---------------------------------------------------------------- |
| `GITHUB_TOKEN`    | Recommended | Personal access token for higher rate limits (5000 req/hr vs 60) |
| `GITHUB_API_BASE` | Yes         | GitHub API base URL — keep as `https://api.github.com`           |
| `GEMINI_API_KEY`  | Yes         | Google AI Studio API key for Gemini 2.5 Flash                    |
