// components/PreviewHTML.tsx
import DOMPurify from "dompurify";

interface PreviewHTMLProps {
  html: string; // HTML content to render
  className?: string; // Optional className for styling
}

const PreviewHTML = ({ html, className = "" }: PreviewHTMLProps) => {
  // Sanitize the HTML content to prevent XSS attacks
  const sanitizedHTML = DOMPurify.sanitize(html);

  return (
    <div
      className={`prose ${className}`} // Use Tailwind's prose class for nice typography
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

export default PreviewHTML;
