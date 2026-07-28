import { describe, expect, it, vi } from "vitest";

import {
  FetchGitHubExplorerClient,
  GitHubContentConflictError,
} from "./githubExplorer.client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("FetchGitHubExplorerClient", () => {
  it("creates one tree and commit, then fast-forwards the branch", async () => {
    const responses = [
      jsonResponse({ object: { sha: "head" } }),
      jsonResponse({ tree: { sha: "base-tree" } }),
      jsonResponse({ sha: "new-tree" }, 201),
      jsonResponse({ sha: "new-commit" }, 201),
      jsonResponse({ object: { sha: "new-commit" } }),
    ];
    const fetchMock = vi.fn<typeof fetch>(async () => responses.shift()!);
    const client = new FetchGitHubExplorerClient(
      {
        owner: "fadeomar",
        repo: "Darma",
        branch: "main",
        token: "test-token",
      },
      fetchMock as typeof fetch,
    );

    const result = await client.commitFiles({
      message: "content(explorer): update one",
      expectedHeadSha: "head",
      files: [
        { path: "content/explorer/items/one.json", content: "{}\n" },
        { path: "content/explorer/manifest.json", content: "{}\n" },
      ],
    });

    expect(result).toEqual({ previousHeadSha: "head", commitSha: "new-commit" });
    expect(fetchMock).toHaveBeenCalledTimes(5);
    const treeCall = fetchMock.mock.calls[2];
    const treeBody = JSON.parse(String((treeCall[1] as RequestInit).body));
    expect(treeBody.base_tree).toBe("base-tree");
    expect(treeBody.tree).toHaveLength(2);
    const refBody = JSON.parse(String((fetchMock.mock.calls[4][1] as RequestInit).body));
    expect(refBody).toEqual({ sha: "new-commit", force: false });
  });
  it("rejects a write when the branch head moved", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({ object: { sha: "new-head" } }),
    );
    const client = new FetchGitHubExplorerClient(
      {
        owner: "fadeomar",
        repo: "Darma",
        branch: "main",
        token: "test-token",
      },
      fetchMock as typeof fetch,
    );

    await expect(
      client.commitFiles({
        message: "content(explorer): update one",
        expectedHeadSha: "old-head",
        files: [{ path: "content/explorer/items/one.json", content: "{}\n" }],
      }),
    ).rejects.toBeInstanceOf(GitHubContentConflictError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
