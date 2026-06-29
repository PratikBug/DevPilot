import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FindingsList } from "@/components/dashboard/findings-list";
import { ReviewTrigger } from "@/components/dashboard/review-trigger";
import { ArrowLeft } from "lucide-react";
import type { AgentFinding } from "@/lib/agents/frontend-debugging";

interface PageProps {
  params: Promise<{ owner: string; repo: string; number: string }>;
}

export default async function PRDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) notFound();

  const { owner, repo, number: numberStr } = await params;
  const prNumber = parseInt(numberStr, 10);

  const repository = await db.repository.findUnique({
    where: {
      provider_owner_name: {
        provider: "github",
        owner,
        name: repo,
      },
    },
    include: {
      installation: true,
      reviewRuns: {
        where: { prNumber },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!repository) notFound();

  const latestReview = repository.reviewRuns[0];
  const findings: AgentFinding[] = latestReview?.findingsJson
    ? JSON.parse(latestReview.findingsJson)
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">
              {owner}/{repo} #{prNumber}
            </h1>
            {latestReview?.prTitle && (
              <p className="text-sm text-muted-foreground">{latestReview.prTitle}</p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Run DevPilot Review</CardTitle>
            <CardDescription>
              Manually trigger an AI review on this pull request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {repository.installation ? (
              <ReviewTrigger
                owner={owner}
                repo={repo}
                prNumber={prNumber}
                installationId={repository.installation.githubInstallationId}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No GitHub App installation linked to this repository.
              </p>
            )}
          </CardContent>
        </Card>

        {latestReview && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Latest Review</CardTitle>
                <Badge
                  variant={
                    latestReview.status === "completed"
                      ? "default"
                      : latestReview.status === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {latestReview.status}
                </Badge>
              </div>
              <CardDescription>
                {latestReview.postedCommentCount} comment(s) posted · triggered by{" "}
                {latestReview.triggeredBy} ·{" "}
                {new Date(latestReview.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {latestReview.errorMessage && (
                <p className="mb-4 text-sm text-destructive">{latestReview.errorMessage}</p>
              )}
              <FindingsList findings={findings} />
            </CardContent>
          </Card>
        )}

        {repository.reviewRuns.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Review History</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {repository.reviewRuns.map((run) => (
                  <li key={run.id} className="flex justify-between">
                    <span>{new Date(run.createdAt).toLocaleString()}</span>
                    <span className="text-muted-foreground">
                      {run.status} · {run.postedCommentCount} comments
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
