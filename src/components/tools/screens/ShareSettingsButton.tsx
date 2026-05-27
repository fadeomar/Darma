"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui";
import { buildShareUrl, copyText, type QueryValue } from "@/lib/tools/screens/url-state";

export default function ShareSettingsButton({
  pathname,
  state,
  label = "Copy Share Link",
}: {
  pathname: string;
  state: Record<string, QueryValue>;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyText(buildShareUrl(pathname, state));
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleCopy}
      leftIcon={copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}
