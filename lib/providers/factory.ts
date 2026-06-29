import type { ProviderType, RepoProvider } from "./repo-provider";
import { BitbucketProvider } from "./bitbucket-provider";
import { GithubProvider } from "./github-provider";

export function createRepoProvider(
  provider: ProviderType,
  options?: { installationId?: number }
): RepoProvider {
  switch (provider) {
    case "github":
      return new GithubProvider(options?.installationId);
    case "bitbucket":
      return new BitbucketProvider();
    case "gitlab":
      throw new Error("GitLab provider is not implemented yet.");
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export * from "./repo-provider";
export { GithubProvider } from "./github-provider";
export { BitbucketProvider } from "./bitbucket-provider";
