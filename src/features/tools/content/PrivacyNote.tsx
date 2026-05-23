import { Badge } from "@/components/ui";

export function PrivacyNote({ children = "This tool is designed to run locally in your browser. Avoid pasting secrets into tools unless you understand how the data is handled." }: { children?: React.ReactNode }) {
  return (
    <aside className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4">
      <Badge variant="soft">Privacy note</Badge>
      <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">{children}</p>
    </aside>
  );
}
