import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legacy tooltip laboratory | Darma",
  description: "A legacy Darma tooltip experiment retained for compatibility while the content is reviewed.",
  robots: { index: false, follow: true },
};

export default function TooltipLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
