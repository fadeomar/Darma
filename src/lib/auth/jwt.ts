import { SignJWT, jwtVerify } from "jose";

const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(s);
};

export type AuthTokenPayload = {
  sid: string; // session id
  uid: number; // user id
  role: string;
};

export async function signAuthToken(
  payload: AuthTokenPayload,
  expiresInSeconds: number,
) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(secret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  // minimal runtime checks
  const sid = payload.sid;
  const uid = payload.uid;
  const role = payload.role;

  if (typeof sid !== "string") throw new Error("Invalid token sid");
  if (typeof uid !== "number") throw new Error("Invalid token uid");
  if (typeof role !== "string") throw new Error("Invalid token role");

  return { sid, uid, role } as AuthTokenPayload;
}
