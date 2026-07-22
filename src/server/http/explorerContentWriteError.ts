import { NextResponse } from "next/server";

import { ElementNotFoundError } from "@/features/elements/application/elementWriteService";
import {
  GitHubContentConfigurationError,
  GitHubContentConflictError,
} from "@/features/elements/infra/github/githubExplorer.client";

export function explorerContentWriteErrorResponse(
  error: unknown,
): NextResponse | null {
  if (error instanceof ElementNotFoundError) {
    return NextResponse.json({ error: "Element not found" }, { status: 404 });
  }
  if (error instanceof GitHubContentConflictError) {
    return NextResponse.json(
      { error: "Explorer content changed concurrently. Reload and retry." },
      { status: 409 },
    );
  }
  if (error instanceof GitHubContentConfigurationError) {
    return NextResponse.json(
      { error: "Explorer GitHub content source is not configured." },
      { status: 500 },
    );
  }

  const candidate = error as { code?: unknown; message?: unknown } | null;
  if (
    candidate?.code === "P2002" ||
    (typeof candidate?.message === "string" &&
      candidate.message.includes("slug already exists"))
  ) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  return null;
}
