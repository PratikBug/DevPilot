"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, RefreshCw } from "lucide-react";

interface Installation {
  id: string;
  githubInstallationId: number;
  accountLogin: string;
  accountType: string;
  repositories: { id: string; owner: string; name: string }[];
}

interface ConnectGitHubProps {
  installations: Installation[];
}

export function ConnectGitHub({ installations }: ConnectGitHubProps) {
  const [syncing, setSyncing] = useState<number | null>(null);
  const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "devpilot";

  async function syncRepos(installationId: number) {
    setSyncing(installationId);
    try {
      await fetch("/api/installations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installationId }),
      });
      window.location.reload();
    } finally {
      setSyncing(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Connection
        </CardTitle>
        <CardDescription>
          Install the DevPilot GitHub App to connect repositories and enable automatic PR reviews.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button asChild>
          <a
            href={`https://github.com/apps/${appSlug}/installations/new`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Connect GitHub App
          </a>
        </Button>

        {installations.length > 0 && (
          <div className="space-y-2">
            {installations.map((inst) => (
              <div
                key={inst.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <span className="font-medium">{inst.accountLogin}</span>
                  <span className="ml-2 text-muted-foreground">
                    ({inst.accountType}) · {inst.repositories.length} repos
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={syncing === inst.githubInstallationId}
                  onClick={() => syncRepos(inst.githubInstallationId)}
                >
                  <RefreshCw
                    className={`mr-1 h-3 w-3 ${syncing === inst.githubInstallationId ? "animate-spin" : ""}`}
                  />
                  Sync
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
