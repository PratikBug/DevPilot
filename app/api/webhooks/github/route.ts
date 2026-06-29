import { NextRequest, NextResponse } from "next/server";
import { verifyGithubWebhookSignature } from "@/lib/providers/github-provider";
import { runReview, syncInstallationRepositories } from "@/lib/review/run-review";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyGithubWebhookSignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  const body = JSON.parse(payload) as Record<string, unknown>;

  if (event === "installation") {
    const action = body.action as string;
    const installation = body.installation as { id: number; account?: { login: string; type: string } };

    if (action === "created" || action === "added") {
      await db.installation.upsert({
        where: { githubInstallationId: installation.id },
        create: {
          githubInstallationId: installation.id,
          accountLogin: installation.account?.login ?? "unknown",
          accountType: installation.account?.type ?? "Organization",
        },
        update: {
          accountLogin: installation.account?.login ?? "unknown",
          accountType: installation.account?.type ?? "Organization",
        },
      });

      await syncInstallationRepositories(installation.id);
    }

    return NextResponse.json({ ok: true });
  }

  if (event === "pull_request") {
    const action = body.action as string;
    const pr = body.pull_request as {
      number: number;
      title: string;
    };
    const repo = body.repository as {
      owner: { login: string };
      name: string;
    };
    const installation = body.installation as { id: number } | undefined;

    if (!["opened", "synchronize", "reopened"].includes(action)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (!installation?.id) {
      return NextResponse.json({ error: "Missing installation ID" }, { status: 400 });
    }

    // Run review asynchronously — return 202 immediately for Vercel timeout safety
    runReview({
      provider: "github",
      installationId: installation.id,
      owner: repo.owner.login,
      repo: repo.name,
      prNumber: pr.number,
      triggeredBy: "webhook",
    }).catch(console.error);

    return NextResponse.json({ ok: true, queued: true, pr: pr.number }, { status: 202 });
  }

  return NextResponse.json({ ok: true, ignored: true });
}
