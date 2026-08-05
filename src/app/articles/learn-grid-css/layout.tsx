import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legacy CSS Grid learning article | Darma",
  description: "A legacy CSS Grid learning page retained while its attribution, examples, and editorial review are modernized.",
  robots: { index: false, follow: true },
};

export default function LegacyGridArticleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
