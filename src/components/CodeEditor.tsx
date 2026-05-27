import { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { FiCheck, FiCopy } from "react-icons/fi";
import { trackEvent } from "@/lib/analytics/gtag";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

// Define the props interface
interface CodeEditorProps {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  language: string;
  showCopyButton?: boolean;
  buttonPosition?: "top-right" | "bottom-right";
  height?: string;
  analyticsContext?: string;
}

const CodeEditor = ({
  code,
  setCode,
  language,
  showCopyButton = true,
  buttonPosition = "bottom-right",
  height = "400px",
  analyticsContext = "unknown",
}: CodeEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Handle editor mount
  const handleEditorDidMount = (
    editorInstance: editor.IStandaloneCodeEditor,
  ) => {
    editorRef.current = editorInstance;
    updateEditorHeight(editorInstance); // Set initial height based on content
  };

  // Function to dynamically adjust height based on content
  const updateEditorHeight = (editorInstance: editor.IStandaloneCodeEditor) => {
    const lineCount = editorInstance.getModel()?.getLineCount() || 1;
    const lineHeight = 20; // Approximate height per line (adjust as needed)
    const padding = 40; // Top + bottom padding from options (20 + 20)
    const contentHeight = lineCount * lineHeight + padding;
    const maxHeight = parseInt(height, 10); // Convert height prop to number

    // Set height to content height, capped at maxHeight
    const newHeight = Math.min(contentHeight, maxHeight);
    editorInstance.layout({
      height: newHeight,
      width: editorInstance.getLayoutInfo().width,
    });
  };
  // Update height and format when code changes, preserving scroll position
  useEffect(() => {
    const editorInstance = editorRef.current;
    if (!editorInstance) return;

    // Save current scroll position and cursor position
    const scrollTop = editorInstance.getScrollTop();
    const cursorPosition = editorInstance.getPosition();

    // Update height dynamically
    updateEditorHeight(editorInstance);

    // Debounced formatting
    const timeoutId = setTimeout(() => {
      const action = editorInstance.getAction("editor.action.formatDocument");
      if (action) {
        action.run().then(() => {
          // Restore scroll and cursor position after formatting
          editorInstance.setScrollTop(scrollTop);
          if (cursorPosition) {
            editorInstance.setPosition(cursorPosition);
          }
        });
      } else {
        // Restore scroll and cursor even if no formatting occurs
        editorInstance.setScrollTop(scrollTop);
        if (cursorPosition) {
          editorInstance.setPosition(cursorPosition);
        }
      }
    }, 500);

    // Immediate restoration of scroll position after height update
    editorInstance.setScrollTop(scrollTop);
    if (cursorPosition) {
      editorInstance.setPosition(cursorPosition);
    }

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, height]);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          trackEvent(ANALYTICS_EVENTS.CODE_COPIED, {
            language,
            context: analyticsContext,
          });
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(() => {
          console.error("Failed to copy code");
        });
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        trackEvent(ANALYTICS_EVENTS.CODE_COPIED, {
          language,
          context: analyticsContext,
        });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy code", err);
      }
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="relative mx-auto flex w-full max-w-[280px] justify-center md:max-w-full">
      <Editor
        height={height} // Initial height set via prop
        language={language}
        theme="vs-dark"
        value={code}
        onChange={(value) => setCode(value ?? "")}
        onMount={handleEditorDidMount}
        options={{
          automaticLayout: true,
          theme: "vs-dark",
          wordWrap: "on",
          glyphMargin: false,
          folding: false,
          lineNumbers: "on",
          lineNumbersMinChars: 2,
          lineDecorationsWidth: 0,
          renderLineHighlight: "all",
          renderWhitespace: "boundary",
          renderControlCharacters: false,
          renderValidationDecorations: "on",
          renderFinalNewline: "on",
          selectOnLineNumbers: true,
          renderLineHighlightOnlyWhenFocus: false,
          formatOnType: true,
          formatOnPaste: true,
          tabSize: 2,
          padding: {
            top: 20,
            bottom: 20,
          },
        }}
      />
      {showCopyButton && (
        <button
          type="button"
          onClick={() => handleCopy()}
          className={`absolute ${
            buttonPosition === "top-right" ? "top-4" : "bottom-4"
          } right-4 z-50 flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-3 py-2 text-[var(--color-primary)] shadow-[var(--shadow-xs)] transition duration-[var(--duration-fast)] hover:border-[var(--color-primary)] hover:bg-[var(--color-control-active)]`}
        >
          {isCopied ? (
            <>
              <FiCheck className="h-4 w-4" />
              <span className="text-sm font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <FiCopy className="h-4 w-4" />
              <span className="text-sm font-semibold">Copy</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default CodeEditor;
