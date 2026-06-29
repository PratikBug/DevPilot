"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";

interface ReviewTriggerProps {
  owner: string;
  repo: string;
  prNumber: number;
  installationId: number;
}

export function ReviewTrigger({ owner, repo, prNumber, installationId }: ReviewTriggerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; postedCommentCount?: number; errorMessage?: string } | null>(null);

  async function runReview() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, prNumber, installationId }),
      });
      const data = await res.json();
      setResult(data);
      if (data.status === "completed") {
        window.location.reload();
      }
    } catch (err) {
      setResult({ status: "failed", errorMessage: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={runReview} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running review...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Run DevPilot Review
          </>
        )}
      </Button>
      {result && result.status === "failed" && (
        <p className="text-sm text-destructive">{result.errorMessage ?? "Review failed"}</p>
      )}
    </div>
  );
}
