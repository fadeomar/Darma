export type ResourceHub = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  description: string;
  categoryNames: string[];
  tagTerms: string[];
  audience: string[];
  selectionCriteria: string[];
  learnFirst: string[];
  relatedGuideSlugs: string[];
  relatedPathSlugs: string[];
  updatedAt: string;
};

export const RESOURCE_HUBS: ResourceHub[] = [
  {
    slug: "web-development",
    title: "Web Development Resources",
    shortTitle: "Web development",
    summary: "Official documentation, structured courses, standards references, and practical tools for learning and building modern websites.",
    description: "Use this hub when you need a reliable starting point for HTML, CSS, JavaScript, browser APIs, accessibility, performance, Git, and deployment. The list favors official documentation and sources that remain useful after a tutorial ends.",
    categoryNames: ["Web Development", "Learning & Cheatsheets"],
    tagTerms: ["HTML", "CSS", "JavaScript", "web standards", "frontend"],
    audience: ["Beginners building their first website", "Frontend developers filling knowledge gaps", "Mentors creating a structured curriculum"],
    selectionCriteria: ["Official or project-maintained documentation", "Clear learning sequence or durable reference value", "Useful beyond one framework version", "Connected to a practical Darma learning path"],
    learnFirst: ["How the web and browsers work", "Semantic HTML and accessible structure", "CSS layout and responsive design", "JavaScript fundamentals before framework-specific abstractions"],
    relatedGuideSlugs: ["web-development-roadmap", "frontend-developer-roadmap"],
    relatedPathSlugs: ["web-foundations", "frontend-javascript"],
    updatedAt: "2026-07-29T00:00:00.000Z",
  },
  {
    slug: "javascript",
    title: "JavaScript and Framework Resources",
    shortTitle: "JavaScript",
    summary: "Trusted JavaScript, TypeScript, React, Next.js, Vue, Angular, Node.js, and ecosystem references organized around real learning decisions.",
    description: "This hub separates language fundamentals from framework-specific learning. Start with JavaScript and browser behavior, then choose a framework or full-stack runtime based on the kind of product you want to build.",
    categoryNames: ["JavaScript Tools", "Web Development", "Backend Development"],
    tagTerms: ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Vue", "Angular"],
    audience: ["JavaScript beginners", "Frontend developers choosing a framework", "Full-stack developers using Node.js"],
    selectionCriteria: ["Primary documentation is preferred", "The source explains concepts rather than only recipes", "Version-sensitive content is maintained", "The resource supports a clear project outcome"],
    learnFirst: ["Variables, functions, arrays, objects, and modules", "The DOM, events, asynchronous work, and HTTP", "TypeScript fundamentals after basic JavaScript", "Framework concepts only after component and state problems are understood"],
    relatedGuideSlugs: ["frontend-developer-roadmap", "full-stack-javascript-roadmap"],
    relatedPathSlugs: ["frontend-javascript", "full-stack-javascript"],
    updatedAt: "2026-07-29T00:00:00.000Z",
  },
  {
    slug: "accessibility-performance",
    title: "Accessibility and Web Performance Resources",
    shortTitle: "Accessibility & performance",
    summary: "Practical references for accessible interfaces, semantic markup, keyboard support, performance measurement, and resilient web experiences.",
    description: "Accessibility and performance are quality requirements, not optional polish. These sources help teams design and test experiences that work across devices, assistive technologies, network conditions, and input methods.",
    categoryNames: ["Accessibility & Optimization"],
    tagTerms: ["accessibility", "WCAG", "performance", "Core Web Vitals", "semantic HTML"],
    audience: ["Frontend developers", "Product designers", "QA engineers and content teams"],
    selectionCriteria: ["Standards or browser-vendor guidance", "Actionable testing instructions", "Clear connection to user impact", "Avoids accessibility overlays as a substitute for fixing the product"],
    learnFirst: ["Semantic HTML and document structure", "Keyboard navigation and focus management", "Text alternatives, color contrast, and readable content", "Measure performance before optimizing"],
    relatedGuideSlugs: ["web-development-roadmap", "ui-ux-design-roadmap"],
    relatedPathSlugs: ["web-foundations", "ui-ux-product-design"],
    updatedAt: "2026-07-29T00:00:00.000Z",
  },
  {
    slug: "ui-ux-design",
    title: "UI, UX, and Product Design Resources",
    shortTitle: "UI/UX design",
    summary: "Design foundations, research methods, typography, color, design systems, prototyping, and developer handoff references for digital products.",
    description: "Use this hub to move beyond attractive screens. The selected resources cover user needs, information structure, interaction design, visual hierarchy, accessibility, reusable systems, and collaboration with engineering.",
    categoryNames: ["Design Resources", "Typography & Spacing", "Color & Gradient Tools"],
    tagTerms: ["UI", "UX", "product design", "Figma", "design systems", "typography"],
    audience: ["Aspiring UI/UX designers", "Developers improving visual decisions", "Product teams building a design system"],
    selectionCriteria: ["Teaches principles as well as tools", "Includes research or usability thinking", "Supports accessible design", "Produces artifacts that developers can implement"],
    learnFirst: ["Layout, typography, spacing, and color", "User flows and information architecture", "Wireframes before detailed visual design", "Usability testing and evidence-based iteration"],
    relatedGuideSlugs: ["ui-ux-design-roadmap"],
    relatedPathSlugs: ["ui-ux-product-design"],
    updatedAt: "2026-07-29T00:00:00.000Z",
  },
  {
    slug: "testing-quality",
    title: "Software Testing and Quality Resources",
    shortTitle: "Testing & quality",
    summary: "References for test strategy, unit and integration testing, browser automation, accessibility checks, code review, and release confidence.",
    description: "Quality is broader than finding bugs after development. These resources help developers and QA professionals decide what to test, where automation provides value, and how to combine prevention, review, observability, and user-focused validation.",
    categoryNames: ["Testing & Quality", "Accessibility & Optimization"],
    tagTerms: ["testing", "quality assurance", "unit testing", "integration testing", "automation"],
    audience: ["Developers adding reliable tests", "QA engineers designing a test strategy", "Teams improving release confidence"],
    selectionCriteria: ["Explains test purpose and tradeoffs", "Supports maintainable automation", "Covers user-visible behavior", "Fits into continuous delivery rather than a final testing phase only"],
    learnFirst: ["Define risks and expected behavior", "Use unit tests for isolated logic", "Use integration tests for boundaries and collaboration", "Reserve end-to-end tests for critical user journeys"],
    relatedGuideSlugs: ["full-stack-javascript-roadmap"],
    relatedPathSlugs: ["full-stack-javascript", "devops-web-developers"],
    updatedAt: "2026-07-29T00:00:00.000Z",
  },
  {
    slug: "devops-delivery",
    title: "DevOps, Cloud, and Software Delivery Resources",
    shortTitle: "DevOps & delivery",
    summary: "Trusted references for Git, CI/CD, containers, cloud delivery, observability, reliability, and secure software operations.",
    description: "This hub focuses on the path from a working code change to a reliable service. It connects developer workflows, automation, deployment, monitoring, feedback, and operational responsibility instead of treating DevOps as a list of tools.",
    categoryNames: ["DevOps & Delivery", "DevOps", "Software Delivery", "Version Control & Collaboration"],
    tagTerms: ["DevOps", "CI/CD", "Docker", "Git", "observability", "reliability"],
    audience: ["Web developers learning delivery", "DevOps and platform engineers", "Teams improving deployment reliability"],
    selectionCriteria: ["Primary tool or research documentation", "Explains operational outcomes", "Supports automation and repeatability", "Includes security and recovery considerations"],
    learnFirst: ["Git and collaborative change review", "Build and test automation", "Containers and environment consistency", "Deployment strategies, monitoring, and incident learning"],
    relatedGuideSlugs: ["devops-roadmap", "full-stack-javascript-roadmap"],
    relatedPathSlugs: ["devops-web-developers", "full-stack-javascript"],
    updatedAt: "2026-07-29T00:00:00.000Z",
  },
];

export const getResourceHubs = () => RESOURCE_HUBS;
export const getResourceHub = (slug: string) => RESOURCE_HUBS.find((hub) => hub.slug === slug);
