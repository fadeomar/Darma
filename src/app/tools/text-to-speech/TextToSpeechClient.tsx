"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MAX_TEXT_LENGTH = 5_000;

type Voice = {
  id: string;
  language: {
    code?: string;
    family?: string;
    region?: string;
    name_native?: string;
    name_english?: string;
    country_english?: string;
  } | null;
  gender: string | null;
};

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: string;
  };
};

function formatVoiceLabel(voice: Voice) {
  const languageName = voice.language?.name_english || voice.language?.name_native || voice.language?.code;
  const country = voice.language?.country_english;
  const gender = voice.gender ? ` · ${voice.gender}` : "";
  const locale = languageName ? `${languageName}${country ? ` (${country})` : ""}` : "Unknown language";
  return `${voice.id} · ${locale}${gender}`;
}

function safeFilePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]+/g, "")
    .slice(0, 60);
}

function makeDownloadName(voiceId: string) {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(
    2,
    "0",
  )}`;

  return `darma_tts_${safeFilePart(voiceId)}_${stamp}.wav`;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as ApiErrorBody;
    return data.error?.message || fallback;
  } catch {
    return fallback;
  }
}

export default function TextToSpeechClient() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [text, setText] = useState("Hello from Darma TTS Studio!");
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("darma-tts.wav");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const voicesAbortRef = useRef<AbortController | null>(null);
  const synthAbortRef = useRef<AbortController | null>(null);

  const trimmedLength = text.trim().length;
  const charactersRemaining = MAX_TEXT_LENGTH - text.length;
  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.id === selectedVoiceId) ?? null,
    [selectedVoiceId, voices],
  );

  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const loadVoices = useCallback(async () => {
    // A rapid second "Refresh voices" makes the first response irrelevant.
    voicesAbortRef.current?.abort();
    const controller = new AbortController();
    voicesAbortRef.current = controller;

    setLoadingVoices(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/tools/text-to-speech/voices", {
        cache: "no-store",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, `Failed to load voices (${response.status}).`));
      }

      const data = (await response.json()) as { voices?: Voice[] } | Voice[];
      const list = Array.isArray(data) ? data : Array.isArray(data.voices) ? data.voices : [];

      setVoices(list);
      setSelectedVoiceId((current) => {
        if (current && list.some((voice) => voice.id === current)) return current;
        return list[0]?.id ?? "";
      });

      if (list.length === 0) {
        setError("The TTS service is online, but no Piper voices are installed.");
      }
    } catch (caught) {
      // A deliberate abort (unmount, or a newer refresh) is not a user-facing error.
      if (isAbortError(caught)) return;
      setVoices([]);
      setSelectedVoiceId("");
      setError(caught instanceof Error ? caught.message : "Failed to load voices.");
    } finally {
      if (voicesAbortRef.current === controller) {
        voicesAbortRef.current = null;
        setLoadingVoices(false);
      }
    }
  }, []);

  const canGenerate =
    !loadingVoices &&
    !isGenerating &&
    Boolean(selectedVoiceId) &&
    trimmedLength > 0 &&
    text.length <= MAX_TEXT_LENGTH;

  const generate = useCallback(async () => {
    if (!canGenerate) return;

    // Drop any synthesis that is now obsolete before starting the next one.
    synthAbortRef.current?.abort();
    const controller = new AbortController();
    synthAbortRef.current = controller;

    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    revokeAudioUrl();
    setAudioUrl(null);

    try {
      const response = await fetch("/api/tools/text-to-speech/synthesize", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Accept: "audio/wav, application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, voiceId: selectedVoiceId }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, `Speech generation failed (${response.status}).`));
      }

      const blob = await response.blob();
      if (!blob.size) throw new Error("The TTS service returned an empty audio file.");

      const nextUrl = URL.createObjectURL(blob);

      // The request can outlive the page, or be superseded by a newer one:
      // revoke immediately rather than stranding an unreachable object URL.
      if (!mountedRef.current || synthAbortRef.current !== controller) {
        URL.revokeObjectURL(nextUrl);
        return;
      }

      audioUrlRef.current = nextUrl;
      setAudioUrl(nextUrl);
      setDownloadName(makeDownloadName(selectedVoiceId));
      setSuccess("Speech generated successfully.");

      window.setTimeout(() => {
        void audioRef.current?.play().catch(() => undefined);
      }, 0);
    } catch (caught) {
      if (isAbortError(caught)) return;
      setError(caught instanceof Error ? caught.message : "Speech generation failed.");
    } finally {
      // Only the newest request owns the button state; a superseded one must
      // not clear the spinner the request that replaced it just set.
      if (synthAbortRef.current === controller) {
        synthAbortRef.current = null;
        setIsGenerating(false);
      }
    }
  }, [canGenerate, revokeAudioUrl, selectedVoiceId, text]);

  useEffect(() => {
    mountedRef.current = true;
    void loadVoices();

    return () => {
      mountedRef.current = false;
      voicesAbortRef.current?.abort();
      synthAbortRef.current?.abort();
      revokeAudioUrl();
    };
  }, [loadVoices, revokeAudioUrl]);

  return (
    <div className="tts-studio">
      <div className="tts-studio__status-strip" aria-label="TTS Studio capabilities">
        <span>Piper neural voices</span>
        <span>WAV export</span>
        <span>Server-assisted</span>
        <span>No paid TTS API required</span>
      </div>

      <div className="tts-studio__grid">
        <section className="tts-panel tts-panel--input" aria-labelledby="tts-input-title">
          <div className="tts-panel__header">
            <div>
              <p className="tts-eyebrow">Input</p>
              <h2 id="tts-input-title">Generate speech</h2>
            </div>
            <button className="tts-button tts-button--quiet" type="button" onClick={() => void loadVoices()} disabled={loadingVoices}>
              {loadingVoices ? "Loading voices…" : "Refresh voices"}
            </button>
          </div>

          <div className="tts-panel__body">
            <div className="tts-field">
              <label htmlFor="tts-voice">Voice</label>
              <select
                id="tts-voice"
                value={selectedVoiceId}
                onChange={(event) => setSelectedVoiceId(event.target.value)}
                disabled={loadingVoices || voices.length === 0}
              >
                {voices.length === 0 ? (
                  <option value="">{loadingVoices ? "Loading voices…" : "No voices available"}</option>
                ) : (
                  voices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {formatVoiceLabel(voice)}
                    </option>
                  ))
                )}
              </select>
              <p className="tts-help">
                {selectedVoice ? `Selected voice: ${selectedVoice.id}` : "Start the Piper service and install at least one voice."}
              </p>
            </div>

            <div className="tts-field">
              <div className="tts-field__label-row">
                <label htmlFor="tts-text">Text</label>
                <span className={charactersRemaining < 0 ? "tts-count tts-count--error" : "tts-count"}>
                  {text.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
                </span>
              </div>
              <textarea
                id="tts-text"
                value={text}
                maxLength={MAX_TEXT_LENGTH + 500}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                    event.preventDefault();
                    void generate();
                  }
                }}
                placeholder="Paste narration, lesson text, accessibility copy, or any passage you want to hear."
                aria-describedby="tts-text-help"
                aria-invalid={charactersRemaining < 0 || undefined}
              />
              <p id="tts-text-help" className={charactersRemaining < 0 ? "tts-help tts-help--error" : "tts-help"}>
                {charactersRemaining < 0
                  ? `Remove ${Math.abs(charactersRemaining).toLocaleString()} ${Math.abs(charactersRemaining) === 1 ? "character" : "characters"} — the limit is ${MAX_TEXT_LENGTH.toLocaleString()}.`
                  : "Press Ctrl/⌘ + Enter to generate. Longer text takes more time to synthesize."}
              </p>
            </div>

            <div className="tts-actions">
              <button
                className="tts-button tts-button--primary"
                type="button"
                onClick={() => void generate()}
                disabled={!canGenerate}
                aria-busy={isGenerating}
              >
                {isGenerating ? "Generating speech…" : "Generate speech"}
              </button>
              <button
                className="tts-button tts-button--quiet"
                type="button"
                onClick={() => {
                  setText("");
                  setError(null);
                  setSuccess(null);
                }}
                disabled={isGenerating || text.length === 0}
              >
                Clear text
              </button>
            </div>

            <div className="tts-live-region" aria-live="polite" aria-atomic="true">
              {error ? <div className="tts-alert tts-alert--error">{error}</div> : null}
              {success ? <div className="tts-alert tts-alert--success">{success}</div> : null}
            </div>
          </div>
        </section>

        <section className="tts-panel tts-panel--output" aria-labelledby="tts-output-title">
          <div className="tts-panel__header">
            <div>
              <p className="tts-eyebrow">Output</p>
              <h2 id="tts-output-title">Audio preview</h2>
            </div>
          </div>

          <div className="tts-panel__body tts-output">
            {audioUrl ? (
              <>
                <div className="tts-output__ready">
                  <span className="tts-output__dot" aria-hidden="true" />
                  WAV ready
                </div>
                <audio ref={audioRef} controls src={audioUrl} className="tts-audio" />
                <a className="tts-button tts-button--primary tts-button--download" href={audioUrl} download={downloadName}>
                  Download WAV
                </a>
                <p className="tts-file-name" title={downloadName}>{downloadName}</p>
              </>
            ) : (
              <div className="tts-empty">
                <div className="tts-empty__visual" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <h3>Your audio will appear here</h3>
                <p>Choose a voice, enter some text, and generate a WAV file. Nothing is stored in this browser after you leave the page.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="tts-note">
        <strong>Privacy note:</strong> this Darma integration is server-assisted. Your text is sent to the configured Darma TTS service for synthesis; Piper itself does not require a paid cloud speech API.
      </div>
    </div>
  );
}
