export default function Article() {
  return (
    <div className="space-y-5 text-sm leading-7 text-[var(--color-text-secondary)]">
      <p>
        TTS Studio turns text into downloadable WAV speech with Piper neural voices. Preview a small sample before
        downloading a model, cache the voice locally, tune speaking speed and loudness, generate speech on-device,
        then preview and export the final WAV.
      </p>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">How local TTS works</h3>
        <p className="mt-2">
          Darma runs Piper and ONNX speech inference inside a browser Web Worker instead of sending your text to a
          Darma speech server. The worker keeps the heavier speech work away from the page&apos;s main UI thread while
          your text and generated audio stay in the browser.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Preview before a large download</h3>
        <p className="mt-2">
          Many Piper voices publish a small sample MP3. TTS Studio can play that public sample before you download
          the full ONNX voice model, so you can compare voices without spending tens of megabytes on every option.
          A sample is prerecorded by the voice publisher; your text is never sent to create it. Some voices may not
          provide a sample, in which case the tool marks preview as unavailable.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Voice downloads and storage</h3>
        <p className="mt-2">
          Piper voice models are larger files, so TTS Studio asks you to download a voice explicitly before local
          generation. The exact model size is shown in the voice library. Downloaded voices are verified and cached
          in this site&apos;s browser storage for reuse on later visits. You can remove them from the tool; clearing site
          data or browser storage cleanup can also remove cached voices.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Voice controls</h3>
        <p className="mt-2">
          Speaking speed and voice variation are applied to Piper&apos;s local inference controls. Output volume and
          optional loudness normalization are applied to the generated PCM WAV inside the worker, so the audio you
          hear and the file you download use the same settings. Quality is still a property of the selected model:
          lower-quality/smaller models are usually the better choice when local generation speed matters most.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Privacy and network activity</h3>
        <p className="mt-2">
          Your text is synthesized locally and the resulting WAV is created in the browser. Network requests are
          still required to public asset hosts when Piper runtime files, the voice catalog, a sample preview, or a
          voice model need to be downloaded, so first use is not an offline operation. Those asset requests do not
          contain the text you ask Darma to synthesize.
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
          <li>Compare voice samples before downloading full local models.</li>
          <li>Tune speaking speed and loudness without sending text to a paid cloud speech provider.</li>
          <li>Export a standard WAV file for editing, demos, learning material, or local workflows.</li>
        </ul>
      </div>

      <p>
        The first generation can take longer while the browser initializes the local speech runtime. After a voice
        is downloaded, future uses can reuse the locally cached model instead of downloading it again.
      </p>
    </div>
  );
}
