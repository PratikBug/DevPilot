import Link from "next/link";
import { auth, signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewCard } from "@/components/dashboard/review-card";
import { ConnectGitHub } from "@/components/dashboard/connect-github";
import { Bot, Settings } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>Connect your GitHub account to use DevPilot.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/dashboard" });
              }}
            >
              <Button type="submit" className="w-full">
                Sign in with GitHub
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [installations, reviews] = await Promise.all([
    db.installation.findMany({
      include: { repositories: { orderBy: { name: "asc" } } },
      orderBy: { accountLogin: "asc" },
    }),
    db.reviewRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { repository: true },
    }),
  ]);

  const totalRepos = installations.reduce((acc, i) => acc + i.repositories.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <Bot className="h-5 w-5 text-primary" />
            DevPilot Dashboard
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{session.user.name}</span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-1 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <ConnectGitHub installations={installations} />

        <section>
          <h2 className="mb-4 text-lg font-semibold">Connected Repositories ({totalRepos})</h2>
          {totalRepos === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No repositories connected yet. Install the GitHub App to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {installations.flatMap((installation) =>
                installation.repositories.map((repo) => (
                  <Card key={repo.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {repo.owner}/{repo.name}
                      </CardTitle>
                      <CardDescription>{installation.accountLogin}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Open a PR in this repo to trigger an automatic review, or run one manually
                        from the PR detail page.
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Recent Reviews</h2>
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No reviews yet. Open or sync a PR to trigger DevPilot.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
