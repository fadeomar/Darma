# Explorer JSON + GitHub Admin Cutover

Explorer now has two independent server-side source switches:

```env
EXPLORER_CONTENT_SOURCE=database       # database | json
EXPLORER_ADMIN_CONTENT_SOURCE=database # database | github
```

Both default to `database`. Keep those defaults until the validation gates below pass.

## GitHub configuration

GitHub admin mode requires a fine-grained token scoped to the Darma repository with **Contents: Read and write**:

```env
GITHUB_CONTENT_OWNER=fadeomar
GITHUB_CONTENT_REPO=Darma
GITHUB_CONTENT_BRANCH=main
GITHUB_CONTENT_TOKEN=...
```

The token is server-only. Never expose it through a `NEXT_PUBLIC_*` variable or commit it to Git.

Every admin mutation creates one atomic Git commit containing:

- the changed `content/explorer/items/<id>.json` file(s);
- `content/explorer/manifest.json`;
- `content/explorer/catalog.json`.

The writer refuses to fast-forward if the configured branch moved after it was read. The admin request returns HTTP 409 and must be retried after reloading.

## Validation gates

Run locally:

```bash
npm run content:validate:explorer-catalog
ENV_FILE=.env.local npm run content:compare:explorer-read-sources
ENV_FILE=.env.local npm run content:check:explorer-github
ENV_FILE=.env.local npm run content:compare:explorer-admin-sources
npm run typecheck
```

Then test in a non-production deployment:

```env
EXPLORER_CONTENT_SOURCE=json
EXPLORER_ADMIN_CONTENT_SOURCE=github
```

Verify public search, ID and slug pages, categories, admin list/edit, create, soft-delete, restore, individual approve, and bulk approve. Confirm that each admin action creates a Git commit and that the subsequent deployment serves the changed public JSON.

## Production cutover

After all gates pass, set both production variables:

```env
EXPLORER_CONTENT_SOURCE=json
EXPLORER_ADMIN_CONTENT_SOURCE=github
```

Keep the database and Prisma code available during the stabilization period.

## Rollback

Rollback does not require a code change:

```env
EXPLORER_CONTENT_SOURCE=database
EXPLORER_ADMIN_CONTENT_SOURCE=database
```

Redeploy after changing the variables. If GitHub contains changes not yet present in the database, do not continue editing in database mode until those records are intentionally synchronized.

## Operational notes

- Admin authentication remains DB-backed; this migration removes database dependency only from Explorer content operations.
- `export-checksums.json` and `export-report.json` remain historical migration-audit artifacts. Live checksums are maintained in `manifest.json`.
- A commit to the configured deployment branch must trigger a deployment for public JSON changes to become visible.
- The configured branch must allow the token to perform a non-force fast-forward update. If branch protection blocks direct updates, use an approved GitHub App/bypass policy or a dedicated deployment branch; do not weaken protection silently.
- The existing admin UI reports save success after GitHub accepts the commit. It does not yet display live Vercel deployment status.
