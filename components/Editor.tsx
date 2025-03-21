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
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
} from "lucide-react";

interface EditorProps {
  content: string; // Initial content
  onUpdate: (value: string) => void; // Callback to send updated HTML to parent
  placeholder?: string; // Optional placeholder
  className?: string; // Custom classes for styling
}

const Editor = ({
  content,
  onUpdate,
  placeholder,
  className = "",
}: EditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit, // Includes bold, italic, lists, headings, etc.
      Link.configure({
        openOnClick: false, // Don’t open links while editing
        autolink: true, // Automatically convert URLs to links
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editable: true,
  });

  // Link handling
  const setLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter the URL");
    if (url === null) return; // Canceled
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null; // Prevent rendering until editor is initialized
  }

  return (
    <div className={`border border-blue-950 rounded-lg shadow-sm ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
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
          className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
            editor.isActive("link")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          disabled={!editor.isActive("link")}
          title="Unlink"
        >
          <Unlink className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Undo"
        >
          <Undo className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Redo"
        >
          <Redo className="w-5 h-5" />
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose p-4 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-b-lg"
        placeholder={placeholder}
      />
    </div>
  );
};

export default Editor;
