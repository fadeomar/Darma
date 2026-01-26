import { cookies } from "next/headers";

export async function assertAdminApi() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const role = cookieStore.get("role")?.value;

  const isAdmin = Boolean(session) && role === "admin";

  if (!isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
