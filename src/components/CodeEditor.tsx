import { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { FiCheck, FiCopy } from "react-icons/fi";

// Define the props interface
interface CodeEditorProps {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  language: string;
  showCopyButton?: boolean;
  buttonPosition?: "top-right" | "bottom-right";
  height?: string;
}

const CodeEditor = ({
  code,
  setCode,
  language,
  showCopyButton = true,
  buttonPosition = "bottom-right",
  height = "400px",
}: CodeEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Handle editor mount
  const handleEditorDidMount = (
    editorInstance: editor.IStandaloneCodeEditor
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
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy code", err);
      }
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="relative w-full max-w-[280px]  md:max-w-[100%] flex justify-center mx-auto">
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
          onClick={() => handleCopy()}
          className={`absolute ${
            buttonPosition === "top-right" ? "top-4" : "bottom-4"
          } right-4 p-2 bg-fuchsia-200 text-purple-800 rounded-lg hover:bg-fuchsia-400 transition-all duration-200 flex items-center gap-2 shadow-lg z-50`}
        >
          {isCopied ? (
            <>
              <FiCheck className="w-4 h-4 text-gray-700" />
              <span className="text-sm text-gray-700">Copied!</span>
            </>
          ) : (
            <>
              <FiCopy className="w-4 h-4 text-gray-700" />
              <span className="text-sm text-gray-700">Copy</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default CodeEditor;
