import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSessionFromRequestOrNull,
  getServerAdminSessionOrNull,
} from "./session";

/**
 * Canonical admin auth guards.
 *
 * IMPORTANT: This module (`@/lib/auth/guards`) is the ONLY supported source of
 * admin authorization. Both guards verify a signed JWT cookie AND re-check the
 * DB-backed session + `user.role === "admin"`.
 *
 * Do NOT reintroduce cookie-only / role-string guards (e.g. a `src/server/auth`
 * stub). Those were removed because they trusted an unsigned `role` cookie and
 * could be trivially spoofed. All admin pages and API routes must import from
 * here.
 *
 * - `requireAdmin()`     -> server components / layouts (redirects to /login)
 * - `assertAdminApi(req)`-> route handlers (returns 401 NextResponse if not admin)
 */
export async function requireAdmin() {
  const auth = await getServerAdminSessionOrNull();
  if (!auth) {
    // server component: throw redirect
    const { redirect } = await import("next/navigation");
    redirect("/login?next=/admin");
  }
  return auth?.user;
}

export async function assertAdminApi(req: NextRequest) {
  const auth = await getAdminSessionFromRequestOrNull(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return auth.user;
}
