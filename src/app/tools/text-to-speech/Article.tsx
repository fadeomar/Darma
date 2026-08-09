export default function Article() {
  return (
    <div className="space-y-5 text-sm leading-7 text-[var(--color-text-secondary)]">
      <p>
        TTS Studio converts text into WAV speech with Piper neural voices. Choose an available voice,
        write or paste a passage, generate the audio, listen in the browser, and download the result.
      </p>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">How the Darma integration works</h3>
        <p className="mt-2">
          Piper itself runs without a paid speech API. In Darma, synthesis is server-assisted: your text
          is sent to the TTS service configured by this Darma deployment, which runs Piper and streams the
          generated WAV back to the browser.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Good uses</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Create narration drafts for videos, lessons, demos, and accessibility checks.</li>
          <li>Compare installed Piper voices before committing to a narration voice.</li>
          <li>Generate a WAV file without creating an account or using a paid cloud TTS provider.</li>
        </ul>
      </div>

      <p>
        This tool is based on the open-source Piper TTS Studio project and keeps its core workflow while
        adapting the frontend and API boundary to Darma&apos;s Next.js tool architecture.
      </p>
    </div>
  );
}
