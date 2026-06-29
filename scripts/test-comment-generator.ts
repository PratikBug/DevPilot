import assert from "node:assert/strict";
import { generateReviewComments, buildReviewSummary } from "../lib/agents/comment-generator";
import type { AgentFinding } from "../lib/agents/frontend-debugging";
import type { UnifiedDiffHunk } from "../lib/providers/repo-provider";

const sampleDiff: UnifiedDiffHunk[] = [
  {
    filePath: "components/Payment.tsx",
    patch: `@@ -10,7 +10,9 @@ export function Payment() {
   const [user, setUser] = useState(null);
 
-  useEffect(() => {}, []);
+  useEffect(() => {
+    fetchUser().then(setUser);
+  }, []);`,
  },
];

const sampleFindings: AgentFinding[] = [
  {
    filePath: "components/Payment.tsx",
    line: 13,
    title: "Missing dependency",
    description: "useEffect is missing `user` in its dependency array.",
    suggestion: "Add `user` to the dependency array or add cleanup.",
    severity: "warning",
    category: "hooks",
  },
];

const comments = generateReviewComments(sampleFindings, sampleDiff);
assert.equal(comments.length, 1);
assert.equal(comments[0].filePath, "components/Payment.tsx");
assert.equal(comments[0].severity, "warning");
assert.match(comments[0].body, /Missing dependency/);

const summary = buildReviewSummary(comments);
assert.match(summary, /DevPilot AI Review/);

console.log("✓ Comment generator unit tests passed");
