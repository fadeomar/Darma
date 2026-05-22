export default function JwtDecoderArticle() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-muted)]">
      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">What is a JWT?</h2>
        <p>
          A JSON Web Token, usually called a JWT, is a compact token format commonly used by APIs and web apps to carry claims between systems. A typical signed JWT has three dot-separated parts: a header, a payload, and a signature.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">Header, payload, and signature</h2>
        <p>
          The header usually describes the token type and algorithm. The payload contains claims such as the issuer, subject, audience, expiration time, issued-at time, and application-specific fields. The signature helps a server verify that the token was created by a trusted party and was not changed.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">Common registered claims</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>iss</strong>: issuer.</li>
          <li><strong>sub</strong>: subject.</li>
          <li><strong>aud</strong>: intended audience.</li>
          <li><strong>exp</strong>: expiration time as a Unix timestamp.</li>
          <li><strong>nbf</strong>: not-before time as a Unix timestamp.</li>
          <li><strong>iat</strong>: issued-at time as a Unix timestamp.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">Decode is not verify</h2>
        <p>
          Decoding only reads the Base64URL-encoded JSON. It does not prove that the token is authentic. To verify a JWT, your application must validate the signature using the correct secret or public key, check the allowed algorithm, and enforce claim rules such as audience and expiration.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">Privacy and security</h2>
        <p>
          This decoder runs locally in your browser and does not send tokens to a server. JWT payloads are not encrypted by default, so avoid pasting sensitive production tokens into random online tools. Treat decoded claims as readable data, not as proof of identity or authorization.
        </p>
      </section>
    </div>
  );
}
