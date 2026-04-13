"use client";

import React, { useState } from "react";
import CodeEditor from "@/components/CodeEditor";

type Tab = "html" | "css" | "js";

type Props = {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  setHtmlCode: React.Dispatch<React.SetStateAction<string>>;
  setCssCode: React.Dispatch<React.SetStateAction<string>>;
  setJsCode: React.Dispatch<React.SetStateAction<string>>;

  /** Optional: start on a specific tab (defaults to "html") */
  initialTab?: Tab;

  /** Optional: extra wrapper classes */
  className?: string;
};

export default function CodeTabs({
  htmlCode,
  cssCode,
  jsCode,
  setHtmlCode,
  setCssCode,
  setJsCode,
  initialTab = "html",
  className = "",
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <div
      className={[
        "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-amber-600",
        className,
      ].join(" ")}
    >
      <div className="flex border-b border-gray-200 dark:border-amber-600">
        {(["html", "css", "js"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-bold transition-colors ${
              activeTab === tab
                ? "text-indigo-600 dark:text-amber-600 border-b-2 border-indigo-600 dark:border-amber-600"
                : "text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-amber-700"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="p-2">
        {activeTab === "html" && (
          <CodeEditor
            code={htmlCode}
            setCode={setHtmlCode}
            language="html"
            showCopyButton
            analyticsContext="html code form element"
          />
        )}

        {activeTab === "css" && (
          <CodeEditor
            code={cssCode}
            setCode={setCssCode}
            language="css"
            analyticsContext="css code form element"
          />
        )}

        {activeTab === "js" && (
          <CodeEditor
            code={jsCode}
            setCode={setJsCode}
            language="javascript"
            analyticsContext="js code form element"
          />
        )}
      </div>
    </div>
  );
}
