// app/preview/[id]/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import CodeEditor from "@/components/CodeEditor";
import ResizableContainer from "@/components/ResizableContainer";
import { CodeElement } from "@/types";

const MetadataCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs hover:shadow-sm transition-shadow">
    <h3 className="text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wider">
      {title}
    </h3>
    <div className="space-y-2 text-gray-800 text-sm">{children}</div>
  </div>
);

export default function PreviewPage() {
  const [element, setElement] = useState<CodeElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const params = useParams();
  const id = params.id as string; // Type assertion since useParams returns { [key: string]: string }
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [activeTab, setActiveTab] = useState("html");

  useEffect(() => {
    const fetchElement = async () => {
      if (!id) {
        setError("No ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/elements/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch element");
        }
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
  }, [id]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!element) return <div>No element found</div>;

  const iframeContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <style>
        html, body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
        }
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 50dvh;
          width: 100%;
          position: relative;
        }
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

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={containerWidth ? { width: `${containerWidth}px` } : {}}
    >
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <BackButton />
          <h1 className="text-xl font-bold text-gray-900 ml-4 truncate">
            {element.title}
          </h1>
          <button
            onClick={() =>
              navigator.clipboard.writeText(
                `<style>${cssCode}</style>\n${htmlCode}\n<script>${
                  jsCode || ""
                }</script>`
              )
            }
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
            <span className="hidden sm:inline">Export Code</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-6">
        <div
          className="space-y-6 relative flex flex-col"
          style={{
            width: containerWidth ? `${containerWidth}px` : "auto",
            maxWidth: containerWidth ? `${containerWidth}px` : "100%",
            minWidth: containerWidth ? `${containerWidth}px` : "auto",
          }}
        >
          <ResizableContainer onSizeChange={handleSizeChange}>
            <div className="bg-white rounded-2xl shadow-xl p-1 border border-gray-200 h-[100%] min-h-[80vh]">
              <iframe
                srcDoc={iframeContent}
                className="w-full h-full rounded-xl bg-white"
                title="Element Preview"
              />
            </div>
          </ResizableContainer>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex border-b border-gray-200">
              {["html", "css", "js"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium transition-colors
                    ${
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
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:h-[calc(100vh-20px)] lg:overflow-y-auto">
          <MetadataCard title="Description">
            <p className="text-gray-700 leading-relaxed">
              {element.description}
            </p>
          </MetadataCard>

          <div className="grid grid-cols-2 gap-4">
            <MetadataCard title="Created">
              <div className="text-sm text-gray-700 font-medium">
                {new Date(element.createdAt).toLocaleDateString()}
              </div>
            </MetadataCard>
            <MetadataCard title="Updated">
              <div className="text-sm text-gray-700 font-medium">
                {new Date(element.updatedAt).toLocaleDateString()}
              </div>
            </MetadataCard>
          </div>

          <MetadataCard title="Tags">
            <div className="flex flex-wrap gap-2">
              {element.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </MetadataCard>

          <MetadataCard title="Categories">
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-2">
                  Main Categories
                </h4>
                <ul className="space-y-1">
                  {element.mainCategory.map((category) => (
                    <li
                      key={category}
                      className="text-sm text-gray-700 flex items-center before:w-1.5 before:h-1.5 before:bg-indigo-500 before:rounded-full before:mr-2"
                    >
                      {category}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-2">
                  Secondary Categories
                </h4>
                <ul className="space-y-1">
                  {element.secondaryCategory.map((category) => (
                    <li
                      key={category}
                      className="text-sm text-gray-700 flex items-center before:w-1.5 before:h-1.5 before:bg-gray-400 before:rounded-full before:mr-2"
                    >
                      {category}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </MetadataCard>
        </div>
      </main>
    </div>
  );
}
