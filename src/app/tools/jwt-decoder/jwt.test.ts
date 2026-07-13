import { describe, expect, it } from "vitest";
import { buildJwtChecks, decodeJwt, encodeJwtSample } from "./jwt";

const NOW = new Date("2026-07-12T12:00:00.000Z");
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);

function token(payload: Record<string, unknown>, header: Record<string, unknown> = { alg: "HS256", typ: "JWT" }, signature = "demo") {
  return encodeJwtSample({ header, payload, signature });
}

describe("JWT decoder", () => {
  it("decodes UTF-8 JSON and registered claims", () => {
    const result = decodeJwt(token({ sub: "مستخدم", iss: "https://issuer.example", aud: "api", exp: NOW_SECONDS + 3600 }), NOW);
    expect(result.status).toBe("decoded");
    expect(result.algorithm).toBe("HS256");
    expect((result.payload?.parsed as Record<string, unknown>).sub).toBe("مستخدم");
    expect(result.claimAnalysis.isExpired).toBe(false);
  });

  it("marks expired and not-yet-valid tokens", () => {
    expect(decodeJwt(token({ exp: NOW_SECONDS - 1 }), NOW).status).toBe("expired");
    expect(decodeJwt(token({ nbf: NOW_SECONDS + 60, exp: NOW_SECONDS + 3600 }), NOW).status).toBe("not-yet-valid");
  });

  it("rejects malformed token structures", () => {
    const result = decodeJwt("only.two");
    expect(result.status).toBe("invalid");
    expect(result.issues[0]?.message).toContain("three");
  });

  it("flags alg none, missing signature, and sensitive claims", () => {
    const result = decodeJwt(token({ password: "demo", exp: NOW_SECONDS + 3600 }, { alg: "none", typ: "JWT" }, ""), NOW);
    const checks = buildJwtChecks(result);
    expect(checks.find((check) => check.id === "algorithm")?.severity).toBe("danger");
    expect(checks.find((check) => check.id === "signature")?.severity).toBe("danger");
    expect(checks.find((check) => check.id === "sensitive")?.severity).toBe("danger");
  });

  it("reports token byte size and claim counts", () => {
    const result = decodeJwt(token({ sub: "1", role: "admin", exp: NOW_SECONDS + 3600 }), NOW);
    expect(result.tokenBytes).toBeGreaterThan(0);
    expect(result.headerClaimCount).toBe(2);
    expect(result.payloadClaimCount).toBe(3);
  });
});
