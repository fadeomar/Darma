// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth/constants";
import { verifyAuthToken } from "@/lib/auth/jwt";

function redirectToLogin(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname + search);

  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Legacy alias: /element was folded into the home page.
  // /search is a real page now (src/app/search) and must never be redirected.
  if (pathname === "/element") {
    return NextResponse.redirect(new URL(`/${search}`, request.url));
  }

  // Legacy dynamic route: /search/[slug] -> "/search?q=slug"
  if (pathname.startsWith("/search/") && pathname !== "/search") {
    const slug = pathname.split("/")[2];
    const searchParams = new URLSearchParams(search);

    if (slug) {
      searchParams.set("q", slug);
    }

    const target = `/search?${searchParams.toString()}`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return redirectToLogin(request);
  }

  try {
    const parsed = await verifyAuthToken(token);

    if (parsed.role !== "admin") {
      if (isAdminApi) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return redirectToLogin(request);
    }
  } catch {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return redirectToLogin(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/element",
    "/search/:slug+",
  ],
};
