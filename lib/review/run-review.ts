import { db } from "@/lib/db";
import { createRepoProvider } from "@/lib/providers/factory";
import {
  mergeFindings,
  runCodeReviewAgent,
  runFrontendDebuggingAgent,
} from "@/lib/agents/frontend-debugging";
import {
  buildReviewSummary,
  generateReviewComments,
} from "@/lib/agents/comment-generator";
import type { AgentFinding } from "@/lib/agents/frontend-debugging";

export interface RunReviewOptions {
  provider: "github" | "bitbucket" | "gitlab";
  installationId?: number;
  owner: string;
  repo: string;
  prNumber: number;
  triggeredBy: "webhook" | "manual";
  postComments?: boolean;
}

export interface RunReviewResult {
  reviewRunId: string;
  status: "completed" | "failed";
  findings: AgentFinding[];
  postedCommentCount: number;
  errorMessage?: string;
}

export async function runReview(options: RunReviewOptions): Promise<RunReviewResult> {
  const repoSlug = `${options.owner}/${options.repo}`;
  const provider = createRepoProvider(options.provider, {
    installationId: options.installationId,
  });

  const repository = await db.repository.upsert({
    where: {
      provider_owner_name: {
        provider: options.provider,
        owner: options.owner,
        name: options.repo,
      },
    },
    create: {
      provider: options.provider,
      owner: options.owner,
      name: options.repo,
    },
    update: {},
  });

  const reviewRun = await db.reviewRun.create({
    data: {
      repositoryId: repository.id,
      prNumber: options.prNumber,
      status: "running",
      triggeredBy: options.triggeredBy,
    },
  });

  try {
    const [pullRequest, diffs] = await Promise.all([
      provider.getPullRequest(repoSlug, options.prNumber.toString()),
      provider.getDiff(repoSlug, options.prNumber.toString()),
    ]);

    const debuggingFindings = await runFrontendDebuggingAgent(diffs);
    const reviewFindings = await runCodeReviewAgent(diffs, debuggingFindings);
    const allFindings = mergeFindings(debuggingFindings, reviewFindings);

    const comments = generateReviewComments(allFindings, diffs);
    const shouldPost = options.postComments !== false;

    if (shouldPost && comments.length > 0) {
      await provider.createReviewComments(
        repoSlug,
        options.prNumber.toString(),
        comments,
        buildReviewSummary(comments)
      );
    } else if (shouldPost && comments.length === 0) {
      await provider.createReviewComments(
        repoSlug,
        options.prNumber.toString(),
        [],
        "## DevPilot AI Review\n\nNo issues found in changed frontend files. ✅"
      );
    }

    await db.reviewRun.update({
      where: { id: reviewRun.id },
      data: {
        status: "completed",
        prTitle: pullRequest.title,
        findingsJson: JSON.stringify(allFindings),
        postedCommentCount: comments.length,
      },
    });

    return {
      reviewRunId: reviewRun.id,
      status: "completed",
      findings: allFindings,
      postedCommentCount: comments.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await db.reviewRun.update({
      where: { id: reviewRun.id },
      data: {
        status: "failed",
        errorMessage,
      },
    });

    return {
      reviewRunId: reviewRun.id,
      status: "failed",
      findings: [],
      postedCommentCount: 0,
      errorMessage,
    };
  }
}

export async function syncInstallationRepositories(installationId: number) {
  const provider = createRepoProvider("github", { installationId });
  const repos = await provider.listRepositories();

  const installation = await db.installation.upsert({
    where: { githubInstallationId: installationId },
    create: {
      githubInstallationId: installationId,
      accountLogin: "unknown",
      accountType: "Organization",
    },
    update: {},
  });

  for (const repo of repos) {
    await db.repository.upsert({
      where: {
        provider_owner_name: {
          provider: "github",
          owner: repo.owner,
          name: repo.name,
        },
      },
      create: {
        provider: "github",
        owner: repo.owner,
        name: repo.name,
        externalId: repo.id,
        installationId: installation.id,
      },
      update: {
        externalId: repo.id,
        installationId: installation.id,
      },
    });
  }

  return repos;
}
