"use client";

import { useState, useEffect } from "react";
import CodeEditor from "@/components/CodeEditor"; // Assuming this is your editor component

import "./style.css";

export default function CodePreviewTool() {
  const [html, setHtml] = useState('<div id="hello">Hello World</div>');
  const [css, setCss] = useState("#hello { color: blue; font-size: 20px; }");
  const [js, setJs] = useState('console.log("Hello from JS");');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");

  // Generate iframe content
  const iframeContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <style>${css}</style>
    </head>
    <body>
      ${html}
      <script>
        window.onerror = function(message, source, lineno, colno, error) {
          window.parent.postMessage({
            type: 'error',
            message: message,
            lineno: lineno
          }, '*');
          return true;
        };
        try {
          ${js}
          window.parent.postMessage({ type: 'success' }, '*');
        } catch (e) {
          window.parent.postMessage({
            type: 'error',
            message: e.message,
            lineno: 1
          }, '*');
        }
      </script>
    </body>
    </html>
  `;

  // Handle messages from iframe (errors or success)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "error") {
        setError(`Error: ${event.data.message} (Line ${event.data.lineno})`);
      } else if (event.data.type === "success") {
        setError(null); // Clear error when code runs successfully
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Reset error when code changes
  useEffect(() => {
    setError(null); // Clear error as soon as user starts typing
  }, [html, css, js]);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
        {/* Code Editors */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-4 overflow-hidden">
          <div className="flex border-b border-gray-200 mb-4">
            {["html", "css", "js"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "html" | "css" | "js")}
                className={`flex-1 py-3 px-4 text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="h-[calc(100%-4rem)]">
            {activeTab === "html" && (
              <CodeEditor code={html} setCode={setHtml} language="html" />
            )}
            {activeTab === "css" && (
              <CodeEditor code={css} setCode={setCss} language="css" />
            )}
            {activeTab === "js" && (
              <CodeEditor code={js} setCode={setJs} language="javascript" />
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="flex-1 flex flex-col">
          <div
            className="bg-gray-50 rounded-xl p-4 flex-1 relative"
            style={{
              boxShadow:
                "6px 6px 12px rgba(0, 0, 0, 0.1), -6px -6px 12px rgba(255, 255, 255, 0.9)",
            }}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Live Preview
            </h2>
            <iframe
              srcDoc={iframeContent}
              sandbox="allow-scripts allow-forms allow-same-origin"
              className="w-full h-[calc(100%-2rem)] border-4 border-gradient-to-r from-blue-400 to-purple-500 rounded-md bg-white"
              title="Live Preview"
            />
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md animate-fade-in">
              <p className="font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="w-full"></div>
    </>
  );
}
