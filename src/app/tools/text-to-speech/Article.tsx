export default function Article() {
  return (
    <div className="space-y-5 text-sm leading-7 text-[var(--color-text-secondary)]">
      <p>
        TTS Studio turns text into downloadable WAV speech with Piper neural voices. Pick a voice, download
        its model once, generate speech locally, preview the audio in your browser, and export the WAV.
      </p>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">How local TTS works</h3>
        <p className="mt-2">
          Darma runs Piper and ONNX speech inference inside a browser Web Worker instead of sending your text
          to a Darma speech server. The worker keeps the heavier speech work away from the page&apos;s main UI
          thread while the generated audio stays in the browser.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Voice downloads and storage</h3>
        <p className="mt-2">
          Piper voice models are larger files, so TTS Studio asks you to download a voice explicitly before
          generation. The exact model size is shown in the voice library. Downloaded voices are cached in this
          site&apos;s browser storage and can be reused on later visits. You can remove them from the tool; clearing
          site data or browser storage cleanup can also remove cached voices.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Privacy and network activity</h3>
        <p className="mt-2">
          Your text is synthesized locally and the resulting WAV is created in the browser. Network requests are
          still required to public asset hosts when Piper runtime files, the voice catalog, or a voice model need
          to be downloaded, so first use is not an offline operation. Those asset requests do not contain the text
          you ask Darma to synthesize.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Voice licenses</h3>
        <p className="mt-2">
          The two starter voices use CC0 source datasets. Additional Piper voices can use different dataset
          licenses, so TTS Studio links to the selected voice&apos;s model card before you use an extra voice. Review
          that license for your intended use.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Good uses</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Create narration drafts for videos, lessons, prototypes, and accessibility checks.</li>
          <li>Compare voices without creating an account or sending text to a paid cloud speech provider.</li>
          <li>Export a standard WAV file for editing, demos, learning material, or local workflows.</li>
        </ul>
      </div>

      <p>
        The first generation can take longer while the browser initializes the local speech runtime. After a
        voice is downloaded, future uses can reuse the locally cached model instead of downloading it again.
      </p>
    </div>
  );
}
