export default function Article() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Turn finished source into a repeatable code video</h2>
        <p>Darma Code Video Generator starts from the real HTML, CSS, and JavaScript files you already built. It creates a deterministic teaching timeline, replays the source inside a VS Code-style editor, and keeps a sandboxed browser preview synchronized with the completed parts of the project.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">A practical browser-local workflow</h2>
        <ol className="list-decimal space-y-2 pl-5"><li>Upload a small ZIP or select the HTML, CSS, and JavaScript files directly.</li><li>Choose YouTube or Shorts format, the stage layout, editor theme, and typing rhythm.</li><li>Review the generated timeline and edit the final source when a teaching step needs improvement.</li><li>Play the sequence, then use Record &amp; export video and select the current Darma tab.</li><li>Export the production ZIP for the timeline, captions, voice-over notes, and original source.</li></ol>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Start from a starter project that matches the lesson</h2>
        <p>The starter picker is grouped by what each project demonstrates: Motion for loaders, shimmer, and pure-CSS title effects; Interface for pricing, profile, button, and dashboard tiles; Interaction for counters, tabs, theme switches, count-ups, and a mini todo list; Layout for hero sections and responsive navigation. Load the closest one, record it as-is, or edit the source before generating the timeline.</p>
        <p>Every starter is deliberately short. The timeline types each character, so a compact file produces a watchable clip while a long file produces a slow recording. When you bring your own project, trim it to the part the lesson is actually about.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Why the export asks to capture a tab</h2>
        <p>Browsers do not allow a website to silently record another tab or the whole screen. Darma uses the standard tab-capture permission, crops only the clean production stage, and records that crop into an exact 16:9 or 9:16 canvas. MP4 is used when the browser exposes a compatible encoder; otherwise the tool safely exports WebM.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Privacy and first-release boundaries</h2>
        <p>Project files, generated timelines, preview code, captions, and recording data remain in the browser. The first release does not require an OpenAI, Claude, rendering, or storage API. It intentionally targets small HTML, CSS, and JavaScript projects; framework compilation and dependency installation need a separate secure execution architecture.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Frequently asked questions</h2>
        <div><h3 className="font-bold text-[var(--color-text-primary)]">Does the tool generate or rewrite my code with AI?</h3><p>No. The current version preserves the source you provide and builds the timeline locally. An optional AI director can be added later without making it a requirement for video export.</p></div>
        <div><h3 className="font-bold text-[var(--color-text-primary)]">Why can the exported file be WebM instead of MP4?</h3><p>The available encoder depends on the browser and operating system. Darma checks for MP4/H.264 support first, then falls back to modern WebM codecs instead of failing the export.</p></div>
        <div><h3 className="font-bold text-[var(--color-text-primary)]">Is the finished-project reveal part of the timeline?</h3><p>Yes. It is a deterministic opening step, followed by the project rebuild and a final result hold.</p></div>
      </section>
    </div>
  );
}
