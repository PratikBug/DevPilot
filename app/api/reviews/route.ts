import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runReview } from "@/lib/review/run-review";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { owner, repo, prNumber, installationId, postComments = true } = body;

  if (!owner || !repo || !prNumber || !installationId) {
    return NextResponse.json(
      { error: "owner, repo, prNumber, and installationId are required" },
      { status: 400 }
    );
  }

  const result = await runReview({
    provider: "github",
    installationId: Number(installationId),
    owner,
    repo,
    prNumber: Number(prNumber),
    triggeredBy: "manual",
    postComments,
  });

  return NextResponse.json(result, {
    status: result.status === "completed" ? 200 : 500,
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviews = await db.reviewRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      repository: true,
    },
  });

  return NextResponse.json(reviews);
}
