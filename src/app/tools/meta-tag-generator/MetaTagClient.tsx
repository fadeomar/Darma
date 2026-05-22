"use client";

import { useMemo, useState } from "react";
import { Download, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Badge, Button, CopyButton, Field, Input, Select, Tabs, Textarea } from "@/components/ui";
import { generateMetaTags, getPreviewModel, validateMetaTagInput } from "./meta";
import {
  DEFAULT_META_INPUT,
  DESCRIPTION_LIMIT,
  EMPTY_META_INPUT,
  META_PRESETS,
  OG_TYPE_OPTIONS,
  TEXT_LIMIT,
  TITLE_LIMIT,
  TWITTER_CARD_OPTIONS,
  URL_LIMIT,
} from "./presets";
import type { MetaTagInput, MetaTagSection, OgType, TwitterCardType } from "./types";

type PreviewTab = "search" | "og" | "twitter" | "linkedin";

function limit(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value;
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function CharacterHint({ current, warningAt, max }: { current: number; warningAt: number; max: number }) {
  const isLong = current > warningAt;
  return (
    <span className={isLong ? "font-bold text-amber-700" : "text-[var(--color-text-soft)]"}>
      {current}/{max} characters
    </span>
  );
}

function SocialImage({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return (
      <div className="flex aspect-[1.91/1] items-center justify-center rounded-t-[var(--radius-lg)] bg-[var(--color-bg-soft)] text-sm font-bold text-[var(--color-text-muted)]">
        Add an image URL for rich cards
      </div>
    );
  }

  return <img src={src} alt={alt || "Social preview"} className="aspect-[1.91/1] w-full rounded-t-[var(--radius-lg)] object-cover bg-[var(--color-bg-soft)]" />;
}

function SearchPreview({ title, description, url, domain }: { title: string; description: string; url: string; domain: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
      <p className="text-xs text-[var(--color-text-muted)]">{domain}</p>
      <p className="break-words text-sm text-emerald-700">{url}</p>
      <h3 className="mt-1 break-words text-xl font-semibold text-blue-700">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
    </div>
  );
}

function CardPreview({ variant, model }: { variant: "og" | "twitter" | "linkedin"; model: ReturnType<typeof getPreviewModel> }) {
  const compact = variant === "twitter" && model.twitterCard === "summary";

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-soft)]">
      {!compact && <SocialImage src={model.imageUrl} alt={model.imageAlt} />}
      <div className={compact ? "grid gap-3 p-4 sm:grid-cols-[96px_minmax(0,1fr)]" : "p-4"}>
        {compact && (
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <SocialImage src={model.imageUrl} alt={model.imageAlt} />
          </div>
        )}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-soft)]">
            {variant === "linkedin" ? model.siteName : model.domain}
          </p>
          <h3 className="mt-1 break-words text-base font-black text-[var(--color-text)]">{model.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{model.description}</p>
          <p className="mt-3 text-xs text-[var(--color-text-soft)]">{variant === "twitter" ? "X/Twitter card preview" : variant === "linkedin" ? "LinkedIn-like preview" : "Open Graph preview"}</p>
        </div>
      </div>
    </div>
  );
}

export default function MetaTagClient() {
  const [input, setInput] = useState<MetaTagInput>(DEFAULT_META_INPUT);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("og");
  const [outputSection, setOutputSection] = useState<MetaTagSection>("all");

  const validations = useMemo(() => validateMetaTagInput(input), [input]);
  const hasErrors = validations.some((item) => item.level === "error");
  const preview = useMemo(() => getPreviewModel(input), [input]);
  const allTags = useMemo(() => generateMetaTags(input, "all"), [input]);
  const output = useMemo(() => generateMetaTags(input, outputSection), [input, outputSection]);
  const ogTags = useMemo(() => generateMetaTags(input, "openGraph"), [input]);
  const twitterTags = useMemo(() => generateMetaTags(input, "twitter"), [input]);

  function update<K extends keyof MetaTagInput>(key: K, value: MetaTagInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[var(--color-text)]">Meta Tag Generator</h2>
            <Badge variant="success">Browser-only</Badge>
            {hasErrors ? <Badge variant="danger">Needs fixes</Badge> : <Badge variant="success">Ready</Badge>}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Generate SEO, Open Graph, and Twitter/X tags locally. This tool does not crawl or fetch remote pages.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {META_PRESETS.map((preset) => (
            <Button key={preset.label} variant="secondary" onClick={() => setInput(preset.input)} leftIcon={<Sparkles className="h-4 w-4" />}>
              {preset.label}
            </Button>
          ))}
          <Button variant="secondary" onClick={() => setInput(EMPTY_META_INPUT)} leftIcon={<Trash2 className="h-4 w-4" />}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-[var(--color-text)]">Page details</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Fill the fields you want included in the generated head snippet.</p>
            </div>
            <Button variant="secondary" onClick={() => setInput(DEFAULT_META_INPUT)} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Reset sample
            </Button>
          </div>

          <div className="space-y-4">
            <Field label="Page title" description={<CharacterHint current={input.title.length} warningAt={60} max={TITLE_LIMIT} />}>
              <Input value={input.title} maxLength={TITLE_LIMIT} onChange={(event) => update("title", limit(event.target.value, TITLE_LIMIT))} placeholder="Your page title" />
            </Field>

            <Field label="Meta description" description={<CharacterHint current={input.description.length} warningAt={160} max={DESCRIPTION_LIMIT} />}>
              <Textarea value={input.description} rows={4} maxLength={DESCRIPTION_LIMIT} onChange={(event) => update("description", limit(event.target.value, DESCRIPTION_LIMIT))} placeholder="A short summary for search and social previews" />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Canonical URL" description="Absolute http or https URL.">
                <Input value={input.canonicalUrl} maxLength={URL_LIMIT} onChange={(event) => update("canonicalUrl", limit(event.target.value, URL_LIMIT))} placeholder="https://example.com/page" />
              </Field>
              <Field label="Site name" description="Brand or website name.">
                <Input value={input.siteName} maxLength={TEXT_LIMIT} onChange={(event) => update("siteName", limit(event.target.value, TEXT_LIMIT))} placeholder="Your site" />
              </Field>
              <Field label="OG type">
                <Select value={input.ogType} onChange={(event) => update("ogType", event.target.value as OgType)}>
                  {OG_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </Field>
              <Field label="Locale" description="Example: en_US or ar_PS.">
                <Input value={input.locale} maxLength={32} onChange={(event) => update("locale", limit(event.target.value, 32))} placeholder="en_US" />
              </Field>
            </div>

            <Field label="OG image URL" description="Use an absolute image URL. Social platforms may crop large images.">
              <Input value={input.imageUrl} maxLength={URL_LIMIT} onChange={(event) => update("imageUrl", limit(event.target.value, URL_LIMIT))} placeholder="https://example.com/social-card.jpg" />
            </Field>

            <Field label="OG image alt text" description="Describe the image for accessibility and card context.">
              <Input value={input.imageAlt} maxLength={TEXT_LIMIT} onChange={(event) => update("imageAlt", limit(event.target.value, TEXT_LIMIT))} placeholder="Preview image description" />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Twitter/X card">
                <Select value={input.twitterCard} onChange={(event) => update("twitterCard", event.target.value as TwitterCardType)}>
                  {TWITTER_CARD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </Field>
              <Field label="Twitter/X site handle">
                <Input value={input.twitterSite} maxLength={64} onChange={(event) => update("twitterSite", limit(event.target.value, 64))} placeholder="@site" />
              </Field>
              <Field label="Twitter/X creator handle">
                <Input value={input.twitterCreator} maxLength={64} onChange={(event) => update("twitterCreator", limit(event.target.value, 64))} placeholder="@creator" />
              </Field>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-[var(--color-text)]">Live preview</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Approximate search and social cards. Real platforms may crop or cache differently.</p>
              </div>
              <Tabs
                value={previewTab}
                onChange={(value) => setPreviewTab(value as PreviewTab)}
                ariaLabel="Preview type"
                items={[
                  { value: "search", label: "Search" },
                  { value: "og", label: "Open Graph" },
                  { value: "twitter", label: "X" },
                  { value: "linkedin", label: "LinkedIn" },
                ]}
              />
            </div>
            {previewTab === "search" ? (
              <SearchPreview title={preview.title} description={preview.description} url={preview.url} domain={preview.domain} />
            ) : (
              <CardPreview variant={previewTab} model={preview} />
            )}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
            <h3 className="font-black text-[var(--color-text)]">Validation</h3>
            {validations.length === 0 ? (
              <p className="mt-2 rounded-[var(--radius-md)] bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">No blocking issues found. Preview your published URL after deployment for platform-specific behavior.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {validations.map((item) => (
                  <p
                    key={`${item.field}-${item.message}`}
                    className={item.level === "error" ? "rounded-[var(--radius-md)] bg-red-50 p-3 text-sm font-semibold text-red-700" : item.level === "warning" ? "rounded-[var(--radius-md)] bg-amber-50 p-3 text-sm font-semibold text-amber-800" : "rounded-[var(--radius-md)] bg-blue-50 p-3 text-sm font-semibold text-blue-800"}
                  >
                    {item.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-[var(--color-text)]">Generated HTML</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Copy everything or only the SEO, Open Graph, or Twitter/X section.</p>
          </div>
          <Tabs
            value={outputSection}
            onChange={(value) => setOutputSection(value as MetaTagSection)}
            ariaLabel="Output section"
            items={[
              { value: "all", label: "All" },
              { value: "seo", label: "SEO" },
              { value: "openGraph", label: "Open Graph" },
              { value: "twitter", label: "Twitter/X" },
            ]}
          />
        </div>
        <Textarea value={output} readOnly rows={14} className="font-mono text-sm" />
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={allTags}>Copy all</CopyButton>
          <CopyButton text={ogTags}>Copy Open Graph</CopyButton>
          <CopyButton text={twitterTags}>Copy Twitter/X</CopyButton>
          <Button variant="secondary" onClick={() => downloadFile("darma-meta-tags.html", allTags)} leftIcon={<Download className="h-4 w-4" />}>
            Download snippet
          </Button>
        </div>
      </section>
    </div>
  );
}
