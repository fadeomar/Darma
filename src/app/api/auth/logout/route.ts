import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { clearAuthCookie } from "@/lib/auth/session";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE } from "@/lib/auth/constants";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  if (token) {
    try {
      const parsed = await verifyAuthToken(token);
      await prisma.session.deleteMany({
        where: { id: parsed.sid, userId: parsed.uid },
      });
    } catch {
      // ignore
    }
  }

  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}
