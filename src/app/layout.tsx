import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import AnalyticsRouteTracker from "@/components/analytics/AnalyticsRouteTracker";
import { Suspense } from "react";
import { cookies } from "next/headers";
import SiteHeader from "@/components/navigation/SiteHeader";
import { GlobalSearchProvider } from "@/features/search/components/GlobalSearchOverlay";
import { getUnifiedSearchEntities } from "@/features/search/lib";

export const metadata: Metadata = {
  title: "Darma | Front-end showcase and online tools",
  description:
    "Discover practical HTML, CSS, and JavaScript projects, UI ideas, and browser-based tools that are fast, free, and easy to use.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value || "light";

  const searchEntities = getUnifiedSearchEntities();

  return (
    <html lang="en" data-mode={theme}>
      <body className="antialiased">
        <GlobalSearchProvider entities={searchEntities}>
          <div className="min-h-screen bg-[var(--color-app-bg)] text-[var(--color-text-primary)]">
            <Suspense fallback={null}>
              <SiteHeader />
            </Suspense>
            <main>{children}</main>
          </div>
        </GlobalSearchProvider>
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <AnalyticsRouteTracker />
        </Suspense>
      </body>
    </html>
  );
}
