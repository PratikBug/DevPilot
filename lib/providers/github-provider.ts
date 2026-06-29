import crypto from "crypto";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import type {
  RepoProvider,
  RepoSummary,
  ReviewComment,
  UnifiedDiffHunk,
  UnifiedPullRequest,
} from "./repo-provider";
import { parseRepoSlug } from "./repo-provider";

function getAppOctokit() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!appId || !privateKey) {
    throw new Error("GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be set.");
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
    },
  });
}

export class GithubProvider implements RepoProvider {
  readonly provider = "github" as const;
  private installationId?: number;

  constructor(installationId?: number) {
    this.installationId = installationId;
  }

  private async getInstallationOctokit(): Promise<Octokit> {
    if (!this.installationId) {
      throw new Error("GitHub installation ID is required for API calls.");
    }

    const appOctokit = getAppOctokit();
    const { data } = await appOctokit.apps.createInstallationAccessToken({
      installation_id: this.installationId,
    });

    return new Octokit({ auth: data.token });
  }

  async listRepositories(): Promise<RepoSummary[]> {
    const octokit = await this.getInstallationOctokit();
    const repos: RepoSummary[] = [];
    let page = 1;

    while (true) {
      const { data } = await octokit.apps.listReposAccessibleToInstallation({
        per_page: 100,
        page,
      });

      for (const repo of data.repositories) {
        repos.push({
          id: repo.id.toString(),
          owner: repo.owner.login,
          name: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          defaultBranch: repo.default_branch ?? "main",
        });
      }

      if (data.repositories.length < 100) break;
      page += 1;
    }

    return repos;
  }

  async getPullRequest(repoSlug: string, prId: string): Promise<UnifiedPullRequest> {
    const octokit = await this.getInstallationOctokit();
    const { owner, repo } = parseRepoSlug(repoSlug);
    const pullNumber = parseInt(prId, 10);

    const [{ data: pr }, { data: files }] = await Promise.all([
      octokit.pulls.get({ owner, repo, pull_number: pullNumber }),
      octokit.pulls.listFiles({ owner, repo, pull_number: pullNumber, per_page: 100 }),
    ]);

    return {
      id: pr.id.toString(),
      number: pr.number,
      title: pr.title,
      author: {
        login: pr.user?.login ?? "unknown",
        avatarUrl: pr.user?.avatar_url ?? undefined,
      },
      sourceBranch: pr.head.ref,
      targetBranch: pr.base.ref,
      url: pr.html_url,
      changedFiles: files.map((file) => ({
        path: file.filename,
        status: file.status as "added" | "modified" | "removed" | "renamed",
        additions: file.additions,
        deletions: file.deletions,
      })),
    };
  }

  async getDiff(repoSlug: string, prId: string): Promise<UnifiedDiffHunk[]> {
    const octokit = await this.getInstallationOctokit();
    const { owner, repo } = parseRepoSlug(repoSlug);
    const pullNumber = parseInt(prId, 10);

    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
    });

    return files
      .filter((file) => file.patch)
      .map((file) => ({
        filePath: file.filename,
        patch: file.patch!,
      }));
  }

  async createReviewComments(
    repoSlug: string,
    prId: string,
    comments: ReviewComment[],
    summary?: string
  ): Promise<void> {
    if (comments.length === 0) return;

    const octokit = await this.getInstallationOctokit();
    const { owner, repo } = parseRepoSlug(repoSlug);
    const pullNumber = parseInt(prId, 10);

    const reviewComments = comments.map((comment) => ({
      path: comment.filePath,
      line: comment.line,
      body: comment.body,
    }));

    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      event: "COMMENT",
      body: summary ?? "DevPilot AI review completed.",
      comments: reviewComments,
    });
  }
}

export function verifyGithubWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
