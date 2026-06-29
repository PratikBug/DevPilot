import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ReviewRunWithRepo {
  id: string;
  prNumber: number;
  prTitle: string | null;
  status: string;
  postedCommentCount: number;
  triggeredBy: string;
  createdAt: Date;
  repository: {
    owner: string;
    name: string;
  };
}

interface ReviewCardProps {
  review: ReviewRunWithRepo;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const statusVariant =
    review.status === "completed"
      ? "default"
      : review.status === "failed"
        ? "destructive"
        : "secondary";

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <Link
            href={`/dashboard/repos/${review.repository.owner}/${review.repository.name}/prs/${review.prNumber}`}
            className="font-medium hover:underline"
          >
            {review.repository.owner}/{review.repository.name} #{review.prNumber}
          </Link>
          {review.prTitle && (
            <p className="text-sm text-muted-foreground">{review.prTitle}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {review.postedCommentCount} comments · {review.triggeredBy} ·{" "}
            {new Date(review.createdAt).toLocaleString()}
          </p>
        </div>
        <Badge variant={statusVariant}>{review.status}</Badge>
      </CardContent>
    </Card>
  );
}
