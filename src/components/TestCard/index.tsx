import { memo } from "react";
import Link from "next/link";
import { formatDate, truncateText } from "../../utils";
import "./style.css";
// import { CreateCodeElement } from "@/types";
import type { ElementDTO } from "@/features/projects/dto/element.dto";

import { buildElementPreviewDoc } from "@/features/projects/domain/preview/buildElementPreviewDoc";

const Card = ({
  element,
  status,
}: {
  element: Partial<ElementDTO>;
  status: string;
}) => {
  const iframeContent = buildElementPreviewDoc({
    html: element.html,
    css: element.css,
    js: element.js,
  });

  return (
    <div className="card-container">
      <div className="card-media">
        <iframe
          srcDoc={iframeContent}
          className="card-iframe"
          // Hardened sandbox (see next section)
          sandbox="allow-forms allow-scripts"
        />
        {status === "preview" && (
          <>
            <div className="screen-overlay"></div>
            <Link
              href={`/element/${element.id}`}
              className="preview-link text-textColor"
            >
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
          {formatDate(element.createdAt)}
        </div>

        <div className="card-meta">
          {element?.mainCategory &&
            element?.mainCategory.length > 0 &&
            element?.mainCategory.map((name: string, id: number) => (
              <span key={name + id} className="category mr-2">
                {name}
              </span>
            ))}
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
