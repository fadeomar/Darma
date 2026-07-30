# Search Console and Webmaster Setup

This checklist prepares Darma for measurement after deployment. Verification and submission happen in the site-owner accounts, not through source code alone.

## 1. Confirm the canonical production host

Set one production origin and redirect all alternate hosts to it. Configure:

```env
NEXT_PUBLIC_SITE_URL=https://your-production-domain.example
```

Do not submit preview, branch, or localhost URLs as the canonical property.

## 2. Google Search Console

1. Add a Domain property when DNS access is available; otherwise add a URL-prefix property.
2. Complete the selected verification method.
3. For HTML-tag verification, place only the verification token in:

```env
GOOGLE_SITE_VERIFICATION=verification-token
```

4. Deploy and confirm the token is visible in the rendered metadata.
5. Submit `/sitemap.xml`.
6. Inspect the homepage, About, one guide, one comparison, one career, one learning path, and one resource hub.
7. Request indexing only for important new or substantially changed pages; normal discovery should continue through internal links and the sitemap.

## 3. Bing Webmaster Tools

1. Add the canonical site or import the verified Search Console property.
2. For meta verification, set:

```env
BING_SITE_VERIFICATION=verification-token
```

3. Submit `/sitemap.xml` and review crawl/indexing reports.

## 4. Reports to monitor

Weekly during launch and monthly after stabilization:

- Indexing status and excluded URLs
- Search queries, pages, countries, devices, and appearance
- Impressions with low click-through rate
- Queries ranking approximately positions 8–20
- Crawl and sitemap errors
- Core Web Vitals
- Manual actions and security issues

## 5. First measurement annotations

Record the deployment date for:

- Phase 9 launch
- Each new editorial batch
- Title or description experiments
- Internal-linking changes
- Major performance changes
- Multilingual launches

This avoids attributing normal search volatility to the wrong change.

## 6. Acceptance checks

- `/robots.txt` is reachable and references the canonical sitemap.
- `/sitemap.xml` contains only canonical, indexable URLs.
- `/search` remains `noindex, follow`.
- Filtered `/resources?...` pages remain `noindex, follow` and canonicalize to `/resources`.
- Static resource hubs under `/resources/[category]` remain indexable.
- Canonical tags use the production host.
- No verification secrets are committed to the repository.
