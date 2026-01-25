import "./style.css";
import { memo } from "react";
import Link from "next/link";
import { buildElementPreviewDoc } from "@/features/projects/domain/preview/buildElementPreviewDoc";

// Keep types flexible to avoid breaking your current CreateCodeElement usage.
// Later we can tighten these once we consolidate types into the feature.
type ElementCardModel = {
  id?: string;

  title?: string;
  createdAt?: string | Date;

  html?: string | null;
  css?: string | null;
  js?: string | null;

  tags?: string[];
  mainCategory?: string[];
};

export type ElementCardProps = {
  element: ElementCardModel;
  status: "preview" | string;

  // UI helpers
  formatDate: (value?: string) => string;
  truncateText: (value: string, max: number) => string;
};

function ElementCardBase({
  element,
  status,
  formatDate,
  truncateText,
}: ElementCardProps) {
  const iframeContent = buildElementPreviewDoc({
    html: element.html,
    css: element.css,
    js: element.js,
  });

  const createdAtIso =
    element.createdAt instanceof Date
      ? element.createdAt.toISOString()
      : element.createdAt;

  return (
    <div className="card-container">
      <div className="card-media">
        <iframe
          srcDoc={iframeContent}
          className="card-iframe"
          sandbox="allow-forms allow-scripts"
        />
        {status === "preview" && element.id && (
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
          {formatDate(createdAtIso)}
        </div>

        <div className="card-meta">
          {element?.mainCategory && element.mainCategory.length > 0 && (
            <>
              {element.mainCategory.map((name, idx) => (
                <span key={`${name}-${idx}`} className="category mr-2">
                  {name}
                </span>
              ))}
            </>
          )}

          <div className="tags">
            {element?.tags && element.tags.length > 1 && (
              <>
                {element.tags.map((tag) => (
                  <Link key={tag} href={`/search/${tag}`} className="tag">
                    #{tag}
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ElementCard = memo(ElementCardBase);
