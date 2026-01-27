"use client";

import React from "react";
import DateBox from "@/components/DateBox";
import { FiGithub, FiCodepen, FiTwitter, FiLink } from "react-icons/fi";
import type { ElementDTO } from "@/features/elements/dto/element.dto";

type Props = {
  element: ElementDTO;
};

const MetadataCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
    <h3 className="text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wider">
      {title}
    </h3>
    <div className="space-y-2 text-gray-800 text-sm">{children}</div>
  </div>
);

function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      fallbackCopy(text);
    });
    return;
  }
  fallbackCopy(text);

  function fallbackCopy(value: string) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

export default function ElementSidebar({ element }: Props) {
  const summary =
    element.shortDescription ||
    element.description ||
    "No summary available yet.";

  const tags = Array.isArray(element.tags) ? element.tags : [];

  return (
    <aside className="space-y-6 lg:sticky lg:top-6 lg:h-[calc(100vh-20px)] lg:overflow-y-auto pb-6">
      <MetadataCard title="Quick Summary">
        <p className="text-gray-600 leading-relaxed text-sm">{summary}</p>
      </MetadataCard>

      <div className="grid grid-cols-1 gap-4">
        <DateBox date={new Date(element.createdAt)} label="Created" />
        <DateBox date={new Date(element.updatedAt)} label="Updated" />
      </div>

      {/* Keep these buttons as visual placeholders for now (no accounts yet).
          Copy link is still useful, so we keep only that action. */}
      <MetadataCard title="Share">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="GitHub (coming soon)"
            title="Coming soon"
          >
            <FiGithub className="w-5 h-5 text-gray-700" />
          </button>

          <button
            type="button"
            className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
            aria-label="Twitter (coming soon)"
            title="Coming soon"
          >
            <FiTwitter className="w-5 h-5 text-blue-600" />
          </button>

          <button
            type="button"
            className="p-2 rounded-lg bg-black hover:bg-gray-800 transition-colors"
            aria-label="CodePen (coming soon)"
            title="Coming soon"
          >
            <FiCodepen className="w-5 h-5 text-white" />
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(window.location.href)}
            className="p-2 rounded-lg bg-purple-100 hover:bg-purple-200 transition-colors"
            aria-label="Copy link"
            title="Copy link"
          >
            <FiLink className="w-5 h-5 text-purple-600" />
          </button>
        </div>
      </MetadataCard>

      <MetadataCard title="Tags">
        {tags.length === 0 ? (
          <p className="text-gray-500 text-sm">No tags.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-xs font-medium border border-blue-50 hover:border-blue-100 transition-all"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </MetadataCard>
    </aside>
  );
}
