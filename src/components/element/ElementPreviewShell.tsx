"use client";

import React, { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import type { ElementDTO } from "@/features/elements/dto/element.dto";
import CodeTabs from "@/components/element/CodeTabs";
import ElementSidebar from "@/components/element/ElementSidebar";
import IframePreview from "@/components/element/IframePreview";
import Editor from "../Editor";

type Props = {
  element: ElementDTO;
};

export default function ElementPreviewShell({ element }: Props) {
  const [htmlCode, setHtmlCode] = useState(element?.html || "");
  const [cssCode, setCssCode] = useState(element?.css || "");
  const [jsCode, setJsCode] = useState(element?.js || "");

  // If route changes re-render with a new element instance, refresh editor states.
  useEffect(() => {
    setHtmlCode(element?.html || "");
    setCssCode(element?.css || "");
    setJsCode(element?.js || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element?.id, element?.slug]); // pick stable identifiers that exist in your DTO

  const exportAsHtml = () => {
    const content = `<style>${cssCode || ""}</style>\n${
      htmlCode || ""
    }\n<script>${jsCode || ""}</script>`;

    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${(element.title || "preview").trim()}.html`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-400 dark:to-gray-600 rounded-lg">
      <header className="bg-white dark:bg-gray-600 border-b border-gray-200 dark:border-gray-900 sticky top-0 z-10 backdrop-blur-sm bg-opacity-90">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <BackButton />

          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-300 ml-4 truncate">
            {element.title}
          </h1>

          <button
            onClick={exportAsHtml}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-black hover:bg-indigo-700 dark:hover:bg-gray-900 text-colorText rounded-lg transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              fill="none"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
              <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
            </svg>
            <span className="hidden sm:inline">Export as HTML</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Left Column */}
        <div className="space-y-6 relative flex flex-col flex-1">
          <IframePreview html={htmlCode} css={cssCode} js={jsCode} />
          <CodeTabs
            htmlCode={htmlCode}
            cssCode={cssCode}
            jsCode={jsCode}
            setHtmlCode={setHtmlCode}
            setCssCode={setCssCode}
            setJsCode={setJsCode}
          />
          {/* Description */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-amber-600 p-6">
            <h3 className="text-lg font-semibold mb-4 text-textColor">
              Description
            </h3>

            <div className="prose dark:prose-invert max-w-none overflow-visible whitespace-normal">
              <Editor
                content={element.description || "no description"}
                onUpdate={() => {}}
                previewMode={true}
                className="max-w-none"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <ElementSidebar element={element} />
      </main>
    </div>
  );
}
