# Claude Desktop prompt — apply and merge the complete Darma session

You are working inside my currently open local Darma repository in VS Code.

I will provide these artifacts:

1. `darma-complete-session-phase1-10.patch` — authoritative cumulative patch from my supplied source baseline through Phase 10.
2. `darma-complete-session-phase1-10-full.zip` — complete final project reference.
3. `darma-complete-session-phase1-10-patch-files.zip` — changed/new files plus deletion manifest.
4. `PHASE_1_10_CUMULATIVE_CHANGED_FILES.txt` and `PHASE_1_10_DELETED_FILES.txt`.

## Goal

Merge all Darma changes from Phases 1–10 into the currently open local project, including additions, updates, deletions, data catalogs, SEO/editorial pages, Tech Atlas features, governance files, visual assets, GSAP motion, dynamic Open Graph images, and Career Pathfinder.

Do not redesign, expand scope, generate replacement content, or refactor unrelated code.

## Safety boundaries

- Do not checkout, create, delete, rename, merge, or push Git branches.
- Do not commit or push.
- Do not modify `.env`, `.env.local`, secrets, database credentials, deployment configuration values, or local service accounts.
- Do not copy `.git`, `.next`, `node_modules`, caches, database dumps, or temporary files from the package.
- Preserve local changes made after the supplied baseline unless the cumulative change explicitly replaces the same behavior.
- Never resolve a conflict by blindly replacing the whole repository.
- Treat the cumulative patch as the change specification and the full ZIP as a file-content reference.
- Keep GSAP under its separate Standard "No Charge" License notice in `docs/ui/THIRD_PARTY_MOTION_NOTICE.md`.

## Required process

### 1. Inspect before writing

- Confirm the current directory is the Darma repository by checking `package.json`, `src/app`, and the existing project structure.
- Read `git status --short` only to identify local modifications. Do not run branch or commit operations.
- Inspect `PHASE_1_10_CUMULATIVE_CHANGED_FILES.txt` and `PHASE_1_10_DELETED_FILES.txt`.
- Check whether the cumulative patch applies cleanly:

```bash
git apply --check --whitespace=nowarn <absolute-path>/darma-complete-session-phase1-10.patch
```

### 2. Preferred merge path

If the check succeeds, apply it without committing:

```bash
git apply --whitespace=nowarn <absolute-path>/darma-complete-session-phase1-10.patch
```

Then verify every required new file exists and every deletion in the manifest is applied.

### 3. Conflict path

If the check fails:

- Do not use `--reject`, `--force`, `reset --hard`, checkout-overwrite, or mass deletion.
- Identify only the conflicting files.
- Compare each conflict among:
  1. current local file,
  2. cumulative patch intent,
  3. matching file inside the full final ZIP.
- Preserve newer unrelated local logic.
- Manually integrate the requested Phase 1–10 behavior into the existing local structure.
- For files listed as deleted, delete them only when the obsolete behavior still exists and no newer local code depends on them.
- Keep current local environment and database configuration untouched.

### 4. Dependency integrity

Confirm `package.json` and `package-lock.json` include:

```json
"gsap": "^3.15.0"
```

Do not regenerate or broadly reformat the lockfile unless `npm ci` proves it invalid. Do not add `@gsap/react`; the implementation intentionally uses dynamically loaded GSAP with scoped `gsap.context()` cleanup.

### 5. Structural verification

Confirm the merged project contains at least:

- `/resources` and its six static resource hubs.
- `/learning-paths` and six structured paths.
- `/tech-careers` and twenty role guides.
- `/ways-of-working` and ten guides.
- `/tech-glossary`, `/tech-teams`, `/tech-atlas`.
- `/guides`, `/comparisons`, `/editorial-policy`, `/contribute`.
- `/career-pathfinder`.
- `src/components/motion/`.
- `src/core/motion/gsap-loader.ts`.
- `src/styles/experience.css` imported by `src/app/globals.css`.
- six files under `public/atlas/`.
- five dynamic route Open Graph image files.
- governance and issue-form files under `.github/`.
- SEO, editorial, Atlas, resource, link-health, and visual audit scripts.

### 6. Install and validate

Run only the necessary validation sequence:

```bash
npm ci
npm run atlas:quality
npm run typecheck
npm run lint
npm run test
npm run build
```

Rules:

- Fix errors caused by the merged changes.
- Do not spend time rewriting unrelated legacy warnings.
- The known resource-review and learning-path-review warnings are backlog metadata items, not structural failures.
- Do not silence errors with `any`, blanket ESLint disables, ignored TypeScript errors, deleted tests, or removed audit checks.
- If `npm ci` fails because of network/registry availability, report the exact package and error; do not alter versions randomly.

### 7. Focused browser smoke test

Run the local project and check these routes only:

```text
/
/about
/tech-atlas
/resources
/resources/javascript
/learning-paths
/tech-careers
/career-pathfinder
/ways-of-working
/guides
/comparisons
/search
/contribute
/editorial-policy
```

Verify:

- No runtime, hydration, console, image, or route errors.
- Desktop Atlas mega menu opens and closes correctly.
- Mobile drawer closes by button, backdrop, Escape, and navigation; focus is trapped and restored.
- Reduced-motion mode displays all content without non-essential movement.
- About scroll story pins only on large screens and degrades to a readable stack on smaller screens.
- Career Pathfinder completes six questions, restores local progress, shares role-only result links, and opens valid role guides.
- Local SVG visuals render without external requests.
- Dynamic pages produce valid Open Graph images.
- Search includes resources, paths, careers, ways, glossary terms, guides, comparisons, and Career Pathfinder.

### 8. Final response

Return a concise report containing:

- Whether the patch applied cleanly or required manual reconciliation.
- Exact files that conflicted and how each was resolved.
- Files added, updated, and deleted counts.
- Results of `atlas:quality`, typecheck, lint, tests, and build.
- Browser routes tested and any remaining issue.
- Confirmation that no branch, commit, push, environment, secret, or database operation was performed.

Stop after the merge and verification. Do not begin another feature phase.
