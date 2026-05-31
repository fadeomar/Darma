"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pageview } from "@/lib/analytics/gtag";

/**
 * Sends GA4 page_view events for App Router navigations.
 *
 * Next.js client navigation does not reload the document, so this component
 * keeps analytics accurate when users move between tools with <Link />.
 */
export default function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pagePath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    pageview(pagePath);
  }, [pagePath]);

  return null;
}
