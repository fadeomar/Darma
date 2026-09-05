export default function JwtDecoderArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-muted)]">
      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">What a JWT decoder can—and cannot—tell you</h2>
        <p>
          A JSON Web Token is a compact, URL-safe container for claims. Most signed JWTs contain three dot-separated segments: a protected header, a payload, and a signature. The first two segments are Base64URL-encoded JSON, so decoding them is easy and does not require a secret key.
        </p>
        <p>
          Decoding proves only that the content is readable. It does not prove who created the token, whether the content was changed, or whether your application should trust any claim inside it.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">Production verification checklist</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Verify the signature with a trusted secret or public key.</li>
          <li>Allowlist the expected algorithm instead of accepting the header value blindly.</li>
          <li>Compare <strong>iss</strong> and <strong>aud</strong> with exact trusted values.</li>
          <li>Enforce <strong>exp</strong> and <strong>nbf</strong>, with a small clock-tolerance policy only when required.</li>
          <li>Reject unsupported critical headers, unsecured <strong>alg: none</strong>, and untrusted remote key URLs.</li>
          <li>Apply authorization rules from server-side policy, not merely from a readable role claim.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">Registered time and identity claims</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse text-left text-xs">
            <thead><tr className="border-b border-[var(--color-border-default)] text-[var(--color-text)]"><th className="py-2 pr-4">Claim</th><th className="py-2 pr-4">Meaning</th><th className="py-2">Production rule</th></tr></thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              <tr><td className="py-2 pr-4 font-mono">iss</td><td className="py-2 pr-4">Issuer</td><td className="py-2">Match an exact trusted issuer.</td></tr>
              <tr><td className="py-2 pr-4 font-mono">aud</td><td className="py-2 pr-4">Audience</td><td className="py-2">Require the API or client that is receiving the token.</td></tr>
              <tr><td className="py-2 pr-4 font-mono">exp</td><td className="py-2 pr-4">Expiration time</td><td className="py-2">Reject after this NumericDate.</td></tr>
              <tr><td className="py-2 pr-4 font-mono">nbf</td><td className="py-2 pr-4">Not-before time</td><td className="py-2">Reject before this NumericDate.</td></tr>
              <tr><td className="py-2 pr-4 font-mono">iat</td><td className="py-2 pr-4">Issued-at time</td><td className="py-2">Use for age and anomaly checks; it is not an expiration.</td></tr>
              <tr><td className="py-2 pr-4 font-mono">jti</td><td className="py-2 pr-4">JWT identifier</td><td className="py-2">Can support revocation or replay controls.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">JWT payloads are readable, not encrypted</h2>
        <p>
          A normal signed JWT protects integrity, not confidentiality. Browsers, proxies, logs, extensions, and anyone holding the token can decode its payload. Do not place passwords, API keys, private keys, payment data, or unnecessary personal information in claims. Use an encrypted token format only when confidentiality is an explicit requirement.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">Local verification in this tool</h2>
        <p>
          The optional verifier uses the project&apos;s existing <code>jose</code> library in your browser. Shared secrets and pasted JWK values remain in component memory, are cleared when requested, and are excluded from downloaded reports. For real systems, verification still belongs on a trusted server or edge runtime where keys, issuer configuration, and authorization policy are controlled.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">Inspect claims by scenario</h2>
        <p>
          The sample library now covers access, refresh, service-account, OIDC, mobile, admin, scoped, multi-audience, expired, future, unsigned, missing-expiration, sensitive, and nested-claim tokens. These are synthetic examples for learning and debugging; use them to understand claim shape and lifecycle signals without pasting a real credential.
        </p>
      </section>
    </div>
  );
}
