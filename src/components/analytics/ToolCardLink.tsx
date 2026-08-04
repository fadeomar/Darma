"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/gtag";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

interface ToolCardLinkProps {
  href: string;
  toolName: string;
  children: ReactNode;
  /**
   * A bare `<Link>` is `display: inline`, which severs the card's flex column:
   * anything inside it cannot stretch, so a `mt-auto` CTA never reaches the
   * card's bottom edge and CTA rows fall out of alignment. Card callers pass
   * `flex flex-1 flex-col` here to keep the chain intact.
   */
  className?: string;
  title?: string;
}

export default function ToolCardLink({
  href,
  toolName,
  children,
  className,
  title,
}: ToolCardLinkProps) {
  const handleClick = () => {
    trackEvent(ANALYTICS_EVENTS.TOOL_CARD_CLICKED, {
      tool_name: toolName,
      tool_href: href,
      location: "tools_page",
    });
  };

  return (
    <Link href={href} onClick={handleClick} className={className} title={title}>
      {children}
    </Link>
  );
}
