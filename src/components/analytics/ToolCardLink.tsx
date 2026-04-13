"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/gtag";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

interface ToolCardLinkProps {
  href: string;
  toolName: string;
  children: ReactNode;
}

export default function ToolCardLink({
  href,
  toolName,
  children,
}: ToolCardLinkProps) {
  const handleClick = () => {
    trackEvent(ANALYTICS_EVENTS.TOOL_CARD_CLICKED, {
      tool_name: toolName,
      tool_href: href,
      location: "tools_page",
    });
  };

  return (
    <Link href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}
