"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { cn } from "@/lib/cn";

export type JsonCodeEditorHandle = {
  focusLine: (line?: number, column?: number) => void;
  focus: () => void;
};

export type JsonCodeEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  height?: string;
  errorLine?: number;
  errorColumn?: number;
  className?: string;
  ariaLabel: string;
};

const JsonCodeEditor = forwardRef<JsonCodeEditorHandle, JsonCodeEditorProps>(
  (
    {
      value,
      onChange,
      readOnly = false,
      height = "520px",
      errorLine,
      errorColumn,
      className,
      ariaLabel,
      placeholder,
    },
    ref,
  ) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    useImperativeHandle(ref, () => ({
      focusLine: (line?: number, column?: number) => {
        const editorInstance = editorRef.current;
        if (!editorInstance) return;
        editorInstance.focus();
        if (!line) return;
        editorInstance.revealLineInCenter(line);
        editorInstance.setPosition({ lineNumber: line, column: column ?? 1 });
      },
      focus: () => {
        editorRef.current?.focus();
      },
    }));

    function handleMount(editorInstance: editor.IStandaloneCodeEditor) {
      editorRef.current = editorInstance;
    }

    return (
      <div
        role="group"
        aria-label={ariaLabel}
        data-error-column={errorColumn ?? undefined}
        className={cn(
          "relative overflow-hidden rounded-[calc(var(--radius-lg)-6px)] border border-[var(--color-border-default)] bg-[#0f172a] shadow-inner",
          className,
        )}
      >
        {!value ? (
          <div className="pointer-events-none absolute left-[4.6rem] top-4 z-10 font-mono text-sm text-slate-500">
            {placeholder ?? "Paste JSON here..."}
          </div>
        ) : null}
        <Editor
          height={height}
          defaultLanguage="json"
          language="json"
          theme="vs-dark"
          value={value}
          onChange={(nextValue) => onChange?.(nextValue ?? "")}
          onMount={handleMount}
          options={{
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            detectIndentation: false,
            folding: true,
            fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)",
            fontLigatures: true,
            fontSize: 13,
            formatOnPaste: false,
            formatOnType: false,
            glyphMargin: Boolean(errorLine),
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            lineDecorationsWidth: 8,
            lineNumbers: "on",
            lineNumbersMinChars: 3,
            minimap: { enabled: false },
            overviewRulerBorder: false,
            padding: { top: 16, bottom: 16 },
            readOnly,
            renderFinalNewline: "on",
            renderLineHighlight: "all",
            renderValidationDecorations: "on",
            scrollBeyondLastLine: false,
            selectOnLineNumbers: true,
            smoothScrolling: true,
            tabSize: 2,
            wordWrap: "off",
          }}
        />
      </div>
    );
  },
);

JsonCodeEditor.displayName = "JsonCodeEditor";

export default JsonCodeEditor;
