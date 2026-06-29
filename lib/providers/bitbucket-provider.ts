import type { RepoProvider } from "./repo-provider";
import { NotImplementedError } from "./repo-provider";

export class BitbucketProvider implements RepoProvider {
  readonly provider = "bitbucket" as const;

  listRepositories(): Promise<never> {
    throw new NotImplementedError("Bitbucket", "listRepositories");
  }

  getPullRequest(): Promise<never> {
    throw new NotImplementedError("Bitbucket", "getPullRequest");
  }

  getDiff(): Promise<never> {
    throw new NotImplementedError("Bitbucket", "getDiff");
  }

  createReviewComments(): Promise<never> {
    throw new NotImplementedError("Bitbucket", "createReviewComments");
  }
}
