import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { Suspense } from "react";
import { cookies } from "next/headers";
import SiteHeader from "@/components/navigation/SiteHeader";

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

  return (
    <html lang="en" data-mode={theme}>
      <body className="antialiased">
        <div className="min-h-screen bg-[var(--color-app-bg)] text-[var(--color-text-primary)]">
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
