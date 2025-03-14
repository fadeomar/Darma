import { /* useEffect */ useRef } from "react";
import Editor from "@monaco-editor/react";

const CodeEditor = ({ code, setCode, language }) => {
  // const editorRef = useRef(null);

  // useEffect(() => {
  //   if (editorRef.current) {
  //     editorRef.current.setValue(code);
  //   }
  // }, [code]);

  // const handleEditorDidMount = (editor) => {
  //   editorRef.current = editor;
  //   editor.setValue(code);
  // };
  const editorRef = useRef(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };
  return (
    <Editor
      height="200px"
      language={language}
      theme="vs-dark"
      value={code} // Use the `value` prop directly
      onChange={(value) => setCode(value)}
      onMount={handleEditorDidMount}
      options={{
        automaticLayout: true,
        theme: "vs-dark",
        // Ensure text direction is LTR
        wordWrap: "on",
        glyphMargin: false,
        folding: false,
        lineNumbers: "on",
        lineNumbersMinChars: 2,
        lineDecorationsWidth: 0,
        // Explicitly set text direction
        renderLineHighlight: "all",
        renderWhitespace: "none",
        renderControlCharacters: false,
        // renderIndentGuides: false,
        renderValidationDecorations: "on",
        renderFinalNewline: "on",
        renderLineHighlightOnlyWhenFocus: false,
        // renderOverviewRuler: true,
        // renderSideBySide: false,
        // renderValidationDecorations: "on",
        // Set text direction to LTR
        // textDirection: "ltr", // Ensure this is set
      }}
    />
  );
};

export default CodeEditor;
