import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { Suspense } from "react";
import { cookies } from "next/headers";
import SiteHeader from "@/components/navigation/SiteHeader";
import { getSiteUrl } from "@/features/tools/seo";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
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

  return (
    <html lang="en" data-mode={theme}>
      <body className="antialiased">
        <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--textColor)]">
          <Suspense fallback={null}>
            <SiteHeader />
          </Suspense>
          <main>{children}</main>
        </div>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
