"use client";

import { useEffect, useRef, useState } from "react";
import { TodoProvider, useTodo } from "@/features/todo/state/TodoProvider";
import { TodoStudioShell } from "@/features/todo/components/shell/TodoStudioShell";
import { getTemplateById } from "@/features/todo/data/seedTemplates";
import "@/features/todo/styles/todo-theme.css";

export default function TodoListToolClient() {
  return (
    <TodoProvider>
      <TemplateQueryLoader />
      <TodoStudioShell />
    </TodoProvider>
  );
}

function TemplateQueryLoader() {
  const { ready, applyTemplate } = useTodo();
  const appliedRef = useRef<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTemplateId(params.get("template"));
  }, []);

  useEffect(() => {
    if (!ready || !templateId || appliedRef.current === templateId) return;
    if (!getTemplateById(templateId)) return;
    appliedRef.current = templateId;
    void applyTemplate(templateId).then(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("template");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    });
  }, [applyTemplate, ready, templateId]);

  return null;
}
