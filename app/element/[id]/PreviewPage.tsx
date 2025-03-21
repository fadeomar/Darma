// components/PreviewPage.tsx
"use client";
import React, { useState, useEffect } from "react";
import BackButton from "@/components/BackButton";
import CodeEditor from "@/components/CodeEditor";
import ResizableContainer from "@/components/ResizableContainer";
import { CodeElement } from "@/types";
import { useParams } from "next/navigation";
import PreviewHTML from "@/components/PreviewHTML";
import DateBox from "@/components/DateBox";
import { FiGithub, FiCodepen, FiTwitter, FiLink } from "react-icons/fi";

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

const copyToClipboard = (text: string) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

export default function PreviewPage({
  initialElement,
  error: initialError,
}: {
  initialElement: CodeElement | null;
  error?: string | null;
}) {
  const [element, setElement] = useState<CodeElement | null>(initialElement);
  const [isLoading, setIsLoading] = useState(!initialElement && !initialError);
  const [error, setError] = useState<string | null>(initialError || null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const { id } = useParams<{ id: string }>();
  const [htmlCode, setHtmlCode] = useState(element?.html || "");
  const [cssCode, setCssCode] = useState(element?.css || "");
  const [jsCode, setJsCode] = useState(element?.js || "");
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");

  useEffect(() => {
    if (!initialElement && !initialError) {
      const fetchElement = async () => {
        try {
          const response = await fetch(`/api/elements/${id}`);
          if (!response.ok) throw new Error("Failed to fetch element");
          const data: CodeElement = await response.json();
          setElement(data);
          setHtmlCode(data.html);
          setCssCode(data.css || "");
          setJsCode(data.js || "");
        } catch (err) {
          console.error("Failed to fetch element:", err);
          setError("An error occurred while fetching the element");
        } finally {
          setIsLoading(false);
        }
      };
      fetchElement();
    }
  }, [id, initialElement, initialError]);

  if (isLoading) return <div className="text-center py-10">Loading...</div>;
  if (error)
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  if (!element)
    return <div className="text-center py-10">No element found</div>;

  const iframeContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <style>
        html, body { width: 100%; height: 100%; margin: 0; padding: 0; }
        body { display: flex; justify-content: center; align-items: center; min-height: 50dvh; width: 100%; position: relative; }
        ${cssCode}
      </style>
    </head>
    <body>
      ${htmlCode}
      <script>${jsCode || ""}</script>
    </body>
    </html>
  `;

  const handleSizeChange = (size: { width: number; height: number }) => {
    setContainerWidth(size.width);
  };

  const exportAsHtml = () => {
    const content = `<style>${cssCode}</style>\n${htmlCode}\n<script>${
      jsCode || ""
    }</script>`;
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${element.title || "preview"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-opacity-90">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <BackButton />
          <h1 className="text-xl font-bold text-gray-900 ml-4 truncate">
            {element.title}
          </h1>
          <button
            onClick={exportAsHtml}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200"
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
        <div
          className="space-y-6 relative flex flex-col"
          style={{
            width: containerWidth ? `${containerWidth}px` : "auto",
            maxWidth: containerWidth ? `${containerWidth}px` : "100%",
            minWidth: containerWidth ? `${containerWidth}px` : "auto",
          }}
        >
          <ResizableContainer onSizeChange={handleSizeChange}>
            <div className="bg-white rounded-2xl shadow-xl p-1 border border-gray-200 h-full min-h-[80vh]">
              <iframe
                srcDoc={iframeContent}
                className="w-full h-full rounded-xl bg-white border border-gray-200 shadow-md"
                title="Element Preview"
              />
            </div>
          </ResizableContainer>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex border-b border-gray-200">
              {(["html", "css", "js"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
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
                  showCopyButton // Optional since it defaults to true
                />
              )}
              {activeTab === "css" && (
                <CodeEditor
                  code={cssCode}
                  setCode={setCssCode}
                  language="css"
                />
              )}
              {activeTab === "js" && (
                <CodeEditor
                  code={jsCode}
                  setCode={setJsCode}
                  language="javascript"
                />
              )}
            </div>
          </div>
          {/* New Description Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Description
            </h3>
            <PreviewHTML html={element.description} className="max-w-none" />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:h-[calc(100vh-20px)] lg:overflow-y-auto pb-6">
          {/* Short Description */}
          <MetadataCard title="Quick Summary">
            <p className="text-gray-600 leading-relaxed text-sm">
              {element.shortDescription}
            </p>
          </MetadataCard>

          {/* Dates Section */}
          <div className="grid grid-cols-1 gap-4">
            <DateBox date={element.createdAt} label="Created" />
            <DateBox date={element.updatedAt} label="Updated" />
          </div>

          {/* Share Buttons */}
          <MetadataCard title="Share">
            <div className="flex flex-wrap gap-3">
              <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                <FiGithub className="w-5 h-5 text-gray-700" />
              </button>
              <button className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors">
                <FiTwitter className="w-5 h-5 text-blue-600" />
              </button>
              <button className="p-2 rounded-lg bg-black hover:bg-gray-800 transition-colors">
                <FiCodepen className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => copyToClipboard(window.location.href)}
                className="p-2 rounded-lg bg-purple-100 hover:bg-purple-200 transition-colors"
              >
                <FiLink className="w-5 h-5 text-purple-600" />
              </button>
            </div>
          </MetadataCard>

          {/* Tags with gradient effect */}
          <MetadataCard title="Tags">
            <div className="flex flex-wrap gap-2">
              {element.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-xs font-medium border border-blue-50 hover:border-blue-100 transition-all"
                >
                  {tag}
                </span>
              ))}
            </div>
          </MetadataCard>
        </div>
      </main>
    </div>
  );
}
