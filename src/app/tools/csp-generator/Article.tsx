export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What is Content Security Policy?</h2>
      <p>
        Content Security Policy, or CSP, is a browser security layer that tells the browser which scripts, styles, images, frames, fonts, API endpoints, and other resources are allowed to load or execute on a page. It is usually sent as an HTTP response header.
      </p>

      <h2>What CSP can and cannot protect against</h2>
      <p>
        A good CSP can reduce the impact of cross-site scripting and injection bugs by limiting where executable code and resources may come from. It does not replace secure coding, input validation, output escaping, dependency updates, or server-side authorization checks.
      </p>

      <h2>Basic allowlist CSP vs strict CSP</h2>
      <p>
        A basic allowlist policy uses directives like <code>script-src 'self' https://cdn.example.com</code>. This is easier to understand, but host allowlists can become broad over time. Strict CSP patterns usually rely on nonces or hashes, with values like <code>'nonce-...'</code>, <code>'sha256-...'</code>, and <code>'strict-dynamic'</code> for scripts.
      </p>

      <h2>Nonces, hashes, and strict-dynamic</h2>
      <p>
        A nonce is a one-time random value added to trusted script tags and to the CSP header. Never paste a static nonce into production. Generate a fresh cryptographically random nonce for every response. Hash-based CSP allows exact inline scripts or styles by hash, but every content change requires an updated hash.
      </p>

      <h2>Common CSP directives</h2>
      <p>
        Start with <code>default-src</code> as a fallback. Add <code>script-src</code>, <code>style-src</code>, <code>img-src</code>, <code>connect-src</code>, <code>font-src</code>, and <code>frame-src</code> for resource-specific controls. Add <code>object-src 'none'</code>, <code>base-uri</code>, and <code>frame-ancestors</code> as important hardening directives.
      </p>

      <h2>Report-only mode</h2>
      <p>
        Report-only mode lets browsers send violation reports without blocking resources. It is useful when testing a new policy against production traffic before turning enforcement on.
      </p>

      <h2>Deployment examples</h2>
      <p>
        CSP is strongest as an HTTP header configured in your framework or platform. This generator can export header text plus examples for Next.js, Vercel, Netlify, Nginx, Apache, Express, and Cloudflare Workers.
      </p>

      <h2>CSP testing tips</h2>
      <p>
        Test in modern browsers, inspect the console for violations, try report-only mode first, and use external header testing tools after deployment. Vendor domains often vary by product configuration, so verify Google, Stripe, YouTube, analytics, and monitoring domains against their current documentation before production.
      </p>

      <h2>Privacy note</h2>
      <p>
        This tool runs in your browser. It does not send your pasted CSP or generated policy to a server.
      </p>

      <h2>FAQ</h2>
      <h3>Should I use a meta tag or HTTP header?</h3>
      <p>Prefer HTTP headers for production. Meta tags are convenient for demos, but some CSP features are unavailable or less appropriate through meta tags.</p>
      <h3>Is <code>'unsafe-inline'</code> always bad?</h3>
      <p>It weakens CSP for scripts. Some apps use it temporarily for compatibility, but production script policies should prefer nonces or hashes where possible.</p>
      <h3>Does CSP stop all XSS?</h3>
      <p>No. CSP is a defensive layer. You still need to fix the underlying vulnerabilities.</p>
    </article>
  );
}
