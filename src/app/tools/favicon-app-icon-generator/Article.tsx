import { ToolArticleSection } from "@/features/tools/content/ToolArticleSection";
import { ToolFaq } from "@/features/tools/content/ToolFaq";

export default function Article() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-secondary)]">
      <ToolArticleSection title="What this favicon generator creates">
        <p>
          A favicon package is more than the tiny browser tab icon. Modern projects usually need a classic ICO fallback, PNG favicons, an Apple touch icon, PWA icons, a web manifest, and setup snippets that point to the correct files.
        </p>
        <p>
          This Darma tool creates those files locally in your browser from an uploaded image, pasted SVG, initials, or emoji. Nothing is uploaded to a server.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Favicon vs Apple icon vs PWA icon">
        <p>
          <strong>favicon.ico</strong> is the broad browser fallback. <strong>Apple touch icons</strong> are used when a page is saved to an iPhone or iPad home screen. <strong>PWA icons</strong> are referenced by the web manifest for install prompts and app launchers.
        </p>
        <p>
          For a practical modern setup, include favicon.ico, 32×32 and 48×48 PNG files, apple-touch-icon.png, 192×192 and 512×512 PNG files, and a manifest file.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Maskable icon safe area">
        <p>
          Maskable icons are designed for adaptive launchers that crop icons into different shapes. Keep important artwork near the center and use extra padding so corners and edges can be cropped safely.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Next.js App Router setup">
        <p>
          For Next.js App Router projects, place favicon.ico, icon.png, and apple-icon.png inside <code>src/app</code>. Keep site.webmanifest in <code>public</code> and link it from your metadata or layout when needed.
        </p>
      </ToolArticleSection>

      <ToolFaq
        items={[
          {
            question: "Should my source image be square?",
            answer: "Yes. A square 512×512 or larger source gives the cleanest result. Non-square images can still work, but the generator must contain or crop them.",
          },
          {
            question: "Do I need favicon.ico in 2026?",
            answer: "It is still useful as a broad fallback. PNG favicons are great, but favicon.ico remains a safe compatibility file.",
          },
          {
            question: "Should mobile app icons be transparent?",
            answer: "Usually no. A solid background tends to look more predictable on iOS, Android, and PWA install surfaces.",
          },
          {
            question: "Can I use this for a PWA?",
            answer: "Yes. Choose the PWA or Complete export pack to include multiple manifest icon sizes and maskable icons.",
          },
        ]}
      />
    </div>
  );
}
