export type ProviderType = "github" | "bitbucket" | "gitlab";

export interface RepoSummary {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  url: string;
  defaultBranch: string;
}

export interface UnifiedChangedFile {
  path: string;
  status: "added" | "modified" | "removed" | "renamed";
  additions: number;
  deletions: number;
}

export interface UnifiedPullRequest {
  id: string;
  number: number;
  title: string;
  author: { login: string; avatarUrl?: string };
  sourceBranch: string;
  targetBranch: string;
  url: string;
  changedFiles: UnifiedChangedFile[];
}

export interface UnifiedDiffHunk {
  filePath: string;
  patch: string;
}

export type ReviewSeverity = "info" | "warning" | "critical";

export interface ReviewComment {
  filePath: string;
  line: number;
  body: string;
  severity: ReviewSeverity;
}

export interface RepoProvider {
  provider: ProviderType;
  listRepositories(): Promise<RepoSummary[]>;
  getPullRequest(repoSlug: string, prId: string): Promise<UnifiedPullRequest>;
  getDiff(repoSlug: string, prId: string): Promise<UnifiedDiffHunk[]>;
  createReviewComments(
    repoSlug: string,
    prId: string,
    comments: ReviewComment[],
    summary?: string
  ): Promise<void>;
}

export class NotImplementedError extends Error {
  constructor(provider: string, method: string) {
    super(`${provider} provider: ${method} is not implemented yet (Phase 2).`);
    this.name = "NotImplementedError";
  }
}

export function parseRepoSlug(repoSlug: string): { owner: string; repo: string } {
  const [owner, ...rest] = repoSlug.split("/");
  const repo = rest.join("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repo slug: ${repoSlug}. Expected "owner/repo".`);
  }
  return { owner, repo };
}
