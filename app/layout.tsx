import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "../components/Sidebar";

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
      <body className={`antialiased`}>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-2">{children}</main>
        </div>
      </body>
    </html>
  );
}
