import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor"; // Import Monaco's editor types
import { FiCheck, FiCopy } from "react-icons/fi";

// Define the props interface
interface CodeEditorProps {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  language: string;
  showCopyButton?: boolean;
  buttonPosition?: "top-right" | "bottom-right"; // New prop
}

const CodeEditor = ({
  code,
  setCode,
  language,
  showCopyButton = true,
  buttonPosition = "bottom-right",
}: CodeEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Properly typed editor mount handler
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    // Optional: If you need to do something on mount, add it here
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      // Modern Clipboard API
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
      // Fallback for older browsers
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
    <div className="relative">
      <Editor
        height="400px"
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
