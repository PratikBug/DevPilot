# DevPilot

AI Frontend Debugging + PR Review Agent. DevPilot reviews pull requests across GitHub and Bitbucket, performs frontend debugging, explains root cause, suggests fixes, and comments directly on PRs.

## Architecture

```
Frontend Dashboard
       ↓
Repo Connector Layer (GitHub API | Bitbucket API)
       ↓
Unified PR Format (RepoProvider)
       ↓
Frontend Debugging Agent
       ↓
Code Review Agent
       ↓
Comment Generator
       ↓
Post Review
```

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS + shadcn/ui**
- **NextAuth.js v5** (GitHub OAuth for dashboard login)
- **GitHub App** (repo access, webhooks, PR review comments)
- **Vercel AI SDK** + OpenAI (structured output)
- **Prisma** + SQLite (local dev) / PostgreSQL (production)

## Requirements

- **Node.js 20 LTS** or later (see `.nvmrc`)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in the required values (see [Environment Variables](#environment-variables) below).

### 3. Initialize database

```bash
npm run db:push
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub App Setup

DevPilot uses a **GitHub App** (not just OAuth) for repository access, webhooks, and posting PR review comments.

### Step 1: Create a GitHub OAuth App (dashboard login)

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. Create a new OAuth App:
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
3. Copy `Client ID` and `Client Secret` to `.env`:
   ```
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```

### Step 2: Create a GitHub App (repo access + webhooks)

1. Go to [GitHub Developer Settings → GitHub Apps](https://github.com/settings/apps)
2. Create a new GitHub App:
   - **Setup URL:** `https://your-domain.com/api/github/setup` (redirects to dashboard after install)
   - **Webhook URL:** `https://your-domain.com/api/webhooks/github` (use ngrok for local dev)
   - **Webhook secret:** generate a random string → `GITHUB_WEBHOOK_SECRET`
   - **Permissions:**
     - Repository → Pull requests: **Read & write**
     - Repository → Contents: **Read**
     - Repository → Metadata: **Read**
   - **Subscribe to events:**
     - Pull request
     - Installation
3. Generate a private key and download it
4. Set in `.env`:
   ```
   GITHUB_APP_ID=123456
   GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
   GITHUB_WEBHOOK_SECRET=your-webhook-secret
   GITHUB_APP_SLUG=your-app-slug
   NEXT_PUBLIC_GITHUB_APP_SLUG=your-app-slug
   ```

### Step 3: Install the App

1. Visit `https://github.com/apps/{your-app-slug}/installations/new`
2. Select organization/account and repositories
3. In DevPilot dashboard → Settings → click **Sync** to fetch repositories

### Step 4: Local webhook testing (optional)

Use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
```

Update your GitHub App webhook URL to `https://<ngrok-id>.ngrok.io/api/webhooks/github`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | App URL (`http://localhost:3000`) |
| `GITHUB_CLIENT_ID` | Yes | OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | Yes | OAuth App client secret |
| `GITHUB_APP_ID` | Yes | GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | Yes | GitHub App private key (PEM) |
| `GITHUB_WEBHOOK_SECRET` | Yes | Webhook HMAC secret |
| `GITHUB_APP_SLUG` | Yes | GitHub App slug for install URL |
| `NEXT_PUBLIC_GITHUB_APP_SLUG` | Yes | Same slug, exposed to client |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI agents |
| `DATABASE_URL` | Yes | `file:./dev.db` for SQLite local dev |

## Usage

### Automatic review (webhook)

When a PR is opened, synchronized, or reopened, DevPilot automatically:
1. Fetches the PR diff via `GithubProvider`
2. Runs the Frontend Debugging Agent
3. Runs the Code Review Agent
4. Generates inline PR comments
5. Posts the review to GitHub

### Manual review (dashboard)

1. Sign in with GitHub
2. Install the GitHub App and sync repositories
3. Navigate to a PR detail page: `/dashboard/repos/{owner}/{repo}/prs/{number}`
4. Click **Run DevPilot Review**

## RepoProvider Abstraction

Agents are host-agnostic via the `RepoProvider` interface:

```typescript
interface RepoProvider {
  listRepositories(): Promise<RepoSummary[]>;
  getPullRequest(repoSlug, prId): Promise<UnifiedPullRequest>;
  getDiff(repoSlug, prId): Promise<UnifiedDiffHunk[]>;
  createReviewComments(repoSlug, prId, comments, summary?): Promise<void>;
}
```

| Provider | Status |
|----------|--------|
| `GithubProvider` | ✅ Implemented |
| `BitbucketProvider` | 🔜 Stub (Phase 2) |
| `GitlabProvider` | 🔜 Planned |

## Phase 2 — Bitbucket

Bitbucket integration will use OAuth 2.0:

- `GET /repositories/{workspace}/{repo_slug}/pullrequests`
- `GET .../pullrequests/{id}/diff`
- `POST /pullrequests/{id}/comments`

The `BitbucketProvider` stub is ready — implement the methods and add a webhook handler.

## Phase 3 — Jira Integration

When DevPilot detects a critical bug:

```
PR → AI detects bug → Create Jira ticket → Assign developer
```

Example output on PR: `JIRA: FE-982 — Keyboard accessibility broken`

## Project Structure

```
app/
  page.tsx                          # Landing page
  dashboard/                        # Dashboard pages
  api/
    auth/[...nextauth]/route.ts     # NextAuth
    webhooks/github/route.ts        # GitHub webhooks
    reviews/route.ts                # Manual review trigger
    installations/route.ts          # Sync repos
components/
  dashboard/                        # Dashboard components
  ui/                               # shadcn/ui components
lib/
  providers/                        # RepoProvider abstraction
  agents/                           # AI agents
  review/run-review.ts              # Review orchestrator
prisma/schema.prisma                # Database schema
```

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

## License

MIT
