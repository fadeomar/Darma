import type { ToolAudience, ToolDefinition, ToolPrivacy } from "@/features/tools";

// ─── Daily rotation ───────────────────────────────────────────────────────────
// Deterministic day-based selection so "Darma Today" is stable within a day and
// identical on server and client. Pair with `export const revalidate` on the page.

export function dayOfYearUTC(date = new Date()): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((today - start) / 86_400_000);
}

export function pickDaily<T>(items: T[], offset = 0): T | undefined {
  if (items.length === 0) return undefined;
  return items[(dayOfYearUTC() + offset) % items.length];
}

// ─── Audience entry points ────────────────────────────────────────────────────
// Each group is derived from the registry, so adding a tool with the right
// `audiences` makes it appear here automatically — no hand-maintained lists.

export type AudienceGroup = {
  id: string;
  title: string;
  description: string;
  match: (tool: ToolDefinition) => boolean;
};

export const AUDIENCE_GROUPS: AudienceGroup[] = [
  {
    id: "everyday",
    title: "For everyday users",
    description: "Quick utilities anyone can use to convert, generate, count, clean, and share without an account or setup.",
    match: (tool) => hasAudience(tool, "general"),
  },
  {
    id: "students",
    title: "For students",
    description: "Helpful calculators, text tools, and study-friendly utilities for assignments, notes, and everyday school tasks.",
    match: (tool) => hasAudience(tool, "student"),
  },
  {
    id: "creators",
    title: "For creators",
    description: "Tools for captions, links, QR codes, images, metadata, and publishing assets.",
    match: (tool) => hasAudience(tool, "creator"),
  },
  {
    id: "designers",
    title: "For designers",
    description: "Colors, gradients, shadows, image prep, and UI styles for posts, websites, and brand work.",
    match: (tool) => hasAudience(tool, "designer"),
  },
  {
    id: "developers",
    title: "For developers",
    description: "Format data, decode tokens, generate snippets, and prepare projects for launch.",
    match: (tool) => (tool.secondaryCategory ?? []).includes("devtools"),
  },
];

function hasAudience(tool: ToolDefinition, audience: ToolAudience): boolean {
  return (tool.audiences ?? []).includes(audience);
}

/** Pick up to `limit` tools for a group, featured/pinned first then alphabetical. */
export function selectGroupTools(tools: ToolDefinition[], group: AudienceGroup, limit = 5): ToolDefinition[] {
  return tools
    .filter(group.match)
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      const pinnedA = a.pinned ?? Number.POSITIVE_INFINITY;
      const pinnedB = b.pinned ?? Number.POSITIVE_INFINITY;
      if (pinnedA !== pinnedB) return pinnedA - pinnedB;
      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}

/** Distinct audiences this catalog actually serves, in display order. */
export const AUDIENCE_LABELS: Array<{ id: ToolAudience; label: string }> = [
  { id: "general", label: "Everyday users" },
  { id: "student", label: "Students" },
  { id: "creator", label: "Creators" },
  { id: "designer", label: "Designers" },
  { id: "developer", label: "Developers" },
];

// ─── Daily snippet ──────────────────────────────────────────────────────────
// A small, hand-maintained set of copy-ready one-liners. Rotated daily with
// `pickDaily`, like the tool and workflow. Keep these genuinely useful.

export type DailySnippet = {
  title: string;
  code: string;
  note: string;
};

export const SNIPPETS: DailySnippet[] = [
  {
    title: "Fluid heading size",
    code: "font-size: clamp(2rem, 5vw, 4.5rem);",
    note: "Scale a heading smoothly across screens without media queries.",
  },
  {
    title: "Soft card shadow",
    code: "box-shadow: 0 20px 60px rgba(15, 23, 42, 0.14);",
    note: "A clean, modern shadow for cards and landing sections.",
  },
  {
    title: "Center anything",
    code: "display: grid;\nplace-items: center;",
    note: "Two lines to center a child both vertically and horizontally.",
  },
  {
    title: "Truncate to one line",
    code: "overflow: hidden;\ntext-overflow: ellipsis;\nwhite-space: nowrap;",
    note: "Cut long text with an ellipsis instead of wrapping.",
  },
  {
    title: "Auto-fit responsive grid",
    code: "grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));",
    note: "Columns that reflow on their own — no breakpoints needed.",
  },
  {
    title: "Respect reduced motion",
    code: "@media (prefers-reduced-motion: reduce) {\n  * { animation: none; transition: none; }\n}",
    note: "Turn off motion for users who ask for it.",
  },
  {
    title: "Smooth system font stack",
    code: "font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;",
    note: "Fast, native-feeling text with zero font downloads.",
  },
  {
    title: "Hide scrollbar, keep scroll",
    code: ".scroll { scrollbar-width: none; }\n.scroll::-webkit-scrollbar { display: none; }",
    note: "Clean horizontal scrollers without a visible bar.",
  },
];

// ─── Static copy ──────────────────────────────────────────────────────────────

export const PRINCIPLES = [
  { title: "Preview-first", text: "You should see the result before you copy, download, or use it." },
  { title: "Copy-ready", text: "Outputs are clean, readable, and easy to reuse right away." },
  { title: "Browser-first", text: "Whenever possible, tools run directly in your browser." },
  { title: "Made for daily use", text: "Small tools, fast actions, and repeatable workflows." },
];

export const HELP_AREAS = [
  { title: "Clean and prepare content", text: "Fix messy text, count words, make slugs, generate metadata, and prepare copy for publishing." },
  { title: "Create shareable assets", text: "Generate QR codes, convert images, build palettes, and export ready-to-use visual tokens." },
  { title: "Study and calculate faster", text: "Use practical calculators and converters for schoolwork, planning, and everyday problem solving." },
  { title: "Debug developer data", text: "Format JSON, decode tokens, test regex, encode URLs, and inspect payloads locally." },
];

export const PRIVACY_META: Record<ToolPrivacy, { label: string; description: string }> = {
  "client-only": { label: "Client-only", description: "Runs entirely in your browser. Your input is never uploaded." },
  "local-storage": { label: "Local storage", description: "Saves preferences only on your own device." },
  "server-assisted": { label: "Server-assisted", description: "Uses Darma's server only when the task needs it." },
  "external-api": { label: "External service", description: "Clearly marked when an outside service is involved." },
};

export const PRIVACY_ORDER: ToolPrivacy[] = ["client-only", "local-storage", "server-assisted", "external-api"];

export function countByPrivacy(tools: ToolDefinition[]): Map<ToolPrivacy, number> {
  const counts = new Map<ToolPrivacy, number>();
  for (const tool of tools) {
    const key = tool.privacy ?? "client-only";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
