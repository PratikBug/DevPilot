import { generateObject } from "ai";
import { z } from "zod";
import { getAiModel } from "@/lib/ai/client";
import type { UnifiedDiffHunk } from "@/lib/providers/repo-provider";

const findingSchema = z.object({
  filePath: z.string(),
  line: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  suggestion: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  category: z.enum([
    "hooks",
    "accessibility",
    "performance",
    "state",
    "security",
    "testing",
    "other",
  ]),
});

export const findingsSchema = z.object({
  findings: z.array(findingSchema),
});

export type AgentFinding = z.infer<typeof findingSchema>;
export type AgentFindings = z.infer<typeof findingsSchema>;

const FRONTEND_EXTENSIONS = [".tsx", ".jsx", ".ts", ".css"];

function filterFrontendDiffs(diffs: UnifiedDiffHunk[]): UnifiedDiffHunk[] {
  return diffs.filter((d) =>
    FRONTEND_EXTENSIONS.some((ext) => d.filePath.endsWith(ext))
  );
}

export async function runFrontendDebuggingAgent(
  diffs: UnifiedDiffHunk[]
): Promise<AgentFindings> {
  const frontendDiffs = filterFrontendDiffs(diffs);

  if (frontendDiffs.length === 0) {
    return { findings: [] };
  }

  const diffText = frontendDiffs
    .map((d) => `--- ${d.filePath}\n${d.patch}`)
    .join("\n\n");

  const { object } = await generateObject({
    model: getAiModel(),
    schema: findingsSchema,
    prompt: `You are a senior React/Next.js frontend debugging expert.
Analyze the following PR diff hunks and identify frontend bugs and issues.

Focus on:
- Missing useEffect dependencies (e.g. useEffect(() => {}, []) when deps are needed)
- Stale closures and incorrect hook usage
- Accessibility (keyboard navigation, ARIA, focus management)
- State management bugs
- Performance issues (unnecessary re-renders, missing memoization)

Only report issues visible in the changed lines. Include accurate line numbers from the diff context.
Return an empty findings array if no issues are found.

DIFF:
${diffText}`,
  });

  return object;
}

export async function runCodeReviewAgent(
  diffs: UnifiedDiffHunk[],
  debuggingFindings: AgentFindings
): Promise<AgentFindings> {
  const diffText = diffs.map((d) => `--- ${d.filePath}\n${d.patch}`).join("\n\n");

  const { object } = await generateObject({
    model: getAiModel(),
    schema: findingsSchema,
    prompt: `You are a senior code reviewer. Review this PR diff and the frontend debugging findings.
Add general review findings (security, error handling, test coverage).
Deduplicate overlapping issues with the debugging findings — do not repeat the same issue.

Frontend debugging findings already found:
${JSON.stringify(debuggingFindings.findings, null, 2)}

Return a merged, deduplicated list of NEW findings only (not duplicates of debugging findings).
If no additional issues, return empty findings array.

DIFF:
${diffText}`,
  });

  return object;
}

export function mergeFindings(
  debugging: AgentFindings,
  review: AgentFindings
): AgentFinding[] {
  const seen = new Set<string>();
  const merged: AgentFinding[] = [];

  for (const finding of [...debugging.findings, ...review.findings]) {
    const key = `${finding.filePath}:${finding.line}:${finding.title}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(finding);
    }
  }

  return merged;
}
