// components/Editor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useCallback } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
} from "lucide-react";
import "./editorStyles.css";

interface EditorProps {
  content: string;
  onUpdate: (value: string) => void;
  placeholder?: string;
  className?: string;
  previewMode?: boolean; // New prop
}

const Editor = ({
  content,
  onUpdate,
  placeholder,
  className = "",
  previewMode = false, // Default to false (edit mode)
}: EditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { HTMLAttributes: { class: "list-disc pl-6" } },
        orderedList: { HTMLAttributes: { class: "list-decimal pl-6" } },
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "text-blue-600 underline" },
      }),
    ],
    content,
    onUpdate: previewMode
      ? undefined
      : ({ editor }) => onUpdate(editor.getHTML()), // Disable onUpdate in preview mode
    editable: !previewMode, // Disable editing in preview mode
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter the URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={`${
        previewMode ? "" : "border border-blue-950 rounded-lg shadow-sm"
      } ${className}`}
    >
      {!previewMode && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
              editor.isActive("bold")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Bold"
          >
            <Bold className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
              editor.isActive("italic")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Italic"
          >
            <Italic className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={!editor.can().chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
              editor.isActive("bulletList")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Bullet List"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={!editor.can().chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
              editor.isActive("orderedList")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            disabled={
              !editor.can().chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
              editor.isActive("heading", { level: 1 })
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            disabled={
              !editor.can().chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
              editor.isActive("heading", { level: 2 })
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            disabled={
              !editor.can().chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
              editor.isActive("heading", { level: 3 })
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Heading 3"
          >
            <Heading3 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 4 }).run()
            }
            disabled={
              !editor.can().chain().focus().toggleHeading({ level: 4 }).run()
            }
            className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
              editor.isActive("heading", { level: 4 })
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Heading 4"
          >
            <Heading4 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={setLink}
            className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
              editor.isActive("link")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Link"
          >
            <LinkIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive("link")}
            className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
              editor.isActive("link")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Unlink"
          >
            <Unlink className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Undo"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Redo"
          >
            <Redo className="w-5 h-5" />
          </button>
        </div>
      )}
      <EditorContent
        editor={editor}
        className={`tiptap-editor prose prose-sm ${
          previewMode
            ? ""
            : "p-4 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-b-lg"
        }`}
        placeholder={placeholder}
      />
    </div>
  );
};

export default Editor;
