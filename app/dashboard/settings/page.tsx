import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectGitHub } from "@/components/dashboard/connect-github";
import { Bot, ArrowLeft } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please sign in to access settings.</p>
      </div>
    );
  }

  const installations = await db.installation.findMany({
    include: { repositories: true },
    orderBy: { accountLogin: "asc" },
  });

  const appSlug = process.env.GITHUB_APP_SLUG ?? "devpilot";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2 font-semibold">
            <Bot className="h-5 w-5 text-primary" />
            Settings
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <ConnectGitHub installations={installations} />

        <Card>
          <CardHeader>
            <CardTitle>GitHub App</CardTitle>
            <CardDescription>
              Install the DevPilot GitHub App on your organization or account to enable PR reviews.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild>
              <a
                href={`https://github.com/apps/${appSlug}/installations/new`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Install / Configure GitHub App
              </a>
            </Button>
            <p className="text-sm text-muted-foreground">
              Webhook URL:{" "}
              <code className="rounded bg-muted px-1">
                {process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/webhooks/github
              </code>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installations</CardTitle>
          </CardHeader>
          <CardContent>
            {installations.length === 0 ? (
              <p className="text-muted-foreground">No installations found yet.</p>
            ) : (
              <ul className="space-y-2">
                {installations.map((inst) => (
                  <li key={inst.id} className="flex justify-between text-sm">
                    <span>
                      {inst.accountLogin} ({inst.accountType})
                    </span>
                    <span className="text-muted-foreground">
                      {inst.repositories.length} repos · ID {inst.githubInstallationId}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
            <CardDescription>
              DevPilot uses OpenAI via the Vercel AI SDK. Set OPENAI_API_KEY in your environment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Model: <code className="rounded bg-muted px-1">gpt-4o-mini</code>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              API key configured: {process.env.OPENAI_API_KEY ? "Yes ✓" : "No — set OPENAI_API_KEY"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phase 2 — Bitbucket</CardTitle>
            <CardDescription>Bitbucket OAuth and PR integration coming soon.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    </div>
  );
}
