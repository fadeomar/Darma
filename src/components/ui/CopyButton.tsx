"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "./Button";

export function CopyButton({
  text,
  getText,
  copiedLabel = "Copied",
  children = "Copy",
  ...props
}: Omit<ButtonProps, "onClick" | "leftIcon"> & {
  text?: string;
  getText?: () => string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const value = getText ? getText() : text;
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button
      {...props}
      onClick={handleCopy}
      leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      variant={copied ? "soft" : props.variant ?? "primary"}
    >
      {copied ? copiedLabel : children}
    </Button>
  );
}
