import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth/session";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  if (token) {
    try {
      const parsed = await verifyAuthToken(token);
      await prisma.session.deleteMany({
        where: { id: parsed.sid, userId: parsed.uid },
      });
    } catch {
      // ignore invalid/stale tokens on logout
    }
  }

  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}
