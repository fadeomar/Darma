# Phase 9 Release Checklist

## Local validation

```bash
npm ci
npm run seo:authority
npm run atlas:quality
npm run typecheck
npm run lint
npm run build
```

## Production configuration

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the canonical production origin.
- [ ] Add Google and Bing verification tokens only when verification is required.
- [ ] Confirm alternate preview domains are not canonicalized as production.
- [ ] Confirm production redirects to one preferred host and HTTPS.

## Browser validation

- [ ] `/about`
- [ ] `/guides` and one guide detail page
- [ ] `/comparisons` and one comparison detail page
- [ ] `/resources` and one static resource hub
- [ ] `/search`
- [ ] `/editorial-policy`
- [ ] `/robots.txt`
- [ ] `/sitemap.xml`
- [ ] `/opengraph-image`

## SEO validation

- [ ] Page source contains title, description, canonical, and appropriate robots metadata.
- [ ] Filtered resource URLs are `noindex, follow`.
- [ ] Search is `noindex, follow`.
- [ ] JSON-LD matches visible content and contains absolute URLs.
- [ ] Sitemap dates reflect content dates rather than request time.
- [ ] Open Graph previews render correctly.
- [ ] Structured data has no critical validation errors.
- [ ] Mobile layout has no overflow or hidden primary content.
