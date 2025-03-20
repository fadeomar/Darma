import { useRef } from "react";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor"; // Import Monaco's editor types

// Define the props interface
interface CodeEditorProps {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  language: string;
}

const CodeEditor = ({ code, setCode, language }: CodeEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Properly typed editor mount handler
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    // Optional: If you need to do something on mount, add it here
  };

  return (
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
  );
};

export default CodeEditor;
