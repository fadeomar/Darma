// middleware.ts
import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const { pathname, search } = new URL(request.url);

  // Handle static routes: /search, /element
  if (pathname === "/search" || pathname === "/element") {
    return NextResponse.redirect(new URL(`/${search}`, request.url));
  }

  // Handle dynamic route: /search/[slug]
  if (pathname.startsWith("/search/") && pathname !== "/search") {
    const slug = pathname.split("/")[2];
    const searchParams = new URLSearchParams(search);
    if (slug) {
      searchParams.set("q", slug);
    }
    return NextResponse.redirect(
      new URL(`/?${searchParams.toString()}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/search", "/element", "/search/:slug+"], // Use :slug+ for non-empty slugs
};
