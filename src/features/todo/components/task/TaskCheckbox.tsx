"use client";

type Props = {
  checked: boolean;
  onChange: () => void;
  label: string;
};

export function TaskCheckbox({ checked, onChange, label }: Props) {
  return (
    <label className="flex cursor-pointer items-center">
      <input
        type="checkbox"
        className="size-4 rounded border-[var(--todo-border)] text-[var(--todo-primary)] focus:ring-[var(--todo-primary)]"
        checked={checked}
        onChange={(e) => {
          e.stopPropagation();
          onChange();
        }}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Mark "${label}" as ${checked ? "incomplete" : "complete"}`}
      />
    </label>
  );
}
