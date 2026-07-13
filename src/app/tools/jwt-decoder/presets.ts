import { encodeJwtSample } from "./jwt";
import type { JwtSampleDefinition } from "./types";

const minute = 60;
const hour = 60 * minute;
const day = 24 * hour;

export function getJwtSamples(nowSeconds = Math.floor(Date.now() / 1000)): JwtSampleDefinition[] {
  return [
    {
      id: "api-access",
      label: "API access token",
      category: "Common",
      description: "HS256-style access token with issuer, audience, role, and future expiration.",
      header: { alg: "HS256", typ: "JWT" },
      payload: {
        sub: "user_4821",
        name: "Darma Demo User",
        role: "developer",
        iss: "https://auth.example.com",
        aud: ["api", "dashboard"],
        iat: nowSeconds - 5 * minute,
        exp: nowSeconds + hour,
      },
    },
    {
      id: "expired",
      label: "Expired token",
      category: "Lifecycle",
      description: "A token whose exp claim passed 30 minutes ago.",
      header: { alg: "RS256", typ: "JWT", kid: "key-2026-01" },
      payload: {
        sub: "user_103",
        iss: "https://accounts.example.com",
        aud: "billing-api",
        iat: nowSeconds - 2 * hour,
        exp: nowSeconds - 30 * minute,
      },
    },
    {
      id: "not-yet-valid",
      label: "Future nbf token",
      category: "Lifecycle",
      description: "Shows a token that must not be accepted for another 15 minutes.",
      header: { alg: "ES256", typ: "JWT" },
      payload: {
        sub: "scheduled-job",
        scope: "reports:write",
        iat: nowSeconds,
        nbf: nowSeconds + 15 * minute,
        exp: nowSeconds + 2 * hour,
      },
    },
    {
      id: "unsigned",
      label: "Unsigned alg none",
      category: "Security",
      description: "Demonstrates why unsecured JWTs should be rejected by normal applications.",
      header: { alg: "none", typ: "JWT" },
      payload: { sub: "demo", admin: true, iat: nowSeconds, exp: nowSeconds + day },
      signature: "",
    },
    {
      id: "sensitive-payload",
      label: "Sensitive claims",
      category: "Privacy",
      description: "Highlights secrets and personal data that should not be placed in a readable JWT payload.",
      header: { alg: "HS256", typ: "JWT" },
      payload: {
        sub: "user_901",
        email: "person@example.com",
        apiKey: "demo-key-do-not-store-in-jwt",
        password: "demo-only",
        iat: nowSeconds,
        exp: nowSeconds + hour,
      },
    },
    {
      id: "oidc-id-token",
      label: "OIDC ID token",
      category: "Identity",
      description: "Identity-style claims including nonce, auth_time, azp, and email verification.",
      header: { alg: "RS256", typ: "JWT", kid: "oidc-signing-key" },
      payload: {
        iss: "https://identity.example.com",
        sub: "00u123example",
        aud: "web-client-id",
        azp: "web-client-id",
        nonce: "n-0S6_WzA2Mj",
        auth_time: nowSeconds - 10 * minute,
        iat: nowSeconds - 5 * minute,
        exp: nowSeconds + 55 * minute,
        email: "demo@example.com",
        email_verified: true,
      },
    },
  ];
}

export const DEFAULT_JWT = encodeJwtSample(getJwtSamples()[0]);

export const CLAIM_DESCRIPTIONS = [
  { claim: "iss", label: "Issuer", description: "Who issued the token." },
  { claim: "sub", label: "Subject", description: "Who or what the token is about." },
  { claim: "aud", label: "Audience", description: "The intended recipient or service." },
  { claim: "exp", label: "Expiration", description: "Unix time after which the token must be rejected." },
  { claim: "nbf", label: "Not before", description: "Unix time before which the token must be rejected." },
  { claim: "iat", label: "Issued at", description: "Unix time when the token was issued." },
  { claim: "jti", label: "JWT ID", description: "A unique identifier that can support replay protection." },
];
