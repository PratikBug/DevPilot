import type { AgentFinding } from "@/lib/agents/frontend-debugging";
import type { ReviewComment, UnifiedDiffHunk } from "@/lib/providers/repo-provider";

const MAX_COMMENTS = 20;

const SEVERITY_EMOJI: Record<string, string> = {
  info: "ℹ️",
  warning: "⚠️",
  critical: "🚨",
};

function parseDiffLineNumbers(patch: string): number[] {
  const lines: number[] = [];
  let currentLine = 0;

  for (const line of patch.split("\n")) {
    if (line.startsWith("@@")) {
      const match = line.match(/\+(\d+)/);
      if (match) currentLine = parseInt(match[1], 10);
      continue;
    }
    if (line.startsWith("+") && !line.startsWith("+++")) {
      lines.push(currentLine);
      currentLine += 1;
    } else if (!line.startsWith("-")) {
      currentLine += 1;
    }
  }

  return lines;
}

function resolveLineInPatch(patch: string, requestedLine: number): number | null {
  const validLines = parseDiffLineNumbers(patch);
  if (validLines.includes(requestedLine)) return requestedLine;
  if (validLines.length === 0) return null;
  return validLines.reduce((closest, line) =>
    Math.abs(line - requestedLine) < Math.abs(closest - requestedLine) ? line : closest
  );
}

export function generateReviewComments(
  findings: AgentFinding[],
  diffs: UnifiedDiffHunk[]
): ReviewComment[] {
  const diffMap = new Map(diffs.map((d) => [d.filePath, d.patch]));
  const comments: ReviewComment[] = [];

  const sorted = [...findings].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  for (const finding of sorted) {
    if (comments.length >= MAX_COMMENTS) break;

    const patch = diffMap.get(finding.filePath);
    if (!patch) continue;

    const line = resolveLineInPatch(patch, finding.line);
    if (!line) continue;

    const emoji = SEVERITY_EMOJI[finding.severity] ?? "ℹ️";
    const body = `${emoji} **${finding.title}**

**Issue:**
${finding.description}

**Suggestion:**
${finding.suggestion}

*Category: ${finding.category} | Severity: ${finding.severity}*`;

    comments.push({
      filePath: finding.filePath,
      line,
      body,
      severity: finding.severity,
    });
  }

  return comments;
}

export function buildReviewSummary(comments: ReviewComment[]): string {
  const critical = comments.filter((c) => c.severity === "critical").length;
  const warning = comments.filter((c) => c.severity === "warning").length;
  const info = comments.filter((c) => c.severity === "info").length;

  return `## DevPilot AI Review

Found **${comments.length}** issue(s): ${critical} critical, ${warning} warning, ${info} info.

Review powered by DevPilot — AI Frontend Debugging + PR Review Agent.`;
}
