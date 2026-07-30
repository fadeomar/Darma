import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exists = (file) => fs.existsSync(path.join(root, file));
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const errors = [];
const warnings = [];

const requiredFiles = [
  "src/core/motion/gsap-loader.ts",
  "src/components/motion/MotionSection.tsx",
  "src/components/motion/SplitTextReveal.tsx",
  "src/components/motion/AtlasHeroScene.tsx",
  "src/components/motion/AtlasScrollStory.tsx",
  "src/components/motion/RouteMotion.tsx",
  "src/styles/experience.css",
  "src/app/career-pathfinder/page.tsx",
  "src/features/career-pathfinder/components/CareerPathfinder.tsx",
  "src/features/career-pathfinder/questions.ts",
  "src/features/visuals/og/createAtlasOgImage.tsx",
  "docs/ui/THIRD_PARTY_MOTION_NOTICE.md",
  "public/atlas/knowledge-constellation.svg",
  "public/atlas/open-workbench.svg",
  "public/atlas/career-path.svg",
  "public/atlas/workflow-loop.svg",
  "public/atlas/decision-map.svg",
  "public/atlas/pathfinder-compass.svg",
];

for (const file of requiredFiles) {
  if (!exists(file)) errors.push(`Missing visual-experience file: ${file}`);
}

const pkg = JSON.parse(read("package.json"));
if (!pkg.dependencies?.gsap) errors.push("package.json: GSAP dependency is missing");
if (!pkg.scripts?.["ui:motion:audit"]) errors.push("package.json: ui:motion:audit script is missing");

const loader = read("src/core/motion/gsap-loader.ts");
if (!loader.includes('import("gsap")')) errors.push("gsap-loader.ts: GSAP is not loaded dynamically");
if (!loader.includes('import("gsap/ScrollTrigger")')) errors.push("gsap-loader.ts: ScrollTrigger is not loaded dynamically");
if (!loader.includes("prefers-reduced-motion")) errors.push("gsap-loader.ts: reduced-motion preference is not handled");

for (const file of [
  "src/components/motion/MotionSection.tsx",
  "src/components/motion/SplitTextReveal.tsx",
  "src/components/motion/AtlasHeroScene.tsx",
  "src/components/motion/AtlasScrollStory.tsx",
  "src/components/motion/RouteMotion.tsx",
  "src/components/navigation/SiteHeader.tsx",
  "src/features/career-pathfinder/components/CareerPathfinder.tsx",
]) {
  if (!read(file).includes("userPrefersReducedMotion")) errors.push(`${file}: motion is missing reduced-motion handling`);
}

const experienceCss = read("src/styles/experience.css");
if (!experienceCss.includes("@media (prefers-reduced-motion: reduce)")) errors.push("experience.css: reduced-motion CSS fallback is missing");
if (!experienceCss.includes(".darma-mobile-drawer")) errors.push("experience.css: mobile drawer styles are missing");
if (!experienceCss.includes(".atlas-scroll-story")) errors.push("experience.css: scroll-story styles are missing");
if (!experienceCss.includes(".pathfinder-shell")) errors.push("experience.css: Career Pathfinder styles are missing");

const sitemap = read("src/app/sitemap.ts");
if (!sitemap.includes('route: "/career-pathfinder"')) errors.push("sitemap.ts: Career Pathfinder is not included");
const search = read("src/features/search/lib/atlasSearchAdapter.ts");
if (!search.includes('href: "/career-pathfinder"')) errors.push("Global search: Career Pathfinder entry is missing");

const dynamicOgFiles = [
  "src/app/guides/[slug]/opengraph-image.tsx",
  "src/app/comparisons/[slug]/opengraph-image.tsx",
  "src/app/tech-careers/[slug]/opengraph-image.tsx",
  "src/app/ways-of-working/[slug]/opengraph-image.tsx",
  "src/app/learning-paths/[slug]/opengraph-image.tsx",
];
for (const file of dynamicOgFiles) if (!exists(file)) errors.push(`Missing dynamic Open Graph image: ${file}`);

const localVisualPages = [
  "src/app/page.tsx",
  "src/app/about/page.tsx",
  "src/app/tech-atlas/page.tsx",
  "src/app/guides/page.tsx",
  "src/app/comparisons/page.tsx",
  "src/app/tech-careers/page.tsx",
  "src/app/ways-of-working/page.tsx",
  "src/app/career-pathfinder/page.tsx",
];
for (const file of localVisualPages) {
  const source = read(file);
  if (/https?:\/\/[^"')]+\.(png|jpe?g|webp|svg)/i.test(source)) warnings.push(`${file}: contains an externally hosted visual asset`);
}

const svgFiles = requiredFiles.filter((file) => file.endsWith(".svg"));
for (const file of svgFiles) {
  const source = read(file);
  if (!source.includes("<svg")) errors.push(`${file}: invalid SVG content`);
  if (source.includes("<script")) errors.push(`${file}: SVG must not contain scripts`);
}

const result = {
  generatedAt: new Date().toISOString(),
  motionComponents: 6,
  originalVisualAssets: svgFiles.length,
  dynamicOpenGraphRoutes: dynamicOgFiles.length,
  errors,
  warnings,
};

fs.writeFileSync(path.join(root, "VISUAL_EXPERIENCE_AUDIT.json"), JSON.stringify(result, null, 2) + "\n");
fs.writeFileSync(path.join(root, "VISUAL_EXPERIENCE_AUDIT.md"), [
  "# Visual Experience Audit",
  "",
  `Generated: ${result.generatedAt}`,
  "",
  `- Motion components: **${result.motionComponents}**`,
  `- Original visual assets: **${result.originalVisualAssets}**`,
  `- Dynamic Open Graph routes: **${result.dynamicOpenGraphRoutes}**`,
  `- Errors: **${errors.length}**`,
  `- Warnings: **${warnings.length}**`,
  "",
  "## Errors",
  ...(errors.length ? errors.map((item) => `- ${item}`) : ["- None"]),
  "",
  "## Warnings",
  ...(warnings.length ? warnings.map((item) => `- ${item}`) : ["- None"]),
  "",
].join("\n"));

console.log(`Visual experience audit: ${errors.length} errors, ${warnings.length} warnings.`);
if (errors.length) process.exit(1);
