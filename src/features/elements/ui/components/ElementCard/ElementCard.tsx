import "./style.css";
import { memo } from "react";
import Link from "next/link";
import { buildElementPreviewDoc } from "@/features/elements/domain/preview/buildElementPreviewDoc";
import type { ElementDTO } from "@/features/elements/dto/element.dto";
import { trackEvent } from "@/lib/analytics/gtag";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

export type ElementCardProps = {
  element: ElementDTO;
  status: "preview" | string;
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
    typeof element.createdAt === "string" ? element.createdAt : undefined;


  const previewHref = element.slug
    ? `/elements/${element.slug}`
    : `/element/${element.id}`;

  const handlePreviewClick = () => {
    trackEvent(ANALYTICS_EVENTS.ELEMENT_PREVIEW_CLICKED, {
      element_id: element.id,
      element_slug: element.slug ?? undefined,
      element_title: element.title ?? undefined,
      destination: previewHref,
    });
  };

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
              href={previewHref}
              onClick={handlePreviewClick}
              className="preview-link"
            >
              ↗ Preview
            </Link>
          </>
        )}
      </div>

      <div className="card-content">
        <div className="card-header">
          {element.title ? (
            <h3 className="card-title">{truncateText(element.title, 40)}</h3>
          ) : null}
          {formatDate(createdAtIso)}
        </div>

        <div className="card-meta">
          {element.mainCategory?.length ? (
            <>
              {element.mainCategory.map((name, idx) => (
                <span key={`${name}-${idx}`} className="category mr-2">
                  {name}
                </span>
              ))}
            </>
          ) : null}

          <div className="tags">
            {element.tags?.length ? (
              <>
                {element.tags.map((tag) => (
                  <Link key={tag} href={`/explore?q=${encodeURIComponent(tag)}`} className="tag">
                    #{tag}
                  </Link>
                ))}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ElementCard = memo(ElementCardBase);
