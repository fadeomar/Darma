import { TTS_FAQS } from "./content";

export default function Article() {
  return (
    <div className="space-y-5 text-sm leading-7 text-[var(--color-text-secondary)]">
      <p>
        Darma TTS Studio is a free text-to-speech tool for generating downloadable WAV speech with Piper neural
        voices directly in your browser. There is no sign-up, subscription, credit system, daily generation quota,
        or Darma-imposed word or character limit. Preview a voice, download its model once, tune the speech, and
        keep working without sending your text to a Darma TTS server.
      </p>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Free text to speech without sign up</h3>
        <p className="mt-2">
          Open the page and use it. Darma does not require an account, email address, paid plan, API key, or monthly
          speech credits. Any voice exposed by the catalog can be selected without a premium voice gate. The only
          larger first-use cost is downloading the Piper model that actually runs the voice on your device.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">No Darma character, word, or daily quota</h3>
        <p className="mt-2">
          TTS Studio does not stop you at an artificial 500, 1,000, or 5,000 character allowance. Longer passages
          are divided into sentence-sized chunks, synthesized sequentially in the local worker, and merged back into
          one WAV file. Very long text naturally takes more time and memory depending on your browser, device, voice
          quality, and speech settings, but Darma does not meter the text with credits or a product quota.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Private, client-side speech generation</h3>
        <p className="mt-2">
          Piper and ONNX inference run inside a browser Web Worker instead of a Darma speech backend. Your text and
          generated WAV stay on your device. Public runtime files, the voice catalog, voice models, and optional
          sample previews are still downloaded from public asset hosts when needed; those asset requests do not
          contain the text you ask Darma to synthesize.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Preview voices before downloading a model</h3>
        <p className="mt-2">
          Many Piper voices publish a small prerecorded sample. TTS Studio can play that sample before the larger
          ONNX model is downloaded, so you can compare voices first. If a publisher does not provide a sample, the
          tool marks preview as unavailable without blocking the actual voice download.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Speech pace, volume, variation, and normalization</h3>
        <p className="mt-2">
          Speech pace and voice variation are applied to Piper&apos;s local inference controls. Output volume and
          optional loudness normalization are applied to the final PCM WAV, so downloaded audio uses the same
          settings you preview. Pace is intentionally described as approximate because individual voice models do
          not all change duration by exactly the same ratio.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Session history without an account</h3>
        <p className="mt-2">
          Every successful generation is kept in the current tab as a private session-history item. Replay older
          results, download them again, restore their text and settings, or delete them without regenerating. This
          history uses browser memory only and disappears when the page reloads, the tab closes, or you clear the session.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Voice downloads and licenses</h3>
        <p className="mt-2">
          Voice models are cached in this site&apos;s browser storage for reuse. You can remove a downloaded voice at
          any time, and clearing site data may remove it as well. The two starter voices use CC0 source datasets;
          additional Piper voices can have different dataset licenses, so TTS Studio links to the selected model
          card for review.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Open-source and inspectable</h3>
        <p className="mt-2">
          Darma is an open-source project, so the browser-local TTS implementation can be inspected instead of
          requiring trust in a hidden speech backend. The tool still downloads public Piper/ONNX assets when needed,
          but the text-to-speech workflow itself does not depend on a Darma account or paid cloud speech service.
        </p>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Common uses</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Create voice-over drafts for videos, demos, presentations, and prototypes.</li>
          <li>Turn lessons, study notes, articles, and accessibility copy into speech.</li>
          <li>Compare neural voices before downloading larger local models.</li>
          <li>Generate longer narration without a Darma credit or character quota.</li>
          <li>Export standard WAV files for editing or reuse in other local workflows.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)]">Free TTS FAQ</h3>
        <div className="mt-3 space-y-4">
          {TTS_FAQS.map((item) => (
            <div key={item.question}>
              <h4 className="font-black text-[var(--color-text-primary)]">{item.question}</h4>
              <p className="mt-1">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
