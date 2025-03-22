import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Darma Project | Open source UI | CSS | HTML | JS",
  description: "UI open source projects built by HTML, CSS and JS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-screen">
          <Suspense fallback={<div>Loading search page...</div>}>
            <Sidebar />
          </Suspense>
          <main className="flex-1 p-2 md:p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
