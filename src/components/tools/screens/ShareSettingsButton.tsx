"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
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
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[var(--textColor)] transition hover:bg-black/5"
    >
      {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}
