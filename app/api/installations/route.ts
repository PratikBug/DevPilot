import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncInstallationRepositories } from "@/lib/review/run-review";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { installationId } = await request.json();

  if (!installationId) {
    return NextResponse.json({ error: "installationId is required" }, { status: 400 });
  }

  const repos = await syncInstallationRepositories(Number(installationId));
  return NextResponse.json({ synced: repos.length, repos });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const installations = await db.installation.findMany({
    include: {
      repositories: {
        orderBy: { name: "asc" },
      },
    },
    orderBy: { accountLogin: "asc" },
  });

  return NextResponse.json(installations);
}
