/**
 * Phase 3 — Jira integration stub.
 * Creates Jira tickets from critical PR review findings.
 */

export interface JiraIssueInput {
  projectKey: string;
  summary: string;
  description: string;
  assigneeAccountId?: string;
  labels?: string[];
}

export interface JiraIssueResult {
  key: string;
  url: string;
}

export async function createJiraIssue(_input: JiraIssueInput): Promise<JiraIssueResult> {
  throw new Error(
    "Jira integration is not implemented yet (Phase 3). Set ATLASSIAN_API_TOKEN and ATLASSIAN_SITE_URL."
  );
}

export function formatJiraComment(issueKey: string, summary: string): string {
  return `JIRA: ${issueKey} — ${summary}`;
}
