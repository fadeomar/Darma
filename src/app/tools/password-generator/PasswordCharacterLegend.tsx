import styles from "./PasswordCharacterLegend.module.css";
import type { AnnotatedChar, CharType } from "./types";

const previewCharacterClass: Record<CharType, string> = {
  lower: styles.passwordPreviewLower,
  upper: styles.passwordPreviewUpper,
  digit: styles.passwordPreviewDigit,
  symbol: styles.passwordPreviewSymbol,
};

const legendCharacterClass: Record<CharType, string> = {
  lower: "text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]",
  upper: "text-[var(--color-primary)]",
  digit: "text-[var(--color-warning-text)]",
  symbol: "text-[var(--color-accent)]",
};

const legendItems: Array<{ type: CharType; label: string; example: string }> = [
  { type: "lower", label: "lowercase", example: "a-z" },
  { type: "upper", label: "uppercase", example: "A-Z" },
  { type: "digit", label: "numbers", example: "0-9" },
  { type: "symbol", label: "symbols", example: "!@#" },
];

export function AnnotatedPassword({ characters }: { characters: AnnotatedChar[] }) {
  if (!characters.length) {
    return <span className="text-[var(--color-text-tertiary)]">No password generated</span>;
  }

  return (
    <span aria-label="Generated password" className={styles.passwordPreview}>
      {characters.map((item, index) => (
        <span key={`${item.char}-${index}`} className={previewCharacterClass[item.type]}>
          {item.char}
        </span>
      ))}
    </span>
  );
}

export function PasswordCharacterLegend() {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Character colour legend">
      {legendItems.map((item) => (
        <span
          key={item.type}
          className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)]"
        >
          <span className={`font-mono text-sm font-black ${legendCharacterClass[item.type]}`} aria-hidden>
            {item.example}
          </span>
          {item.label}
        </span>
      ))}
    </div>
  );
}
