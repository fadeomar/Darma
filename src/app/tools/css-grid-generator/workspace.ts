import type { GridGeneratorState } from "./types";

export const GRID_WORKSPACE_STORAGE_KEY = "darma:css-grid-studio:v1";
export const GRID_SHARE_PARAM = "grid";
const GRID_SHARE_PREFIX = "v1.";

export function serializeGridWorkspace(state: GridGeneratorState): string {
  return JSON.stringify(state);
}

function encodeSharePayload(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    for (const byte of chunk) binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeSharePayload(value: string): string {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

function readWorkspaceJson(value: string): string {
  if (!value.startsWith(GRID_SHARE_PREFIX)) return value;
  return decodeSharePayload(value.slice(GRID_SHARE_PREFIX.length));
}

export function parseGridWorkspace(value: string): GridGeneratorState {
  const parsed = JSON.parse(readWorkspaceJson(value)) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The saved grid workspace is invalid.");
  }
  const candidate = parsed as Partial<GridGeneratorState>;
  if (!Array.isArray(candidate.items) || !candidate.responsive) {
    throw new Error("The saved grid workspace is missing required grid data.");
  }
  return candidate as GridGeneratorState;
}

export function createGridShareUrl(
  currentUrl: string,
  state: GridGeneratorState,
): string {
  const url = new URL(currentUrl);
  url.searchParams.delete("preset");
  const payload = `${GRID_SHARE_PREFIX}${encodeSharePayload(
    serializeGridWorkspace(state),
  )}`;
  url.searchParams.set(GRID_SHARE_PARAM, payload);
  return url.toString();
}
