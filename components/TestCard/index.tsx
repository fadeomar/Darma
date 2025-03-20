import { memo } from "react";
import Link from "next/link";
import { formatDate, truncateText } from "../../utils";
import "./style.css";
import { CodeElement, CreateCodeElement } from "@/types";

const Card = ({
  element,
  status,
}: {
  element: Partial<CodeElement> | CreateCodeElement;
  status: string;
}) => {
  const iframeContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <style>
        html, body {
          height: 100%;
          width: 100%;
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          background: #4545452b;
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
    <div className="card-container">
      <div className="card-media">
        <iframe
          srcDoc={iframeContent}
          className="card-iframe"
          sandbox="allow-scripts allow-same-origin"
        />
        {status === "preview" && (
          <>
            <div className="screen-overlay"></div>
            <Link href={`/element/${element.id}`} className="preview-link">
              ↗ Preview
            </Link>
          </>
        )}
      </div>
      <div className="card-content">
        <div className="card-header">
          {element?.title && (
            <h3 className="card-title">{truncateText(element.title, 40)}</h3>
          )}
          {formatDate(
            element.createdAt instanceof Date
              ? element.createdAt.toISOString()
              : element.createdAt
          )}{" "}
        </div>

        <div className="card-meta">
          {element?.mainCategory && element?.mainCategory.length > 1 && (
            <span className="category">{element.mainCategory[0]}</span>
          )}
          <div className="tags">
            {element?.tags &&
              element?.tags.length > 1 &&
              element.tags.map((tag: string) => (
                <Link key={tag} href={`/search/${tag}`} className="tag">
                  #{tag}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Card);
