import type { FlexDirection, FlexWrap } from "../types";

export function FlexAxisHelper({ direction, wrap }: { direction: FlexDirection; wrap: FlexWrap }) {
  const isRow = direction === "row" || direction === "row-reverse";
  const reverse = direction.endsWith("reverse");
  const main = isRow ? (reverse ? "horizontal, right to left" : "horizontal, left to right") : (reverse ? "vertical, bottom to top" : "vertical, top to bottom");
  const cross = isRow ? "vertical" : "horizontal";
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs leading-5 text-[var(--color-text-soft)]">
      <strong className="text-[var(--color-text)]">Main axis:</strong> {main}. <strong className="text-[var(--color-text)]">Cross axis:</strong> {cross}. {wrap === "nowrap" ? "Items stay on one line." : "Wrapping can create extra flex lines."}
    </div>
  );
}
