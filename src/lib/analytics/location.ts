/** Keep user-supplied contrast colors out of page-view URLs. */
export function analyticsLocation(location: string): string {
  try { const url = new URL(location); return url.pathname.replace(/\/$/, "") === "/tools/contrast-checker" ? `${url.origin}${url.pathname}` : location; }
  catch { return location; }
}
