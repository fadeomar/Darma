"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Code2, RefreshCw, Search, ShieldCheck, Trash2 } from "lucide-react";
import { Badge, Button, CopyButton, Field, Input, Tabs, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CHEATSHEET, DEFAULT_FLAGS, DEFAULT_PATTERN, DEFAULT_REPLACEMENT, FLAG_OPTIONS, REGEX_EXAMPLES, SAMPLE_TEXT } from "./presets";
import { buildRegex, countWords, escapeHtml, explainFlags, findMatches, REGEX_INPUT_LIMIT, REGEX_PATTERN_LIMIT, REGEX_REPLACEMENT_LIMIT, replaceMatches } from "./regex";
import type { FlagInfo, RegexExample, RegexFlag, RegexMatchResult, RegexTab } from "./types";

const TAB_ITEMS: { value: RegexTab; label: string }[] = [
  { value: "test", label: "Test" },
  { value: "matches", label: "Matches" },
  { value: "replace", label: "Replace" },
];

function safeSlice(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength + 1) : value;
}

function formatRange(match: RegexMatchResult) {
  return `${match.index}–${match.endIndex}`;
}

function HighlightedText({ text, matches }: { text: string; matches: RegexMatchResult[] }) {
  if (!text) {
    return <p className="text-sm text-[var(--color-text-muted)]">Match highlighting will appear here after you enter test text.</p>;
  }

  if (!matches.length) {
    return <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-[var(--color-text-muted)]">{text}</pre>;
  }

  const sortedMatches = matches
    .filter((match) => match.index >= 0 && match.index <= text.length)
    .sort((a, b) => a.index - b.index);

  let cursor = 0;
  const parts: ReactNode[] = [];

  sortedMatches.forEach((match, index) => {
    const start = Math.max(cursor, match.index);
    const end = Math.max(start, match.endIndex);

    if (start > cursor) {
      parts.push(<span key={`text-${index}-${cursor}`}>{text.slice(cursor, start)}</span>);
    }

    const matchText = text.slice(start, end);
    if (matchText.length === 0) {
      parts.push(
        <mark
          key={`zero-${index}-${start}`}
          className="rounded bg-amber-100 px-1 py-0.5 font-bold text-amber-900 ring-1 ring-amber-300"
          title={`Zero-length match at ${start}`}
        >
          ⟂
        </mark>,
      );
    } else {
      parts.push(
        <mark
          key={`match-${index}-${start}`}
          className={cn(
            "rounded px-1 py-0.5 font-bold ring-1",
            index % 2 === 0 ? "bg-sky-100 text-sky-900 ring-sky-300" : "bg-violet-100 text-violet-900 ring-violet-300",
          )}
          title={`Match ${index + 1}: ${formatRange(match)}`}
        >
          {matchText}
        </mark>,
      );
    }

    cursor = end;
  });

  if (cursor < text.length) {
    parts.push(<span key={`text-tail-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-[var(--color-text)]">{parts}</pre>;
}

function FlagToggle({ flag, label, enabled, onToggle }: { flag: RegexFlag; label: string; enabled: boolean; onToggle: (flag: RegexFlag) => void }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(flag)}
      aria-pressed={enabled}
      className={cn(
        "min-h-10 rounded-[var(--radius-sm)] border px-3 font-mono text-sm font-black transition",
        enabled
          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]"
          : "border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]",
      )}
      title={`Toggle ${label} flag`}
    >
      {label}
    </button>
  );
}

function MatchCard({ match, index }: { match: RegexMatchResult; index: number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-soft)]">Match {index + 1}</p>
          <code className="mt-1 block break-all rounded-[var(--radius-sm)] bg-[var(--color-bg-soft)] px-2 py-1 font-mono text-sm font-bold text-[var(--color-text)]">
            {match.match || "Zero-length match"}
          </code>
        </div>
        <Badge variant="outline">Index {formatRange(match)}</Badge>
      </div>

      {match.captures.length ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-soft)]">Capture groups</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {match.captures.map((capture) => (
              <div key={capture.index} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-2">
                <span className="text-xs font-bold text-[var(--color-text-soft)]">${capture.index}</span>
                <code className="ml-2 break-all font-mono text-xs text-[var(--color-text)]">{capture.value ?? "undefined"}</code>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {match.namedGroups.length ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-soft)]">Named groups</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {match.namedGroups.map((group) => (
              <div key={group.name} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-2">
                <span className="text-xs font-bold text-[var(--color-text-soft)]">{group.name}</span>
                <code className="ml-2 break-all font-mono text-xs text-[var(--color-text)]">{group.value ?? "undefined"}</code>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FlagInfoCard({ info }: { info: FlagInfo }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex items-center gap-2">
        <Badge variant={info.enabled ? "success" : "soft"}>/{info.flag}</Badge>
        <p className="text-sm font-black text-[var(--color-text)]">{info.label}</p>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">{info.description}</p>
    </div>
  );
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function RegexTesterClient() {
  const [pattern, setPattern] = useState(DEFAULT_PATTERN);
  const [flags, setFlags] = useState(DEFAULT_FLAGS);
  const [testText, setTestText] = useState(SAMPLE_TEXT);
  const [replacement, setReplacement] = useState(DEFAULT_REPLACEMENT);
  const [activeTab, setActiveTab] = useState<RegexTab>("test");

  const buildResult = useMemo(() => buildRegex(pattern, flags), [pattern, flags]);
  const error = buildResult instanceof RegExp ? null : buildResult.message;
  const isTextTooLarge = testText.length > REGEX_INPUT_LIMIT;
  const isPatternTooLarge = pattern.length > REGEX_PATTERN_LIMIT;
  const isReplacementTooLarge = replacement.length > REGEX_REPLACEMENT_LIMIT;

  const matches = useMemo(() => {
    if (error || isTextTooLarge || isPatternTooLarge) return [];
    return findMatches(pattern, flags, testText);
  }, [error, flags, isPatternTooLarge, isTextTooLarge, pattern, testText]);

  const replacedOutput = useMemo(() => {
    if (error || isTextTooLarge || isPatternTooLarge || isReplacementTooLarge) return "";
    return replaceMatches(pattern, flags, testText, replacement);
  }, [error, flags, isPatternTooLarge, isReplacementTooLarge, isTextTooLarge, pattern, replacement, testText]);

  const flagInfo = useMemo(() => explainFlags(flags), [flags]);
  const words = useMemo(() => countWords(testText), [testText]);
  const highlightedHtml = useMemo(() => escapeHtml(testText), [testText]);

  function toggleFlag(flag: RegexFlag) {
    setFlags((current) => {
      if (current.includes(flag)) return current.replace(flag, "");
      return `${current}${flag}`;
    });
  }

  function loadExample(example: RegexExample) {
    setPattern(example.pattern);
    setFlags(example.flags);
    setTestText(example.text);
    setReplacement(example.replacement);
    setActiveTab("test");
  }

  function clearAll() {
    setPattern("");
    setFlags("g");
    setTestText("");
    setReplacement("");
  }

  const patternControls = (
    <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[var(--color-text)]">Regex Tester</h2>
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="h-3 w-3" aria-hidden /> Browser-only
            </Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Test JavaScript regular expressions, inspect captures, and preview replacements locally.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => loadExample(REGEX_EXAMPLES[0])} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Load sample
          </Button>
          <Button variant="secondary" onClick={clearAll} leftIcon={<Trash2 className="h-4 w-4" />}>
            Clear
          </Button>
        </div>
      </div>

      <Field label="Pattern" description={`JavaScript regex pattern, up to ${REGEX_PATTERN_LIMIT.toLocaleString()} characters.`}>
        <div className="flex items-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-[var(--color-primary)]">
          <span className="px-3 font-mono text-xl font-black text-[var(--color-text-soft)]">/</span>
          <Input
            value={pattern}
            onChange={(event) => setPattern(safeSlice(event.target.value, REGEX_PATTERN_LIMIT))}
            placeholder="Enter pattern, for example: (?<id>\\d+)"
            className="border-0 bg-transparent font-mono shadow-none focus-visible:ring-0"
            aria-label="Regular expression pattern"
          />
          <span className="px-3 font-mono text-xl font-black text-[var(--color-text-soft)]">/</span>
          <Input
            value={flags}
            onChange={(event) => setFlags(event.target.value.replace(/[^gimsuyd]/g, "").slice(0, 7))}
            placeholder="gim"
            className="w-28 border-0 bg-transparent font-mono shadow-none focus-visible:ring-0"
            aria-label="Regular expression flags"
          />
        </div>
      </Field>

      <div className="flex flex-wrap gap-2">
        {FLAG_OPTIONS.map((option) => (
          <FlagToggle key={option.flag} flag={option.flag} label={option.label} enabled={flags.includes(option.flag)} onToggle={toggleFlag} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {error ? <Badge variant="danger">Invalid regex</Badge> : <Badge variant="success">Valid regex</Badge>}
        <Badge variant="soft">{matches.length.toLocaleString()} matches</Badge>
        <Badge variant="soft">{words.toLocaleString()} words</Badge>
        <Badge variant="soft">{testText.length.toLocaleString()} characters</Badge>
      </div>
    </div>
  );

  const editorPanel = (
    <Field label="Test text" description={`Paste up to ${REGEX_INPUT_LIMIT.toLocaleString()} characters to test against.`}>
      <Textarea
        value={testText}
        onChange={(event) => setTestText(safeSlice(event.target.value, REGEX_INPUT_LIMIT))}
        placeholder="Paste text to test your regular expression..."
        className="min-h-[420px] font-mono text-sm leading-6"
      />
    </Field>
  );

  const previewPanel = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text-soft)]">Highlighted preview</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Matches are rendered below the editor so the input stays easy to edit.</p>
        </div>
        <CopyButton text={testText} disabled={!testText} variant="secondary">Copy text</CopyButton>
      </div>
      <div className="min-h-[420px] overflow-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
        <HighlightedText text={testText} matches={matches} />
      </div>
      <span className="sr-only" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
    </div>
  );

  const matchesPanel = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text-soft)]">Match results</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Full matches, ranges, capture groups, and named groups.</p>
        </div>
        <Badge variant={matches.length ? "success" : "soft"}>{matches.length.toLocaleString()} found</Badge>
      </div>
      {matches.length ? (
        <div className="max-h-[540px] space-y-3 overflow-auto pr-1">
          {matches.map((match, index) => (
            <MatchCard key={`${match.index}-${match.endIndex}-${index}`} match={match} index={index} />
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <Search className="mx-auto h-8 w-8 text-[var(--color-text-soft)]" aria-hidden />
          <p className="mt-3 text-sm font-bold text-[var(--color-text)]">No matches</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Adjust the pattern, flags, or sample text to find results.</p>
        </div>
      )}
    </div>
  );

  const replacementPanel = (
    <div className="space-y-4">
      <Field label="Replacement" description={`Use $&, $1, $2, or $<name>. Limit ${REGEX_REPLACEMENT_LIMIT.toLocaleString()} characters.`}>
        <Input
          value={replacement}
          onChange={(event) => setReplacement(safeSlice(event.target.value, REGEX_REPLACEMENT_LIMIT))}
          placeholder="Replacement text"
          className="font-mono"
        />
      </Field>
      <Field label="Replacement preview" description="Preview how JavaScript String.replace will transform the current text.">
        <Textarea readOnly value={replacedOutput} placeholder="Replacement output will appear here." className="min-h-[320px] font-mono text-sm leading-6" />
        <div className="flex flex-wrap gap-2">
          <CopyButton text={replacedOutput} disabled={!replacedOutput}>Copy replaced output</CopyButton>
          <Button variant="secondary" onClick={() => downloadFile("darma-regex-replacement.txt", replacedOutput, "text/plain")} disabled={!replacedOutput}>
            Download .txt
          </Button>
        </div>
      </Field>
    </div>
  );

  return (
    <div className="space-y-6">
      {patternControls}

      {error ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          <strong>Regex error:</strong> {error}
        </div>
      ) : null}
      {isTextTooLarge ? (
        <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Test text is over the {REGEX_INPUT_LIMIT.toLocaleString()} character limit. Shorten it to resume matching.
        </div>
      ) : null}
      {isReplacementTooLarge ? (
        <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Replacement text is over the {REGEX_REPLACEMENT_LIMIT.toLocaleString()} character limit.
        </div>
      ) : null}

      <div className="block lg:hidden">
        <Tabs items={TAB_ITEMS} value={activeTab} onChange={(value) => setActiveTab(value as RegexTab)} ariaLabel="Regex tester panels" />
        <div className="mt-4">
          {activeTab === "test" ? <div className="space-y-4">{editorPanel}{previewPanel}</div> : null}
          {activeTab === "matches" ? matchesPanel : null}
          {activeTab === "replace" ? replacementPanel : null}
        </div>
      </div>

      <div className="hidden gap-5 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="space-y-5">
          {editorPanel}
          {replacementPanel}
        </div>
        <div className="space-y-5">
          {previewPanel}
          {matchesPanel}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-[var(--color-text-soft)]" aria-hidden />
            <h3 className="text-base font-black text-[var(--color-text)]">Common examples</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {REGEX_EXAMPLES.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => loadExample(example)}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-soft)]"
              >
                <span className="block text-sm font-black text-[var(--color-text)]">{example.label}</span>
                <code className="mt-2 block break-all rounded-[var(--radius-sm)] bg-[var(--color-bg-soft)] p-2 font-mono text-xs text-[var(--color-text-muted)]">/{example.pattern}/{example.flags}</code>
                <span className="mt-2 block text-xs leading-5 text-[var(--color-text-muted)]">{example.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4">
          <h3 className="text-base font-black text-[var(--color-text)]">Flags and quick cheatsheet</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {flagInfo.map((info) => <FlagInfoCard key={info.flag} info={info} />)}
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <p className="text-sm font-black text-[var(--color-text)]">Regex tokens</p>
            <dl className="mt-2 space-y-2">
              {CHEATSHEET.map((item) => (
                <div key={item.token} className="grid grid-cols-[92px_1fr] gap-2 text-xs leading-5">
                  <dt><code className="rounded bg-[var(--color-bg-soft)] px-1.5 py-0.5 font-mono font-bold text-[var(--color-text)]">{item.token}</code></dt>
                  <dd className="text-[var(--color-text-muted)]">{item.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
