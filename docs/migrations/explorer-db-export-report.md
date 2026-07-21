# Explorer DB → JSON Export Report (Phase 1)

> **Scope:** lossless export only. No runtime cutover, no UI change, no schema
> migration, no database deletion, no record modification. `reviewed`/`deleted`
> are preserved as-is (not converted to a `status` field).

- **Validated at:** 2026-07-21T13:39:08.168Z
- **Source provider:** neon-postgresql
- **Source table:** `public."Element"`
- **Validation source:** database
- **Final result:** **PASS**

## Environment

| Tool | Version |
|---|---|
| PostgreSQL server | 17.10 |
| pg_dump / pg_restore / psql | 18.3 |
| Prisma | 6.5.0 |
| Node.js | v24.13.0 |
| npm | 11.12.1 |

**Connection strategy:** Neon DIRECT (unpooled) endpoint for pg_dump and the consistent raw export; Neon pooled (pgbouncer) endpoint for Prisma-based validation. Transaction-pooled endpoint was NOT used for pg_dump.

## Columns (15)

`id`, `title`, `description`, `shortDescription`, `html`, `css`, `js`, `tags`, `mainCategory`, `secondaryCategory`, `deleted`, `createdAt`, `updatedAt`, `reviewed`, `slug`

Column parity: DB-only columns **0**, model-only columns **0**.

## Record counts

| Metric | Value |
|---|---|
| Total DB rows | 778 |
| Approved (reviewed=t, deleted=f) | 42 |
| Pending (reviewed=f, deleted=f) | 734 |
| Deleted (deleted=t) | 2 |
| Reviewed AND deleted | 0 |
| Raw JSON rows | 778 |
| Raw JSONL rows | 778 |
| Per-item files | 778 |
| Manifest items | 778 |
| Checksum items | 778 |

## Parity results

```
Database rows:          778
Raw JSON rows:          778
JSONL rows:             778
Per-item files:         778
Manifest items:         778

Approved:               42
Pending:                734
Deleted:                2
Reviewed and deleted:   0

Duplicate IDs:          0
Missing records:        0
Unexpected records:     0
Field mismatches:       0
Column mismatches:      0
HTML hash mismatches:   0
CSS hash mismatches:    0
JS hash mismatches:     0
Record hash mismatches: 0

Backup archive check:   PASS (25 TOC entries; TABLE DATA public Element present)
Element restore test:   PASS
Export validation:      PASS
Secret scan:            PASS
```

## Slug report (no changes applied)

- Null slugs: **778**
- Empty slugs: **0**
- Duplicate slugs: **0**
- Invalid-looking slugs: **0**

## Consistency (snapshot)

- Method: REPEATABLE READ READ ONLY transaction for the raw export, plus a before/after invariant (count + max(updatedAt) + id-set md5) around the whole backup+export window. Shared pg_export_snapshot() across processes was not used (cross-process coordination limits in this environment); the dataset is static (latest write 2026-06-21), so before==after proves consistency. The restored dump's Element fingerprint also equals the raw export fingerprint.
- Before: n=778, maxUpdatedAt=2026-06-21 14:59:54.656, idHash=0d17e7f2acf6ef03ad7b63293b2f2229
- After:  n=778, maxUpdatedAt=2026-06-21 14:59:54.656, idHash=0d17e7f2acf6ef03ad7b63293b2f2229
- Result: **PASS**

## Backups (stored OUTSIDE git)

Database dumps are kept in a secure directory outside the repository and are **not** committed.

| File | Format | Bytes | SHA-256 |
|---|---|---|---|
| `darma-full-20260721-160512.dump` | pg_dump custom (--no-owner --no-privileges) | 252170 | `7dc340c7cc25af5c40e7efb67ae5bd77223a21d096aaf9da853a86f8f6a8d059` |
| `darma-full-20260721-160512.sql.gz` | pg_dump plain, gzip (--no-owner --no-privileges) | 244364 | `bc351b2192795747384549a0dc097a0860e258a1b7f625ccc80ec20de04a024c` |

- Supabase CLI dump: N/A — the database is Neon, not Supabase, so `supabase db dump` does not apply.

## Restore verification

- `pg_restore --list`: PASS (25 TOC entries; TABLE DATA public Element present)
- Restore target: disposable local PostgreSQL 18.3 cluster (initdb, trust auth, 127.0.0.1:55432); destroyed after verification
- Restore type: full
- Restored Element fingerprint: n=778, approved=42, pending=734, deleted=2, idHash=0d17e7f2acf6ef03ad7b63293b2f2229
- Result: **PASS** — Full restore completed with zero errors; no Neon-managed extensions/roles blocked the restore. Restored Element fingerprint is byte-identical to the production snapshot.

## Secret / public-repository scan

- Tool: custom provider-pattern scanner (gitleaks/trufflehog not installed in this environment)
- Files scanned: 781
- High-confidence findings: **0**
- Heuristic findings: **0**
- Self-test: planted AWS access key id + postgres connection-string were both detected and redacted
- Result: **PASS**

## UI-compatibility inspection

The per-item JSON contains every field the current runtime reads from `Element`.
Verified against the code paths that consume `Element` (no runtime change made):

| Consumer | File | Fields required |
|---|---|---|
| Domain type | `src/features/elements/domain/element.ts` | id, title, description, shortDescription, html, css, js, tags, mainCategory, secondaryCategory, deleted, reviewed, createdAt, updatedAt, slug |
| DTO mapper | `src/features/elements/dto/element.dto.ts` | same 15 fields (createdAt/updatedAt as ISO strings) |
| Explorer card | `src/features/elements/ui/components/ElementCard/ElementCard.tsx` | subset of the above |
| Admin form | `src/app/admin/ElementForm.tsx` | subset of the above |
| Search | `src/features/elements/domain/search/*` | tags, mainCategory, secondaryCategory, title, description |

All required fields ⊆ the 15 exported DB columns. The JSON adds only `schemaVersion`.
**Conclusion: the exported JSON is UI-complete.** (This PR does NOT switch the runtime to read the JSON.)

## Tests / checks

- Content unit tests (vitest): 15 passed
- Full test suite: 1415 passed (115 files)
- Typecheck: PASS (tsc --noEmit)
- Lint: PASS (eslint src: 0 errors, 77 pre-existing warnings)
- Build: skipped — content/script-only change; `next build` not required and out of scope

## Limitations & notes

- The task was written assuming Supabase; the live database is Neon PostgreSQL. Connection strategy was adapted accordingly (Neon direct vs pooled endpoints). Supabase-CLI logical dumps (roles/schema/data) are not applicable.
- gitleaks/trufflehog are not installed; a provider-pattern scanner was used instead (self-tested against planted secrets).
- Cross-process pg_export_snapshot() shared-snapshot was not used; consistency is proven by a before/after invariant on a static dataset plus dump==export fingerprint equality.
- All 778 slugs are NULL in production, so per-item filenames use the row id (as the spec requires).
- 734 of 778 elements are unreviewed (reviewed=false) user submissions; they are exported in their original state (reviewed:false) with no modification.
