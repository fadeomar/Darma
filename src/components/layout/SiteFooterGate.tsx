/**
 * Kept as a passthrough so `layout.tsx` does not need to change shape.
 *
 * Route-based footer decisions (hidden / full / compact) now live in
 * `SiteFooter` itself, beside the link data that drives both variants — see
 * `footerVariantForPath` in `footerLinks.ts`. Keeping the hide rule in one
 * place with the variant rule stops the two from drifting apart.
 */
export default function SiteFooterGate({ children }: { children: React.ReactNode }) {
  return children;
}
