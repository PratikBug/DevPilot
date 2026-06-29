import Link from "next/link";
import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, GitPullRequest, Shield, Zap } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Bot className="h-6 w-6 text-primary" />
            DevPilot
          </div>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/dashboard" });
                }}
              >
                <Button type="submit">Sign in with GitHub</Button>
              </form>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            AI Frontend Debugging + PR Review Agent
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            DevPilot reviews pull requests across GitHub and Bitbucket, finds frontend bugs,
            explains root cause, suggests fixes, and comments directly on your PRs.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            {session?.user ? (
              <Button size="lg" asChild>
                <Link href="/dashboard">Open Dashboard</Link>
              </Button>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/dashboard" });
                }}
              >
                <Button size="lg" type="submit">
                  Get Started — Sign in with GitHub
                </Button>
              </form>
            )}
          </div>
        </section>

        <section className="mt-20 grid gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <GitPullRequest className="h-8 w-8 text-primary" />
              <CardTitle className="mt-2">Unified PR Review</CardTitle>
              <CardDescription>
                One RepoProvider abstraction for GitHub, Bitbucket, and GitLab. Agents don&apos;t
                care where code came from.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary" />
              <CardTitle className="mt-2">Frontend Debugging</CardTitle>
              <CardDescription>
                Detects missing useEffect deps, accessibility issues, stale closures, and
                performance problems in React/Next.js code.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary" />
              <CardTitle className="mt-2">Auto PR Comments</CardTitle>
              <CardDescription>
                Posts inline review comments with severity, issue description, and actionable
                suggestions on every PR.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle>Architecture</CardTitle>
              <CardDescription>
                Dashboard → Repo Connector → Unified PR Format → AI Agents → Comment Generator →
                Post Review
              </CardDescription>
            </CardHeader>
            <CardContent className="font-mono text-sm text-muted-foreground">
              Frontend Dashboard → GitHub/Bitbucket API → RepoProvider → Frontend Debugging Agent
              → Code Review Agent → Comment Generator → Post Review
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
