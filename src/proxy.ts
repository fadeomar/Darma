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

  // Handle static routes: /search, /element
  if (pathname === "/search" || pathname === "/element") {
    return NextResponse.redirect(new URL(`/${search}`, request.url));
  }

  // Handle dynamic route: /search/[slug] -> "/?q=slug"
  if (pathname.startsWith("/search/") && pathname !== "/search") {
    const slug = pathname.split("/")[2];
    const searchParams = new URLSearchParams(search);

    if (slug) {
      searchParams.set("q", slug);
    }

    const target = `/?${searchParams.toString()}`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  // ============================================================
  // ✅ 2) ADMIN PROTECTION (/admin/** and /api/admin/**)
  // ============================================================

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

    // must be admin role
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
    // ✅ Admin protection
    "/admin/:path*",
    "/api/admin/:path*",

    // ✅ Your redirects
    "/search",
    "/element",
    "/search/:slug+",
  ],
};
