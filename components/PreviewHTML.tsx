// components/PreviewHTML.tsx
"use client";
import { useEffect, useState } from "react";

interface PreviewHTMLProps {
  html: string; // HTML content to render
  className?: string; // Optional className for styling
}
const DOMPurify =
  typeof window !== "undefined" ? (await import("dompurify")).default : null;

const PreviewHTML = ({ html, className = "" }: PreviewHTMLProps) => {
  const [sanitizedHTML, setSanitizedHTML] = useState("");
  // Sanitize the HTML content to prevent XSS attacks
  useEffect(() => {
    // Ensure this only runs on the client
    if (DOMPurify) {
      const clean = DOMPurify.sanitize(html);
      setSanitizedHTML(clean);
    }
  }, [html]);

  return (
    <div
      className={`prose ${className}`} // Use Tailwind's prose class for nice typography
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

export default PreviewHTML;
