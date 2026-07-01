import { Card } from "@/components/ui";

export default function Article() {
  return (
    <Card as="article" variant="article" padding="lg" className="mx-auto max-w-[var(--container-wide)]">
      <div className="space-y-7 text-sm leading-7 text-[var(--color-text-muted)]">
        <section>
          <h2 className="text-xl font-bold text-[var(--color-text)]">What are CSS loaders?</h2>
          <p className="mt-3">
            CSS loaders are small animated UI patterns that communicate progress while an interface is waiting for data, saving a form, uploading a file, or preparing a new screen. This gallery keeps each loader as copy-ready HTML, CSS, React, and optional Tailwind snippets so developers can preview the animation first and then copy the format that fits their project.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Spinner vs skeleton loading</h2>
          <p className="mt-3">
            Spinners are best for short, uncertain waits such as saving, refreshing, or authenticating. Skeleton loading states are better when the page layout is known and content is still arriving, because they preserve the shape of the final interface and reduce perceived layout movement. The category filters let you switch between compact spinners, dots, bars, pulse effects, and skeleton-style patterns depending on the loading state you need.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-text)]">How to use CSS loaders in React</h2>
          <p className="mt-3">
            Open a loader, choose the React tab, and copy the generated component. For app-level reuse, place the component in your UI folder, import the CSS once, and render it inside buttons, cards, overlays, or Suspense fallbacks. The modal also includes button, card, and overlay preview modes so you can test the loader in common React loading-state layouts before copying it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-text)]">How to customize loader color, size, and speed</h2>
          <p className="mt-3">
            The playground uses CSS variables for customization: <code>--loader-color</code>, <code>--loader-secondary-color</code>, <code>--loader-size</code>, <code>--loader-speed</code>, and <code>--loader-bg</code>. Adjust the controls in the modal and the copied CSS will include the current values, so the snippet you paste matches the preview you approved.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Open Pack 2026 additions</h2>
          <p className="mt-3">
            The gallery now includes an <strong>Open Pack 2026</strong> set with 20 additional non-duplicate loader patterns inspired by open-source CSS loader families such as loading.io, Loaders.css, SpinKit, Epic Spinners, and Whirl. Search for <code>open-pack-2026</code> to review the whole set, then open any loader to copy HTML, CSS, React, or the customized output.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Accessibility tips for loading states</h2>
          <p className="mt-3">
            Loading animations should support the user instead of distracting them. Use clear text such as “Saving…” or “Loading dashboard…” beside important loaders, avoid endless blocking overlays when partial content can render, keep color contrast readable on light and dark backgrounds, and respect reduced-motion preferences. This gallery includes a pause control and reduced-motion CSS so the page remains usable for motion-sensitive users.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Source and performance notes</h2>
          <p className="mt-3">
            Source loaders live under grouped JSON folders in <code>data/source/loaders</code>, while <code>data/generated</code> is owned by the generator and should not be edited manually. The page loads lightweight index metadata first, lazy-loads preview chunks as needed, and fetches full detail JSON only when the modal opens. Source CSS is validated and normalized to prevent global selectors, unsafe imports, unscoped keyframes, or card-to-card CSS leakage.
          </p>
        </section>
      </div>
    </Card>
  );
}
