import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { AUTH_COOKIE, SESSION_DAYS } from "./constants";
import { signAuthToken, verifyAuthToken } from "./jwt";

const prisma = new PrismaClient();

export function sessionExpiryDate(days = SESSION_DAYS) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true as const,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function createDbSession(userId: number) {
  return prisma.session.create({
    data: {
      userId,
      expiresAt: sessionExpiryDate(),
    },
  });
}

export async function deleteDbSession(sessionId: string) {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}

export async function setAuthCookie(
  sessionId: string,
  userId: number,
  role: string,
) {
  const expiresInSeconds = SESSION_DAYS * 24 * 60 * 60;
  const token = await signAuthToken(
    { sid: sessionId, uid: userId, role },
    expiresInSeconds,
  );

  (await cookies()).set(AUTH_COOKIE, token, {
    ...cookieOptions(),
    expires: sessionExpiryDate(),
  });
}

export async function clearAuthCookie() {
  (await cookies()).set(AUTH_COOKIE, "", {
    ...cookieOptions(),
    expires: new Date(0),
  });
}

/**
 * Server-side: verify JWT then verify session exists in DB and not expired.
 * Use this in layouts and API routes (NOT middleware).
 */
export async function getServerAdminSessionOrNull() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;

  let parsed;
  try {
    parsed = await verifyAuthToken(token);
  } catch {
    return null;
  }

  if (parsed.role !== "admin") return null;

  const session = await prisma.session.findFirst({
    where: {
      id: parsed.sid,
      userId: parsed.uid,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!session) return null;
  if (session.user.role !== "admin") return null;

  return { session, user: session.user };
}

/**
 * API helper: read cookie from request (for route handlers that receive NextRequest).
 * Still verifies DB session.
 */
export async function getAdminSessionFromRequestOrNull(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  let parsed;
  try {
    parsed = await verifyAuthToken(token);
  } catch {
    return null;
  }

  if (parsed.role !== "admin") return null;

  const session = await prisma.session.findFirst({
    where: {
      id: parsed.sid,
      userId: parsed.uid,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!session) return null;
  if (session.user.role !== "admin") return null;

  return { session, user: session.user };
}
