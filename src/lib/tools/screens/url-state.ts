import { copyTextToClipboard } from "@/lib/copy-to-clipboard";

export type QueryValue = string | number | boolean | undefined | null;
type ReadableQueryParams = { get(key: string): string | null };
export function readStringParam(params: ReadableQueryParams, key: string, fallback: string): string { const value = params.get(key); return value && value.trim() ? value : fallback; }
export function readNumberParam(params: ReadableQueryParams, key: string, fallback: number, min?: number, max?: number): number { const raw = params.get(key); const parsed = raw == null ? Number.NaN : Number(raw); if (!Number.isFinite(parsed)) return fallback; const rounded = Math.round(parsed); return Math.min(max ?? rounded, Math.max(min ?? rounded, rounded)); }
export function readChoiceParam<T extends string>(params: ReadableQueryParams, key: string, fallback: T, allowed: readonly T[]): T { const value = params.get(key) as T | null; return value && allowed.includes(value) ? value : fallback; }
export function buildShareUrl(pathname: string, state: Record<string, QueryValue>): string { const base = typeof window !== "undefined" ? window.location.origin : ""; const url = new URL(pathname, base || "https://darma.tools"); Object.entries(state).forEach(([key, value]) => { if (value === undefined || value === null || value === "") return; url.searchParams.set(key, String(value)); }); return url.toString(); }
export async function copyText(value: string): Promise<boolean> { return copyTextToClipboard(value); }
