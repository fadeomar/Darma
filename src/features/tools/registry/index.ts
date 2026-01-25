// src/features/tools/registry/index.ts

import { InMemoryToolRegistry } from "../infra/inMemory/toolRegistry.memory";
import type { ToolRegistry } from "../domain/toolRegistry";
import type { ToolDefinition } from "../domain/tool";

const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: "animated-background-generator",
    title: "Animated Background Generator",
    description: "Generate animated CSS backgrounds and copy the code.",
    href: "/tools/animated-background-generator",
    tags: ["css", "animation", "background"],
    mainCategory: ["tools"],
    secondaryCategory: ["css"],
    visibility: "public",
  },
  {
    id: "box-shadows-generator",
    title: "Box Shadows Generator",
    description: "Build multi-layer box-shadows visually and copy CSS.",
    href: "/tools/box-shadows-generator",
    tags: ["css", "shadow", "ui"],
    mainCategory: ["tools"],
    secondaryCategory: ["css"],
    visibility: "public",
  },
  {
    id: "code-preview-tool",
    title: "Code Preview Tool",
    description: "Preview HTML/CSS/JS in a sandboxed iframe.",
    href: "/tools/code-preview-tool",
    tags: ["html", "css", "javascript", "preview"],
    mainCategory: ["tools"],
    secondaryCategory: ["devtools"],
    visibility: "public",
  },
  {
    id: "buttons-css-generator",
    title: "Buttons CSS Generator",
    description: "Generate modern button styles and copy CSS.",
    href: "/tools/buttons-css-generator",
    tags: ["css", "buttons", "ui"],
    mainCategory: ["tools"],
    secondaryCategory: ["css"],
    visibility: "public",
  },
  {
    id: "qr-code",
    title: "QR Code Generator",
    description: "Generate QR codes quickly for URLs and text.",
    href: "/tools/qr-code",
    tags: ["qr", "generator", "utility"],
    mainCategory: ["tools"],
    secondaryCategory: ["utilities"],
    visibility: "public",
  },
  {
    id: "neumorphic-css-generator",
    title: "Neumorphic CSS Generator",
    description: "Create neumorphic shadows and surfaces with CSS.",
    href: "/tools/neumorphic-css-generator",
    tags: ["css", "neumorphism", "ui"],
    mainCategory: ["tools"],
    secondaryCategory: ["css"],
    visibility: "public",
  },
];

let registry: ToolRegistry | null = null;

export function getToolRegistry(): ToolRegistry {
  if (registry) return registry;
  registry = new InMemoryToolRegistry(TOOL_DEFINITIONS);
  return registry;
}
