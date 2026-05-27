
"use client";

import { useState } from "react";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import resources from "./resources.json";

const CategoryList = ({ category }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedItems = isExpanded ? category.items : category.items.slice(0, 8);

  return (
    <Card as="article" padding="md" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]">
          <LinkIcon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          {category.category}
        </h3>
        <Badge variant="outline">{category.items.length}</Badge>
      </div>

      <ul className="mt-4 space-y-2">
        {displayedItems.map((item) => (
          <li key={item.url}>
            <Link
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-transparent px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-default)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]"
            >
              <span className="min-w-0 truncate">{item.name}</span>
              <span className="text-[var(--color-text-tertiary)] transition group-hover:text-[var(--color-primary)]">↗</span>
            </Link>
          </li>
        ))}
      </ul>

      {category.items.length > 8 ? (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 inline-flex text-sm font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
        >
          {isExpanded ? "Show fewer" : `Show all ${category.items.length} resources`}
        </button>
      ) : null}
    </Card>
  );
};

export default function GoodLinks() {
  return (
    <section className="mx-auto max-w-[var(--container-wide)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 max-w-3xl">
        <Badge variant="outline">Resources</Badge>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
          Useful developer references
        </h2>
        <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
          A compact resource library for learning, debugging, design inspiration, and front-end workflow support.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {resources.map((category) => (
          <CategoryList key={category.category} category={category} />
        ))}
      </div>
    </section>
  );
}
