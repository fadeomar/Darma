import { ToolArticleSection } from "@/features/tools/content/ToolArticleSection";
import { ToolFaq } from "@/features/tools/content/ToolFaq";

export default function Article() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-secondary)]">
      <ToolArticleSection title="What you can create with this tool">
        <p>A complete icon package serves browsers, saved home-screen shortcuts, and installable web apps—not just the tiny image in a browser tab.</p>
        <ul className="grid gap-x-6 pl-5 sm:grid-cols-2 [&>li]:list-disc">
          <li>favicon.ico and PNG favicons</li>
          <li>Apple touch icons</li>
          <li>PWA and maskable icons</li>
          <li>site.webmanifest</li>
          <li>browserconfig.xml where supported</li>
          <li>HTML head and Next.js snippets</li>
          <li>README and setup notes</li>
        </ul>
      </ToolArticleSection>

      <ToolArticleSection title="Input modes explained">
        <div className="grid gap-3 sm:grid-cols-2">
          <p><strong>Image:</strong> best for an existing logo or finished artwork. A large square PNG, WebP, or JPEG usually produces the cleanest result.</p>
          <p><strong>SVG:</strong> best for sharp vector artwork that must remain crisp at every generated size.</p>
          <p><strong>Text:</strong> best for initials, short brand marks, or compact labels with a controlled font and weight.</p>
          <p><strong>Emoji:</strong> best for playful icons, internal tools, and quick prototypes. Simple silhouettes survive small sizes best.</p>
        </div>
      </ToolArticleSection>

      <ToolArticleSection title="Recommended workflow">
        <ol className="space-y-1 pl-5 [&>li]:list-decimal">
          <li>Start with a square image or SVG when possible and keep important artwork centered.</li>
          <li>Add enough padding to protect artwork when adaptive launchers crop maskable icons.</li>
          <li>Check the 16px, 32px, and home-screen previews before exporting.</li>
          <li>Choose the export pack and install snippet that match your project.</li>
          <li>Download the ZIP, preserve its folder structure, and place the files in the appropriate public or app folder.</li>
        </ol>
      </ToolArticleSection>

      <ToolArticleSection title="Web, iOS, Android, and PWA icons">
        <p><strong>Browser favicons</strong> identify a page in tabs, bookmarks, and some search results. <strong>Apple touch icons</strong> appear when someone saves a site to an iPhone or iPad home screen.</p>
        <p><strong>PWA icons</strong> are referenced by the web manifest for installation and launch surfaces. Android launchers may crop a <strong>maskable icon</strong> into a circle, squircle, or another device shape, which is why its central safe area matters.</p>
        <p>Multiple sizes are needed because a 16×16 browser tab and a 512×512 app launcher have very different detail and resolution requirements.</p>
      </ToolArticleSection>

      <ToolArticleSection title="Next.js App Router setup">
        <p>Next.js supports file-based icon metadata in the <code>app</code> or <code>src/app</code> directory, including <code>favicon.ico</code>, <code>icon.png</code>, and <code>apple-icon.png</code>. The generated Next.js pack follows those conventions.</p>
        <p>Projects can also keep assets such as manifest icons in <code>public</code>—for example <code>public/icon-192.png</code>—and reference them from a manifest or from metadata in <code>app/layout.tsx</code>. Use the generated snippet as a starting point and match its paths to your chosen folder structure.</p>
      </ToolArticleSection>

      <ToolArticleSection title="Privacy">
        <p>Icon rendering, package generation, and validation run locally in your browser. Uploaded artwork is not sent to a server by this tool.</p>
      </ToolArticleSection>

      <ToolFaq
        items={[
          { question: "My icon looks cropped. What should I change?", answer: "Switch crop mode to Contain, reduce Scale, or increase Padding. Keep important artwork away from the outer edges, especially for maskable icons." },
          { question: "Why does my favicon look blurry?", answer: "Start with a sharp SVG or a square image at least 512×512. Also simplify fine details and inspect the real 16px and 32px previews before exporting." },
          { question: "Why does a transparent background look wrong on mobile?", answer: "Some mobile and launcher surfaces supply their own background or expect an opaque icon. Use a solid background for more predictable Apple, Android, and PWA results." },
          { question: "Why is my Apple icon not updating?", answer: "Confirm the apple-touch-icon path, remove and add the home-screen shortcut again, and allow for aggressive device caching." },
          { question: "Why does the browser still show my old favicon?", answer: "Favicons are cached aggressively. Verify the deployed URL, clear site data, try a private window, or temporarily use a cache-busting filename while testing." },
          { question: "Which files should I upload to my project?", answer: "Use the files in your selected export pack. A typical site needs favicon.ico, small PNG favicons, an Apple touch icon, 192px and 512px icons, the manifest, and the matching HTML or framework setup." },
          { question: "Why do I need manifest icons?", answer: "The web manifest tells browsers which icons to use for PWA installation, app launchers, and other installed experiences. It commonly references 192×192 and 512×512 images plus maskable variants." },
        ]}
      />
    </div>
  );
}
