export type GitHubExplorerConfig = {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  apiBaseUrl?: string;
};

export type GitHubCommitFile = {
  path: string;
  content: string;
};

export type GitHubCommitResult = {
  commitSha: string;
  previousHeadSha: string;
};

export interface GitHubExplorerClient {
  getHeadSha(): Promise<string>;
  readTextFile(path: string, ref: string): Promise<string>;
  commitFiles(input: {
    message: string;
    files: readonly GitHubCommitFile[];
    expectedHeadSha: string;
  }): Promise<GitHubCommitResult>;
}

export class GitHubContentConflictError extends Error {
  readonly name = "GitHubContentConflictError";

  constructor(message: string) {
    super(message);
  }
}

export class GitHubContentConfigurationError extends Error {
  readonly name = "GitHubContentConfigurationError";

  constructor(message: string) {
    super(message);
  }
}

function requireValue(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new GitHubContentConfigurationError(
      `Missing required GitHub Explorer configuration: ${name}`,
    );
  }
  return normalized;
}

export function getGitHubExplorerConfigFromEnv(): GitHubExplorerConfig {
  return {
    owner: requireValue(process.env.GITHUB_CONTENT_OWNER, "GITHUB_CONTENT_OWNER"),
    repo: requireValue(process.env.GITHUB_CONTENT_REPO, "GITHUB_CONTENT_REPO"),
    branch: requireValue(
      process.env.GITHUB_CONTENT_BRANCH || "main",
      "GITHUB_CONTENT_BRANCH",
    ),
    token: requireValue(process.env.GITHUB_CONTENT_TOKEN, "GITHUB_CONTENT_TOKEN"),
    apiBaseUrl: process.env.GITHUB_CONTENT_API_URL?.trim() || "https://api.github.com",
  };
}

type FetchLike = typeof fetch;

type GitReferenceResponse = {
  object?: { sha?: string };
};

type GitCommitResponse = {
  sha?: string;
  tree?: { sha?: string };
};

type GitTreeResponse = {
  sha?: string;
};

export class FetchGitHubExplorerClient implements GitHubExplorerClient {
  private readonly apiBaseUrl: string;

  constructor(
    private readonly config: GitHubExplorerConfig,
    private readonly fetchImpl: FetchLike = fetch,
  ) {
    this.apiBaseUrl = (config.apiBaseUrl || "https://api.github.com").replace(
      /\/$/,
      "",
    );
  }

  async getHeadSha(): Promise<string> {
    const ref = await this.requestJson<GitReferenceResponse>(
      `/repos/${this.repoPath()}/git/ref/heads/${encodeURIComponent(this.config.branch)}`,
    );
    const sha = ref.object?.sha;
    if (!sha) throw new Error("GitHub branch reference did not include a commit SHA");
    return sha;
  }

  async readTextFile(path: string, ref: string): Promise<string> {
    const response = await this.request(
      `/repos/${this.repoPath()}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`,
      {
        headers: {
          Accept: "application/vnd.github.raw+json",
        },
      },
    );
    return response.text();
  }

  async commitFiles(input: {
    message: string;
    files: readonly GitHubCommitFile[];
    expectedHeadSha: string;
  }): Promise<GitHubCommitResult> {
    if (input.files.length === 0) {
      throw new Error("Cannot create an Explorer content commit with no files");
    }

    const currentHeadSha = await this.getHeadSha();
    if (currentHeadSha !== input.expectedHeadSha) {
      throw new GitHubContentConflictError(
        `Explorer content branch moved from ${input.expectedHeadSha} to ${currentHeadSha}; reload and retry`,
      );
    }

    const baseCommit = await this.requestJson<GitCommitResponse>(
      `/repos/${this.repoPath()}/git/commits/${currentHeadSha}`,
    );
    const baseTreeSha = baseCommit.tree?.sha;
    if (!baseTreeSha) {
      throw new Error("GitHub base commit did not include a tree SHA");
    }

    const tree = await this.requestJson<GitTreeResponse>(
      `/repos/${this.repoPath()}/git/trees`,
      {
        method: "POST",
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: input.files.map((file) => ({
            path: file.path,
            mode: "100644",
            type: "blob",
            content: file.content,
          })),
        }),
      },
    );
    if (!tree.sha) throw new Error("GitHub create-tree response had no SHA");

    const commit = await this.requestJson<GitCommitResponse>(
      `/repos/${this.repoPath()}/git/commits`,
      {
        method: "POST",
        body: JSON.stringify({
          message: input.message,
          tree: tree.sha,
          parents: [currentHeadSha],
        }),
      },
    );
    if (!commit.sha) throw new Error("GitHub create-commit response had no SHA");

    try {
      await this.request(
        `/repos/${this.repoPath()}/git/refs/heads/${encodeURIComponent(this.config.branch)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ sha: commit.sha, force: false }),
        },
      );
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 422) {
        throw new GitHubContentConflictError(
          "Explorer content branch changed while the GitHub commit was being published; reload and retry",
        );
      }
      throw error;
    }

    return { commitSha: commit.sha, previousHeadSha: currentHeadSha };
  }

  private repoPath(): string {
    return `${encodeURIComponent(this.config.owner)}/${encodeURIComponent(this.config.repo)}`;
  }

  private async requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.request(path, init);
    return (await response.json()) as T;
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("Accept", headers.get("Accept") || "application/vnd.github+json");
    headers.set("Authorization", `Bearer ${this.config.token}`);
    headers.set("X-GitHub-Api-Version", "2022-11-28");
    headers.set("User-Agent", "darma-explorer-content-admin");
    if (init.body) headers.set("Content-Type", "application/json");

    const response = await this.fetchImpl(`${this.apiBaseUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const raw = await response.text().catch(() => "");
      let detail = raw;
      try {
        const parsed = JSON.parse(raw) as { message?: string };
        detail = parsed.message || raw;
      } catch {
        // Keep the raw, already non-secret response body.
      }
      throw new GitHubApiError(
        response.status,
        `GitHub Explorer request failed (${response.status} ${response.statusText}): ${detail || "no response body"}`,
      );
    }

    return response;
  }
}

class GitHubApiError extends Error {
  readonly name = "GitHubApiError";

  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function encodePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
