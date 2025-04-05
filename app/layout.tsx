import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import { Suspense } from "react";
// import ThemeProvider from '@/components/ThemeProvider';
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Darma Project | Open source UI | CSS | HTML | JS",
  description: "UI open source projects built by HTML, CSS and JS",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const theme = (await cookieStore).get("theme")?.value || "light";
  return (
    <html lang="en" data-mode={theme}>
      <body className="antialiased">
        <div className="flex min-h-screen">
          <Suspense fallback={<div>Loading search page...</div>}>
            <Sidebar />
          </Suspense>
          <main className="flex-1 p-0 md:p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
