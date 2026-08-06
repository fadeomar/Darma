import type { CodeVideoProject } from "./timeline";

export const CODE_VIDEO_MAX_PROJECT_BYTES = 1_500_000;
export const CODE_VIDEO_MAX_FILE_BYTES = 700_000;
export type ImportedCodeFile = { name: string; content: string };

const ignoredSegments = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", "vendor"]);
const textEncoder = new TextEncoder();

function normalizeProjectPath(name: string) {
  return name.trim().replace(/\\/g, "/").replace(/^\.\//, "");
}

export function isSafeProjectPath(name: string) {
  const normalized = normalizeProjectPath(name);
  if (!normalized || normalized.includes("\0") || normalized.startsWith("/")) return false;

  const segments = normalized.split("/");
  return !segments.some((segment) => {
    const normalizedSegment = segment.toLowerCase();
    return !segment || segment === "." || segment === ".." || ignoredSegments.has(normalizedSegment);
  });
}

const extension = (name: string) => normalizeProjectPath(name).toLowerCase().split(".").pop() ?? "";
const basename = (name: string) => normalizeProjectPath(name).split("/").pop() ?? name;
const pathDepth = (name: string) => normalizeProjectPath(name).split("/").length;
const byteLength = (content: string) => textEncoder.encode(content).byteLength;

function fileRank(name: string, kind: "html" | "css" | "js") {
  const base = basename(name).toLowerCase();
  const preferred: Record<typeof kind, string[]> = {
    html: ["index.html", "main.html", "app.html"],
    css: ["style.css", "styles.css", "main.css", "app.css"],
    js: ["script.js", "main.js", "app.js", "index.js"],
  };
  const preferredIndex = preferred[kind].indexOf(base);
  const preferenceRank = preferredIndex >= 0 ? preferredIndex : 20;
  return preferenceRank * 100 + pathDepth(name);
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

  for (const file of files) {
    if (byteLength(file.content) > CODE_VIDEO_MAX_FILE_BYTES) {
      throw new Error(`${file.name} exceeds the 700 KB file limit.`);
    }
  }

  const totalBytes = files.reduce((sum, file) => sum + byteLength(file.content), 0);
  if (totalBytes > CODE_VIDEO_MAX_PROJECT_BYTES) {
    throw new Error("The selected project is larger than the 1.5 MB browser-local limit.");
  }

  const select = (kind: "html" | "css" | "js") =>
    files
      .filter((file) => extension(file.name) === kind)
      .sort((left, right) => fileRank(left.name, kind) - fileRank(right.name, kind) || left.name.localeCompare(right.name))[0]?.content ?? "";

  const html = select("html");
  const css = select("css");
  const js = select("js");
  if (![html, css, js].some((value) => value.trim())) {
    throw new Error("No supported HTML, CSS, or JavaScript files were found.");
  }

  return { title: inferTitle(files, html), html, css, js };
}

export function buildProjectManifest(project: CodeVideoProject) {
  return JSON.stringify({ schema: "darma.code-video-project", version: 1, exportedAt: new Date().toISOString(), project }, null, 2);
}
