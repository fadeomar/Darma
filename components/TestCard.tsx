import { memo } from "react";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Card = ({ element }: any) => {
  // Generate the content for the iframe
  const iframeContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <style>
        /* Global styles to center the content */
        html, body {
          height: 100%;
          width: 100%;
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }
        ${element.css}
      </style>
    </head>
    <body>
      ${element.html}
      <script>${element.js || ""}</script>
    </body>
    </html>
  `;

  return (
    <div className="card">
      {/* Render the iframe */}
      <iframe
        srcDoc={iframeContent}
        style={{
          width: "100%",
          aspectRatio: "16 / 9", // Adjust the ratio as needed (e.g., 16:9 for widescreen)
          border: "none",
          borderRadius: "8px",
          overflow: "hidden",
        }}
        sandbox="allow-scripts allow-same-origin" // Allow scripts and same-origin requests
      ></iframe>

      {/* Title and Link */}
      <h3>{element.title}</h3>
      <Link href={`/element/${element.id}`}>View Full Preview</Link>
    </div>
  );
};

export default memo(Card);
