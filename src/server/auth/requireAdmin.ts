import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Provider-agnostic admin guard.
 * Replace cookie checks with your real auth/session validation.
 */
export async function requireAdmin() {
  const cookieStore = await cookies();

  const session = cookieStore.get("session")?.value;
  const role = cookieStore.get("role")?.value;

  // ✅ Replace this logic with your real session lookup:
  // e.g. verify JWT, load user from DB, etc.
  const isAdmin = Boolean(session) && role === "admin";

  if (!isAdmin) {
    redirect("/login");
  }
}
