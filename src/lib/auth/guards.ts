import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSessionFromRequestOrNull,
  getServerAdminSessionOrNull,
} from "./session";

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
