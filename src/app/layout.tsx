import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import AnalyticsRouteTracker from "@/components/analytics/AnalyticsRouteTracker";
import { Suspense } from "react";
import { cookies } from "next/headers";
import SiteHeader from "@/components/navigation/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteFooterGate from "@/components/layout/SiteFooterGate";
import { GlobalSearchProvider } from "@/features/search/components/GlobalSearchOverlay";
import { getUnifiedSearchEntities } from "@/features/search/lib";
import { absoluteUrl, getSiteUrl } from "@/features/tools/seo";
import { RouteMotion } from "@/components/motion";

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
const bingVerification = process.env.BING_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Darma — open developer tools, learning paths, resources, and technology guides",
  description:
    "Darma is an open-source technology workspace with browser tools, cataloged developer resources, learning paths, career guides, software workflow references, and practical comparisons.",
  applicationName: "Darma",
  authors: [{ name: "Darma Maintainers", url: absoluteUrl("/about#maintainers") }],
  creator: "Darma open-source contributors",
  publisher: "Darma",
  category: "technology",
  keywords: [
    "developer tools",
    "web development resources",
    "technology learning paths",
    "developer roadmaps",
    "technology careers",
    "software development methodologies",
    "open source technology reference",
  ],
  openGraph: {
    type: "website",
    siteName: "Darma",
    title: "Darma — open tools and a connected technology atlas",
    description: "Use practical browser tools, follow structured learning paths, compare technology choices, and explore cataloged developer resources.",
    url: absoluteUrl("/"),
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: "Darma open tools and technology atlas" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Darma — open tools and a connected technology atlas",
    description: "Practical developer tools, cataloged resources, learning paths, careers, workflows, and practical technology guides.",
    images: [absoluteUrl("/opengraph-image")],
  },
  verification: googleVerification ? { google: googleVerification } : undefined,
  other: bingVerification ? { "msvalidate.01": bingVerification } : undefined,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value || "light";
  const searchEntities = getUnifiedSearchEntities();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${absoluteUrl("/")}#organization`,
        name: "Darma",
        url: absoluteUrl("/"),
        logo: absoluteUrl("/favicon.ico"),
        description: "An open-source technology workspace and reference for practical digital work.",
        sameAs: ["https://github.com/fadeomar/Darma"],
      },
      {
        "@type": "WebSite",
        "@id": `${absoluteUrl("/")}#website`,
        url: absoluteUrl("/"),
        name: "Darma",
        alternateName: ["Darma Tech Atlas", "Darma Developer Tools"],
        publisher: { "@id": `${absoluteUrl("/")}#organization` },
        inLanguage: "en",
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/search")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en" data-mode={theme}>
      <body className="antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
        <GlobalSearchProvider entities={searchEntities}>
          <a href="#main-content" className="darma-skip-link">Skip to main content</a>
          <div className="flex min-h-screen flex-col bg-[var(--color-app-bg)] text-[var(--color-text-primary)]">
            <Suspense fallback={null}><SiteHeader /></Suspense>
            <main id="main-content" className="flex-1" tabIndex={-1}><RouteMotion>{children}</RouteMotion></main>
            <SiteFooterGate><SiteFooter /></SiteFooterGate>
          </div>
        </GlobalSearchProvider>
        <GoogleAnalytics />
        <Suspense fallback={null}><AnalyticsRouteTracker /></Suspense>
      </body>
    </html>
  );
}
