// Hand-curated layer over the large `resources.json` link library.
// Only ~10 featured links carry rich metadata; the task filters map at the
// category level (not per-link), so this file stays small and maintainable.

export type FeaturedReference = {
  name: string;
  url: string;
  bestFor: string;
  tags: string[];
  official?: boolean;
  /** A real Darma tool this reference pairs well with. */
  related?: { title: string; href: string };
};

export const FEATURED_REFERENCES: FeaturedReference[] = [
  {
    name: "MDN Web Docs",
    url: "https://developer.mozilla.org/",
    bestFor: "Reliable HTML, CSS, JavaScript, and Web API documentation.",
    tags: ["Docs", "HTML", "CSS", "JS"],
    official: true,
  },
  {
    name: "Can I use",
    url: "https://caniuse.com/",
    bestFor: "Check browser support before you rely on a feature.",
    tags: ["Compatibility", "CSS", "JS"],
    related: { title: "CSS Grid Generator", href: "/tools/css-grid-generator" },
  },
  {
    name: "web.dev",
    url: "https://web.dev/",
    bestFor: "Google's guidance on performance, SEO, and accessibility.",
    tags: ["Performance", "SEO", "A11y"],
    official: true,
  },
  {
    name: "CSS-Tricks",
    url: "https://css-tricks.com/",
    bestFor: "Practical CSS patterns and the complete Flexbox & Grid guides.",
    tags: ["CSS", "Guides"],
    related: { title: "Buttons CSS Generator", href: "/tools/buttons-css-generator" },
  },
  {
    name: "freeCodeCamp",
    url: "https://www.freecodecamp.org/",
    bestFor: "Free, project-based curriculum to learn to code from scratch.",
    tags: ["Learn", "Free", "Courses"],
  },
  {
    name: "The Odin Project",
    url: "https://www.theodinproject.com/",
    bestFor: "A free, full-stack web development learning path.",
    tags: ["Learn", "Full-stack", "Free"],
  },
  {
    name: "Coolors",
    url: "https://coolors.co/",
    bestFor: "Generate and explore color palettes in seconds.",
    tags: ["Color", "Design"],
    related: { title: "Color Palette Generator", href: "/tools/color-palette-generator" },
  },
  {
    name: "Google Fonts",
    url: "https://fonts.google.com/",
    bestFor: "Browse and embed free, open-source web fonts.",
    tags: ["Typography", "Fonts", "Free"],
    official: true,
  },
  {
    name: "SVGOMG",
    url: "https://jakearchibald.github.io/svgomg/",
    bestFor: "Optimize and clean SVG files right in the browser.",
    tags: ["SVG", "Optimize"],
    related: { title: "SVG Path Editor", href: "/tools/svg-path-editor" },
  },
  {
    name: "Lorem Picsum",
    url: "https://picsum.photos/",
    bestFor: "Free placeholder images for mockups and layouts.",
    tags: ["Images", "Placeholder"],
    related: { title: "Image Converter", href: "/tools/image-converter" },
  },
];

export type ReferenceTask = {
  id: string;
  label: string;
  /** Category names from resources.json that belong to this task. */
  categories: string[];
};

// Maps the 11 link categories onto a handful of tasks users actually have.
// A category may appear under more than one task.
export const REFERENCE_TASKS: ReferenceTask[] = [
  {
    id: "learn",
    label: "Learn",
    categories: ["Learning & Cheatsheets"],
  },
  {
    id: "build",
    label: "Build",
    categories: ["Layout & CSS Generators", "Animation & Effects", "JavaScript Tools"],
  },
  {
    id: "design",
    label: "Design",
    categories: [
      "Color & Gradient Tools",
      "Typography & Spacing",
      "Design Resources",
      "SVG & Image Tools",
      "placeholder image services",
    ],
  },
  {
    id: "optimize",
    label: "Optimize",
    categories: ["Accessibility & Optimization"],
  },
  {
    id: "work",
    label: "Work",
    categories: ["Productivity & Collaboration"],
  },
];
