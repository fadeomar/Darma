import { NextRequest, NextResponse } from "next/server";
import { checkWebsiteFavicons } from "./checkWebsite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url") ?? "";
  if (!url.trim()) return jsonError("Missing url query parameter.");
  const result = await checkWebsiteFavicons(url);
  return NextResponse.json(result, { status: result.issues.some((issue) => issue.level === "error") ? 422 : 200 });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const url = typeof body === "object" && body !== null && "url" in body ? String((body as { url?: unknown }).url ?? "") : "";
  if (!url.trim()) return jsonError("Missing url in request body.");
  const result = await checkWebsiteFavicons(url);
  return NextResponse.json(result, { status: result.issues.some((issue) => issue.level === "error") ? 422 : 200 });
}
