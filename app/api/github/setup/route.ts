import { NextRequest, NextResponse } from "next/server";
import { syncInstallationRepositories } from "@/lib/review/run-review";

/**
 * GitHub App "Setup URL" callback.
 * Configure in GitHub App settings: https://your-domain.com/api/github/setup
 */
export async function GET(request: NextRequest) {
  const installationId = request.nextUrl.searchParams.get("installation_id");

  if (!installationId) {
    return NextResponse.redirect(new URL("/dashboard/settings", request.url));
  }

  const id = Number(installationId);

  try {
    await syncInstallationRepositories(id);
  } catch (error) {
    console.error("Failed to sync installation:", error);
  }

  return NextResponse.redirect(
    new URL(`/dashboard/settings?installed=${id}`, request.url)
  );
}
