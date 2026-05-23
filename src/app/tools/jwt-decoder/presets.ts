import type { JwtSample } from "./types";

export const DEFAULT_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRhcm1hIERlbW8gVXNlciIsImlzcyI6ImRhcm1hLmV4YW1wbGUiLCJhdWQiOlsiYXBpIiwiZGFzaGJvYXJkIl0sImlhdCI6MTcxNjIzOTAyMiwibmJmIjoxNzE2MjM5MDIyLCJleHAiOjQxMDI0NDQ4MDAsInJvbGUiOiJkZXZlbG9wZXIifQ.demo-signature-not-verified";

export const JWT_SAMPLES: JwtSample[] = [
  {
    label: "Signed-style demo token",
    description: "A readable sample with common registered claims and a placeholder signature.",
    token: DEFAULT_JWT,
  },
  {
    label: "Unsigned alg none example",
    description: "Shows the alg none warning and an empty signature segment.",
    token: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJkZW1vIiwiZXhwIjo0MTAyNDQ0ODAwfQ.",
  },
];

export const CLAIM_DESCRIPTIONS = [
  { claim: "iss", label: "Issuer", description: "Who issued the token." },
  { claim: "sub", label: "Subject", description: "Who or what the token is about." },
  { claim: "aud", label: "Audience", description: "The intended recipient or service." },
  { claim: "exp", label: "Expiration", description: "Unix time after which the token should expire." },
  { claim: "nbf", label: "Not before", description: "Unix time before which the token should not be accepted." },
  { claim: "iat", label: "Issued at", description: "Unix time when the token was issued." },
];
