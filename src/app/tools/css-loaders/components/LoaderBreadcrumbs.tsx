import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type LoaderBreadcrumb = { name: string; path: string };

/** Visible counterpart of the BreadcrumbList structured data. */
export default function LoaderBreadcrumbs({ trail }: { trail: LoaderBreadcrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="css-loaders-breadcrumbs">
      <ol>
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;

          return (
            <li key={crumb.path}>
              {isLast ? (
                <span aria-current="page">{crumb.name}</span>
              ) : (
                <>
                  <Link href={crumb.path}>{crumb.name}</Link>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
