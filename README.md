# Darma

Darma is a front-end showcase and online tools hub built around practical HTML, CSS, and JavaScript projects. It mixes inspiration, reusable code ideas, mini apps, and free browser-based utilities in one place.

## Main areas

- **Home**: product overview and featured paths
- **Explore**: searchable catalog of projects and UI ideas
- **Tools**: free one-page utilities for fast work
- **Categories**: browse the collection by topic
- **Admin**: internal content management and review flow

## Local development

1. Install dependencies with `npm install`
2. Restore your `.env` and `.env.local` values
3. Run `npm run dev`

## Notes

- The app uses Next.js app router, Prisma, and PostgreSQL
- The tools directory is driven by `src/features/tools/registry/index.ts`
- Public project discovery lives under `/explore`
