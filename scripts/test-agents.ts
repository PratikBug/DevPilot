import type { UnifiedDiffHunk } from "@/lib/providers/repo-provider";
import {
  mergeFindings,
  runCodeReviewAgent,
  runFrontendDebuggingAgent,
} from "@/lib/agents/frontend-debugging";
import { generateReviewComments } from "@/lib/agents/comment-generator";

export const sampleDiff: UnifiedDiffHunk[] = [
  {
    filePath: "components/Payment.tsx",
    patch: `@@ -10,7 +10,7 @@ export function Payment() {
   const [user, setUser] = useState(null);
 
-  useEffect(() => {}, []);
+  useEffect(() => {
+    fetchUser().then(setUser);
+  }, []);`,
  },
];

async function main() {
  console.log("Running DevPilot agent pipeline against sample diff...\n");

  const debugging = await runFrontendDebuggingAgent(sampleDiff);
  console.log("Frontend Debugging findings:", debugging.findings.length);

  const review = await runCodeReviewAgent(sampleDiff, debugging);
  console.log("Code Review findings:", review.findings.length);

  const merged = mergeFindings(debugging, review);
  const comments = generateReviewComments(merged, sampleDiff);

  console.log("\nMerged findings:");
  for (const f of merged) {
    console.log(`  [${f.severity}] ${f.filePath}:${f.line} — ${f.title}`);
  }

  console.log(`\nGenerated ${comments.length} review comment(s).`);
}

main().catch(console.error);
