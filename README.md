# Darma — Open Tech Atlas and Practical Developer Toolkit

Darma is an open-source technology reference that connects practical browser tools, reusable front-end projects, trusted learning resources, structured learning paths, career guidance, software delivery methods, and original editorial guides.

The project is designed to help beginners understand where to start and help working professionals find a reliable next step without turning the experience into an unreviewed directory of links.

## Main areas

- **Explore** — searchable catalog of front-end projects and reusable ideas
- **Tools** — free browser-based utilities
- **Resources** — curated and classified technical references
- **Learning Paths** — staged roadmaps with projects and checkpoints
- **Tech Careers** — role guides, responsibilities, skills, collaboration maps, and an interactive Career Pathfinder
- **Ways of Working** — Agile, Scrum, Kanban, Waterfall, DevOps, and related operating models
- **Guides** — original, search-intent-focused educational content
- **Comparisons** — practical decision frameworks for technologies, roles, and methods
- **Tech Atlas** — glossary, team models, and end-to-end delivery flow
- **Contribute** — structured open-source suggestions, corrections, and review guidance

## Local development

```bash
npm install
npm run dev
```

Restore the required `.env` and `.env.local` values before starting features that depend on external services or the database.

## Validation

Run deterministic Atlas, editorial, SEO, governance, and motion checks:

```bash
npm run atlas:quality
```

Run the visual-experience audit only:

```bash
npm run ui:motion:audit
```

Run the SEO/editorial checks only:

```bash
npm run seo:authority
```

Run a sampled external-link health report:

```bash
npm run atlas:links:sample
```

Before release:

```bash
npm run typecheck
npm run lint
npm run build
```

## SEO and editorial operations

- [Editorial content template](docs/seo/EDITORIAL_CONTENT_TEMPLATE.md)
- [Search Console setup](docs/seo/SEARCH_CONSOLE_SETUP.md)
- [SEO measurement plan](docs/seo/SEO_MEASUREMENT_PLAN.md)
- [Multilingual rollout plan](docs/seo/MULTILINGUAL_ROLLOUT.md)
- [Phase 9 release checklist](docs/seo/PHASE_9_RELEASE_CHECKLIST.md)
- [Motion system](docs/ui/MOTION_SYSTEM.md)
- [Visual asset policy](docs/ui/VISUAL_ASSETS.md)
- [Phase 10 visual UAT](docs/ui/PHASE_10_UAT.md)
- [GSAP third-party license notice](docs/ui/THIRD_PARTY_MOTION_NOTICE.md)
- [Editorial policy](/editorial-policy)

## Contribution and governance

The complete contribution process is documented in [CONTRIBUTING.md](CONTRIBUTING.md). Content policy, review guidance, repository setup, and maintainer procedures live under [`docs/atlas/`](docs/atlas/).

## Technical notes

- Next.js App Router
- GSAP + ScrollTrigger loaded on demand for progressive motion
- Original local SVG visual system with reduced-motion fallbacks
- Prisma and PostgreSQL for database-backed features
- Structured, repository-managed catalogs for the Tech Atlas
- Tools registry at `src/features/tools/registry/index.ts`
- Public project discovery under `/explore`
