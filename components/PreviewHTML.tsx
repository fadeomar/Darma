// components/PreviewHTML.tsx
"use client";
import { useEffect, useState } from "react";

interface PreviewHTMLProps {
  html: string;
  className?: string;
}

const DOMPurify =
  typeof window !== "undefined" ? (await import("dompurify")).default : null;

const PreviewHTML = ({ html, className = "" }: PreviewHTMLProps) => {
  const [sanitizedHTML, setSanitizedHTML] = useState("");

  useEffect(() => {
    if (DOMPurify) {
      const clean = DOMPurify.sanitize(html, {
        ADD_TAGS: ["style"],
        ADD_ATTR: ["style"],
      });
      setSanitizedHTML(clean);
    }
  }, [html]);

  return (
    <div
      className={`prose prose-lg max-w-none ${className}`} // prose-lg for larger spacing
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

export default PreviewHTML;
