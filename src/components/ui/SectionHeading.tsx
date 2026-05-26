export default function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--color-text-primary)]">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
