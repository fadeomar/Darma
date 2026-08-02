"use client";

import { usePathname } from "next/navigation";

export default function SiteFooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/login")) return null;
  return children;
}
