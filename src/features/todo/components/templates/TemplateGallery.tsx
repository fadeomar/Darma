"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { VIEW_LABELS } from "../../domain/constants";
import {
  SEED_TEMPLATES,
  getTemplateById,
  getTemplateCategories,
  searchTemplates,
} from "../../data/seedTemplates";
import type { TemplateCategory, TodoTemplate } from "../../domain/types";
import { useTodo } from "../../state/TodoProvider";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function TemplateGallery({ open, onClose }: Props) {
  const { applyTemplate, recentTemplateIds } = useTodo();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCategory("all");
      setPreviewId(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const categories = useMemo(() => getTemplateCategories(), []);
  const recent = useMemo(
    () => recentTemplateIds.map((id) => getTemplateById(id)).filter((t): t is TodoTemplate => Boolean(t)),
    [recentTemplateIds],
  );

  const results = useMemo(() => {
    let list = query.trim() ? searchTemplates(query) : SEED_TEMPLATES;
    if (category !== "all") list = list.filter((t) => t.category === category);
    return list;
  }, [query, category]);

  const featured = useMemo(() => SEED_TEMPLATES.filter((t) => t.featured), []);
  const preview = previewId ? getTemplateById(previewId) : null;

  if (!open) return null;

  async function handleUse(id: string) {
    setBusy(true);
    try {
      await applyTemplate(id);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const showDiscovery = !query.trim() && category === "all";

  return (
    <div className="todo-modal" role="dialog" aria-modal="true" aria-label="Template gallery">
      <button type="button" className="todo-modal__backdrop" aria-label="Close template gallery" onClick={onClose} />
      <div className="todo-modal__panel todo-gallery">
        <header className="todo-gallery__header">
          {preview ? (
            <button type="button" className="todo-btn todo-btn--ghost text-xs" onClick={() => setPreviewId(null)}>
              <ArrowLeft size={14} aria-hidden /> All templates
            </button>
          ) : (
            <h2 className="text-base font-bold">Template gallery</h2>
          )}
          <button type="button" className="todo-btn todo-btn--icon todo-btn--ghost" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        {preview ? (
          <TemplatePreview template={preview} busy={busy} onUse={() => void handleUse(preview.id)} />
        ) : (
          <div className="todo-gallery__body">
            <div className="todo-gallery__search">
              <Search size={16} className="todo-muted" aria-hidden />
              <input
                className="todo-input"
                placeholder="Search templates…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search templates"
              />
            </div>

            <div className="todo-gallery__cats" role="tablist" aria-label="Template categories">
              <button
                type="button"
                role="tab"
                aria-selected={category === "all"}
                className={cn("todo-chip", category === "all" && "ring-1 ring-[var(--todo-primary)]")}
                onClick={() => setCategory("all")}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={category === c}
                  className={cn("todo-chip", category === c && "ring-1 ring-[var(--todo-primary)]")}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            {showDiscovery && recent.length > 0 && (
              <Section title="Recently used">
                <Grid templates={recent} onPreview={setPreviewId} />
              </Section>
            )}

            {showDiscovery && (
              <Section title="Featured" icon={<Sparkles size={14} aria-hidden />}>
                <Grid templates={featured} onPreview={setPreviewId} />
              </Section>
            )}

            <Section title={showDiscovery ? "All templates" : `${results.length} template${results.length === 1 ? "" : "s"}`}>
              {results.length === 0 ? (
                <p className="todo-muted py-6 text-center text-sm">No templates match “{query}”. Try another search.</p>
              ) : (
                <Grid templates={results} onPreview={setPreviewId} />
              )}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="todo-gallery__section">
      <h3 className="todo-gallery__sectiontitle">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Grid({ templates, onPreview }: { templates: TodoTemplate[]; onPreview: (id: string) => void }) {
  return (
    <div className="todo-gallery__grid">
      {templates.map((t) => (
        <TemplateCard key={t.id} template={t} onClick={() => onPreview(t.id)} />
      ))}
    </div>
  );
}

function TemplateCard({ template, onClick }: { template: TodoTemplate; onClick: () => void }) {
  return (
    <button type="button" className="todo-template-card" onClick={onClick}>
      <span className="todo-template-card__dot" style={{ background: template.color ?? "var(--todo-primary)" }} aria-hidden />
      <span className="todo-template-card__name">{template.name}</span>
      <span className="todo-template-card__desc">{template.description}</span>
      <span className="todo-template-card__meta">
        <span className="todo-chip todo-chip--xs">{template.category}</span>
        <span className="todo-muted text-[10px]">{template.tasks.length} tasks · {VIEW_LABELS[template.defaultView]}</span>
      </span>
    </button>
  );
}

function TemplatePreview({ template, busy, onUse }: { template: TodoTemplate; busy: boolean; onUse: () => void }) {
  return (
    <div className="todo-gallery__preview">
      <div className="todo-gallery__previewhead">
        <div className="min-w-0">
          <h3 className="text-lg font-bold">{template.name}</h3>
          <p className="text-sm todo-muted">{template.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="todo-chip todo-chip--xs">{template.category}</span>
            <span className="todo-chip todo-chip--xs">Opens in {VIEW_LABELS[template.defaultView]}</span>
            <span className="todo-chip todo-chip--xs">{template.tasks.length} tasks</span>
          </div>
        </div>
        <button type="button" className="todo-btn todo-btn--primary" disabled={busy} onClick={onUse}>
          {busy ? "Creating…" : "Use template"}
        </button>
      </div>
      <ul className="todo-gallery__previewlist">
        {template.tasks.map((task, i) => (
          <li key={`${task.title}-${i}`} className="todo-gallery__previewitem">
            <span aria-hidden>☐</span>
            <span>
              {task.title}
              {task.section && <span className="todo-muted text-xs"> · {task.section}</span>}
              {task.priority && task.priority !== "none" && <span className="todo-chip todo-chip--xs ms-2">{task.priority}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
