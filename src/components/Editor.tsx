"use client";

import { useCallback } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Redo,
  Undo,
  Unlink,
} from "lucide-react";
import "./editorStyles.css";

interface EditorProps {
  content: string;
  onUpdate: (value: string) => void;
  placeholder?: string;
  className?: string;
  previewMode?: boolean;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const iconClass = "h-5 w-5";

function toolbarButtonClass(active?: boolean) {
  return cn(
    "rounded-[var(--radius-sm)] p-2 transition duration-[var(--duration-fast)] disabled:cursor-not-allowed disabled:opacity-40",
    active
      ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
      : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]",
  );
}

export default function Editor({
  content,
  onUpdate,
  placeholder,
  className = "",
  previewMode = false,
}: EditorProps) {
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
        HTMLAttributes: { class: "text-[var(--color-primary)] underline underline-offset-2" },
      }),
    ],
    content,
    onUpdate: previewMode ? undefined : ({ editor }) => onUpdate(editor.getHTML()),
    editable: !previewMode,
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
      className={cn(
        previewMode
          ? ""
          : "overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] shadow-[var(--shadow-xs)]",
        className,
      )}
    >
      {!previewMode && (
        <div className="flex flex-wrap gap-1 border-b border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={toolbarButtonClass(editor.isActive("bold"))}
            title="Bold"
          >
            <Bold className={iconClass} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={toolbarButtonClass(editor.isActive("italic"))}
            title="Italic"
          >
            <Italic className={iconClass} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={!editor.can().chain().focus().toggleBulletList().run()}
            className={toolbarButtonClass(editor.isActive("bulletList"))}
            title="Bullet List"
          >
            <List className={iconClass} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={!editor.can().chain().focus().toggleOrderedList().run()}
            className={toolbarButtonClass(editor.isActive("orderedList"))}
            title="Numbered List"
          >
            <ListOrdered className={iconClass} />
          </button>
          {[1, 2, 3, 4].map((level) => {
            const Icon = level === 1 ? Heading1 : level === 2 ? Heading2 : level === 3 ? Heading3 : Heading4;
            return (
              <button
                key={level}
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run()}
                disabled={!editor.can().chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run()}
                className={toolbarButtonClass(editor.isActive("heading", { level }))}
                title={`Heading ${level}`}
              >
                <Icon className={iconClass} />
              </button>
            );
          })}
          <button
            type="button"
            onClick={setLink}
            className={toolbarButtonClass(editor.isActive("link"))}
            title="Link"
          >
            <LinkIcon className={iconClass} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive("link")}
            className={toolbarButtonClass(editor.isActive("link"))}
            title="Unlink"
          >
            <Unlink className={iconClass} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={toolbarButtonClass()}
            title="Undo"
          >
            <Undo className={iconClass} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={toolbarButtonClass()}
            title="Redo"
          >
            <Redo className={iconClass} />
          </button>
        </div>
      )}
      <EditorContent
        editor={editor}
        className={cn(
          "tiptap-editor prose prose-sm max-w-none text-[var(--color-text-primary)]",
          previewMode
            ? ""
            : "min-h-[200px] rounded-b-[var(--radius-md)] p-4 focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-primary-soft)]",
        )}
        placeholder={placeholder}
      />
    </div>
  );
}
