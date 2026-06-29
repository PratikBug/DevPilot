import { Badge } from "@/components/ui/badge";
import type { AgentFinding } from "@/lib/agents/frontend-debugging";

interface FindingsListProps {
  findings: AgentFinding[];
}

export function FindingsList({ findings }: FindingsListProps) {
  if (findings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No issues found. DevPilot did not detect any frontend or code review problems.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {findings.map((finding, i) => (
        <li key={i} className="rounded-md border p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{finding.title}</p>
              <p className="text-xs text-muted-foreground">
                {finding.filePath}:{finding.line} · {finding.category}
              </p>
            </div>
            <Badge
              variant={
                finding.severity === "critical"
                  ? "critical"
                  : finding.severity === "warning"
                    ? "warning"
                    : "secondary"
              }
            >
              {finding.severity}
            </Badge>
          </div>
          <p className="mt-2 text-sm">{finding.description}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            <strong>Suggestion:</strong> {finding.suggestion}
          </p>
        </li>
      ))}
    </ul>
  );
}
