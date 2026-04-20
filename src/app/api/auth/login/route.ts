import { NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";
import { createDbSession, setAuthCookie } from "@/lib/auth/session";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing email or password" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await argon2.verify(user.password, password).catch(() => false);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = await createDbSession(user.id);
  await setAuthCookie(session.id, user.id, user.role);

  return NextResponse.json({ ok: true });
}
