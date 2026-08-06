import type { CodeVideoProject } from "./timeline";

export const CODE_VIDEO_MAX_PROJECT_BYTES = 1_500_000;
export const CODE_VIDEO_MAX_FILE_BYTES = 700_000;
export type ImportedCodeFile = { name: string; content: string };
const ignoredSegments = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", "vendor"]);

export function isSafeProjectPath(name: string) {
  const normalized = name.replace(/\\/g, "/").replace(/^\.\//, "");
  if (!normalized || normalized.startsWith("/") || normalized.includes("../")) return false;
  return !normalized.split("/").some((segment) => ignoredSegments.has(segment));
}

const extension = (name: string) => name.toLowerCase().split(".").pop() ?? "";
const basename = (name: string) => name.replace(/\\/g, "/").split("/").pop() ?? name;

function fileRank(name: string, kind: "html" | "css" | "js") {
  const base = basename(name).toLowerCase();
  const preferred: Record<typeof kind, string[]> = {
    html: ["index.html", "main.html", "app.html"],
    css: ["style.css", "styles.css", "main.css", "app.css"],
    js: ["script.js", "main.js", "app.js", "index.js"],
  };
  const preferredIndex = preferred[kind].indexOf(base);
  if (preferredIndex >= 0) return preferredIndex;
  return 20 + name.replace(/\\/g, "/").split("/").length;
}

function inferTitle(files: ImportedCodeFile[], html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch?.[1]?.trim()) return titleMatch[1].trim();
  const firstPath = files[0]?.name.replace(/\\/g, "/").split("/").filter(Boolean) ?? [];
  const folder = firstPath.length > 1 ? firstPath[0] : "Code video project";
  return folder.replace(/[-_]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function selectProjectSources(inputFiles: ImportedCodeFile[]): CodeVideoProject {
  const files = inputFiles.filter((file) => isSafeProjectPath(file.name));
  const totalBytes = files.reduce((sum, file) => sum + new TextEncoder().encode(file.content).byteLength, 0);
  if (totalBytes > CODE_VIDEO_MAX_PROJECT_BYTES) throw new Error("The selected project is larger than the 1.5 MB browser-local limit.");
  const select = (kind: "html" | "css" | "js") =>
    files.filter((file) => extension(file.name) === kind).sort((left, right) => fileRank(left.name, kind) - fileRank(right.name, kind))[0]?.content ?? "";
  const html = select("html");
  const css = select("css");
  const js = select("js");
  if (![html, css, js].some((value) => value.trim())) throw new Error("No supported HTML, CSS, or JavaScript files were found.");
  return { title: inferTitle(files, html), html, css, js };
}

export function buildProjectManifest(project: CodeVideoProject) {
  return JSON.stringify({ schema: "darma.code-video-project", version: 1, exportedAt: new Date().toISOString(), project }, null, 2);
}
