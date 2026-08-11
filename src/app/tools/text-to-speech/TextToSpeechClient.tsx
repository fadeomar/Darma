"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  disposePiper,
  downloadVoice,
  getPiperSupport,
  listVoices,
  PiperError,
  type PiperProgress,
  type PiperVoice,
  removeVoice,
  storedVoices,
  synthesize,
} from "./piper/piperClient";
import type { PiperStage } from "./piper/piperWorker";

const MAX_TEXT_LENGTH = 5_000;
const STARTER_VOICE_IDS = ["en_US-kathleen-low", "en_US-joe-medium"] as const;
const PIPER_VOICE_REPO_BASE = "https://huggingface.co/diffusionstudio/piper-voices/blob/main";

type Operation = "idle" | "downloading" | "removing" | "generating";

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

function voiceBytes(voice: PiperVoice | null) {
  if (!voice) return 0;
  return Object.entries(voice.files ?? {})
    .filter(([path]) => path.endsWith(".onnx") || path.endsWith(".onnx.json"))
    .reduce((total, [, file]) => total + (file.size_bytes || 0), 0);
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Size unavailable";
  const mb = bytes / 1024 / 1024;
  return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
}

/** Transferred-so-far counter: zero is a real value here, not a missing size. */
function formatTransferred(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  return formatBytes(bytes);
}

function formatLocale(voice: PiperVoice) {
  const language = voice.language?.name_english || voice.language?.name_native || voice.language?.code;
  const country = voice.language?.country_english;
  if (!language) return voice.language?.code || "Unknown language";
  return country && !language.toLowerCase().includes(country.toLowerCase())
    ? `${language} · ${country}`
    : language;
}

function voiceDisplayName(voice: PiperVoice) {
  const idTail = voice.key.split("-").slice(-2, -1)[0] || voice.key;
  const normalized = idTail.replace(/_/g, " ");
  return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}


function modelCardUrl(voice: PiperVoice) {
  const modelCard = Object.keys(voice.files ?? {}).find((path) => path.endsWith("MODEL_CARD"));
  return modelCard ? `${PIPER_VOICE_REPO_BASE}/${modelCard}` : null;
}

function isStarterVoice(voiceId: string): voiceId is (typeof STARTER_VOICE_IDS)[number] {
  return STARTER_VOICE_IDS.includes(voiceId as (typeof STARTER_VOICE_IDS)[number]);
}

function stageLabel(stage: PiperStage | null, operation: Operation) {
  if (operation === "downloading") {
    if (stage === "saving") return "Saving voice locally…";
    return "Downloading voice…";
  }
  if (operation === "generating") {
    if (stage === "loading") return "Loading local voice…";
    return "Generating speech locally…";
  }
  if (operation === "removing") return "Removing local voice…";
  return "";
}

function messageFromError(error: unknown, fallback: string) {
  if (error instanceof PiperError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export default function TextToSpeechClient() {
  const [support, setSupport] = useState<{ supported: boolean; reason?: string } | null>(null);
  const [voices, setVoices] = useState<PiperVoice[]>([]);
  const [storedVoiceIds, setStoredVoiceIds] = useState<Set<string>>(new Set());
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(STARTER_VOICE_IDS[0]);
  const [text, setText] = useState("Hello from Darma TTS Studio!");
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [operation, setOperation] = useState<Operation>("idle");
  const [stage, setStage] = useState<PiperStage | null>(null);
  const [progress, setProgress] = useState<PiperProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("darma-tts.wav");
  const [showAllVoices, setShowAllVoices] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const trimmedLength = text.trim().length;
  const charactersRemaining = MAX_TEXT_LENGTH - text.length;
  const busy = operation !== "idle";
  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.key === selectedVoiceId) ?? null,
    [selectedVoiceId, voices],
  );
  const selectedStored = storedVoiceIds.has(selectedVoiceId);

  const starterVoices = useMemo(() => {
    const starter = STARTER_VOICE_IDS.map((id) => voices.find((voice) => voice.key === id)).filter(
      (voice): voice is PiperVoice => Boolean(voice),
    );
    const storedExtras = voices.filter(
      (voice) => storedVoiceIds.has(voice.key) && !STARTER_VOICE_IDS.includes(voice.key as (typeof STARTER_VOICE_IDS)[number]),
    );
    return [...starter, ...storedExtras];
  }, [storedVoiceIds, voices]);

  const filteredVoices = useMemo(() => {
    const query = voiceQuery.trim().toLowerCase();
    if (!query) return voices;
    return voices.filter((voice) => {
      const haystack = [
        voice.key,
        voiceDisplayName(voice),
        voice.quality,
        voice.language?.code,
        voice.language?.name_english,
        voice.language?.name_native,
        voice.language?.country_english,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [voiceQuery, voices]);

  const progressPercent = useMemo(() => {
    if (!progress?.total) return null;
    return Math.max(0, Math.min(100, Math.round((progress.loaded / progress.total) * 100)));
  }, [progress]);

  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const resetMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const refreshLibrary = useCallback(async () => {
    const currentSupport = getPiperSupport();
    setSupport(currentSupport);
    if (!currentSupport.supported) {
      setLoadingVoices(false);
      setError(currentSupport.reason ?? "This browser cannot run local Piper speech generation.");
      return;
    }

    setLoadingVoices(true);
    resetMessages();
    try {
      const [voiceList, stored] = await Promise.all([listVoices(), storedVoices()]);
      if (!mountedRef.current) return;

      setVoices(voiceList);
      setStoredVoiceIds(new Set(stored));
      setSelectedVoiceId((current) => {
        if (current && voiceList.some((voice) => voice.key === current)) return current;
        return STARTER_VOICE_IDS.find((id) => voiceList.some((voice) => voice.key === id)) ?? voiceList[0]?.key ?? "";
      });
      if (voiceList.length === 0) setError("No Piper voices are available from the voice catalog.");
    } catch (caught) {
      if (!mountedRef.current) return;
      setVoices([]);
      setStoredVoiceIds(new Set());
      setError(messageFromError(caught, "Failed to load the Piper voice catalog."));
    } finally {
      if (mountedRef.current) setLoadingVoices(false);
    }
  }, [resetMessages]);

  const selectVoice = useCallback((voiceId: string) => {
    if (busy) return;
    setSelectedVoiceId(voiceId);
    setError(null);
    setSuccess(null);
  }, [busy]);

  const downloadSelectedVoice = useCallback(async () => {
    if (!selectedVoice || selectedStored || busy) return;

    setOperation("downloading");
    setStage("downloading");
    setProgress({ loaded: 0, total: voiceBytes(selectedVoice) });
    resetMessages();

    try {
      await downloadVoice(selectedVoice.key, (nextProgress) => {
        if (mountedRef.current) setProgress(nextProgress);
      });
      const stored = await storedVoices();
      if (!stored.includes(selectedVoice.key)) {
        throw new PiperError(
          "The voice downloaded but could not be verified in browser storage. Please try again.",
          "STORAGE_VERIFY",
        );
      }
      if (!mountedRef.current) return;
      setStoredVoiceIds(new Set(stored));
      setSuccess(`${voiceDisplayName(selectedVoice)} is downloaded and ready to use.`);
    } catch (caught) {
      if (!mountedRef.current) return;
      setError(messageFromError(caught, "Voice download failed."));
    } finally {
      if (mountedRef.current) {
        setOperation("idle");
        setStage(null);
        setProgress(null);
      }
    }
  }, [busy, resetMessages, selectedStored, selectedVoice]);

  const removeSelectedVoice = useCallback(async () => {
    if (!selectedVoice || !selectedStored || busy) return;

    setOperation("removing");
    setStage(null);
    resetMessages();
    try {
      await removeVoice(selectedVoice.key);
      const stored = await storedVoices();
      if (stored.includes(selectedVoice.key)) {
        throw new PiperError(
          "The voice could not be removed from browser storage. Please try again.",
          "STORAGE_VERIFY",
        );
      }
      if (!mountedRef.current) return;
      setStoredVoiceIds(new Set(stored));
      setSuccess(`${voiceDisplayName(selectedVoice)} was removed from this browser.`);
    } catch (caught) {
      if (!mountedRef.current) return;
      setError(messageFromError(caught, "Could not remove this voice."));
    } finally {
      if (mountedRef.current) setOperation("idle");
    }
  }, [busy, resetMessages, selectedStored, selectedVoice]);

  const canGenerate =
    support?.supported === true &&
    !loadingVoices &&
    !busy &&
    Boolean(selectedVoiceId) &&
    selectedStored &&
    trimmedLength > 0 &&
    text.length <= MAX_TEXT_LENGTH;

  const generate = useCallback(async () => {
    if (!canGenerate || !selectedVoice) return;

    setOperation("generating");
    setStage("loading");
    setProgress(null);
    resetMessages();

    try {
      const blob = await synthesize(selectedVoice.key, text, {
        onStage: (nextStage) => {
          if (mountedRef.current) setStage(nextStage);
        },
      });
      if (!blob.size) throw new Error("The local speech engine returned an empty audio file.");

      const nextUrl = URL.createObjectURL(blob);
      if (!mountedRef.current) {
        URL.revokeObjectURL(nextUrl);
        return;
      }

      revokeAudioUrl();
      audioUrlRef.current = nextUrl;
      setAudioUrl(nextUrl);
      setDownloadName(makeDownloadName(selectedVoice.key));
      setSuccess("Speech generated locally. Your WAV file is ready.");
      window.setTimeout(() => void audioRef.current?.play().catch(() => undefined), 0);
    } catch (caught) {
      if (!mountedRef.current) return;
      if (caught instanceof PiperError && caught.code === "CANCELLED") {
        setSuccess("Speech generation cancelled.");
      } else {
        setError(messageFromError(caught, "Speech generation failed."));
      }
    } finally {
      if (mountedRef.current) {
        setOperation("idle");
        setStage(null);
      }
    }
  }, [canGenerate, resetMessages, revokeAudioUrl, selectedVoice, text]);

  const cancelGeneration = useCallback(() => {
    if (operation !== "generating") return;
    disposePiper();
  }, [operation]);

  useEffect(() => {
    mountedRef.current = true;
    void refreshLibrary();

    return () => {
      mountedRef.current = false;
      disposePiper("TTS Studio closed.");
      revokeAudioUrl();
    };
  }, [refreshLibrary, revokeAudioUrl]);

  const selectedSize = formatBytes(voiceBytes(selectedVoice));

  return (
    <div className="tts-studio">
      <div className="tts-studio__status-strip" aria-label="TTS Studio capabilities">
        <span>Piper neural voices</span>
        <span>Runs locally in your browser</span>
        <span>WAV export</span>
        <span>No account or paid TTS API</span>
      </div>

      {support && !support.supported ? (
        <div className="tts-alert tts-alert--error" role="alert">
          <strong>Local TTS is not supported in this browser.</strong> {support.reason}
        </div>
      ) : null}

      <div className="tts-studio__grid">
        <section className="tts-panel tts-panel--input" aria-labelledby="tts-input-title">
          <div className="tts-panel__header">
            <div>
              <p className="tts-eyebrow">Input</p>
              <h2 id="tts-input-title">Generate speech</h2>
            </div>
            <button
              className="tts-button tts-button--quiet"
              type="button"
              onClick={() => void refreshLibrary()}
              disabled={busy || loadingVoices || support?.supported !== true}
            >
              {loadingVoices ? "Loading voices…" : "Refresh voices"}
            </button>
          </div>

          <div className="tts-panel__body">
            <div className="tts-field">
              <div className="tts-field__label-row">
                <label>Voice library</label>
                <span className="tts-count">{storedVoiceIds.size} downloaded</span>
              </div>

              <div className="tts-voice-list" aria-busy={loadingVoices}>
                {loadingVoices ? (
                  <div className="tts-voice-card tts-voice-card--loading">Loading Piper voice catalog…</div>
                ) : starterVoices.length ? (
                  starterVoices.map((voice) => {
                    const isSelected = selectedVoiceId === voice.key;
                    const isStored = storedVoiceIds.has(voice.key);
                    return (
                      <button
                        className={`tts-voice-card${isSelected ? " tts-voice-card--selected" : ""}`}
                        type="button"
                        key={voice.key}
                        onClick={() => selectVoice(voice.key)}
                        aria-pressed={isSelected}
                        disabled={busy}
                      >
                        <span className="tts-voice-card__topline">
                          <strong>{voiceDisplayName(voice)}</strong>
                          <span className={isStored ? "tts-badge tts-badge--ready" : "tts-badge"}>
                            {isStored ? "Downloaded" : formatBytes(voiceBytes(voice))}
                          </span>
                        </span>
                        <span className="tts-voice-card__meta">
                          {formatLocale(voice)} · {voice.quality} quality · {voice.key}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="tts-voice-card tts-voice-card--loading">No starter voices were found.</div>
                )}
              </div>

              <button
                className="tts-button tts-button--link"
                type="button"
                onClick={() => setShowAllVoices((current) => !current)}
                disabled={loadingVoices || voices.length === 0 || busy}
                aria-expanded={showAllVoices}
              >
                {showAllVoices ? "Hide voice catalog" : `Browse more voices (${voices.length})`}
              </button>

              {showAllVoices ? (
                <div className="tts-catalog">
                  <label htmlFor="tts-voice-search">Find a voice</label>
                  <input
                    id="tts-voice-search"
                    type="search"
                    value={voiceQuery}
                    onChange={(event: { target: { value: string } }) => setVoiceQuery(event.target.value)}
                    placeholder="Search language, country, voice, or quality"
                    disabled={busy}
                  />
                  <select
                    id="tts-voice"
                    value={selectedVoiceId}
                    onChange={(event: { target: { value: string } }) => selectVoice(event.target.value)}
                    disabled={busy || filteredVoices.length === 0}
                  >
                    {filteredVoices.length === 0 ? (
                      <option value="">No matching voices</option>
                    ) : (
                      filteredVoices.map((voice) => (
                        <option key={voice.key} value={voice.key}>
                          {voiceDisplayName(voice)} · {formatLocale(voice)} · {voice.quality} · {formatBytes(voiceBytes(voice))}
                          {storedVoiceIds.has(voice.key) ? " · downloaded" : ""}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : null}

              {selectedVoice ? (
                <div className="tts-voice-selection">
                  <div>
                    <strong>{voiceDisplayName(selectedVoice)}</strong>
                    <p>
                      {formatLocale(selectedVoice)} · {selectedVoice.quality} quality · {selectedSize}
                    </p>
                  </div>
                  {selectedStored ? (
                    <button
                      className="tts-button tts-button--quiet tts-button--compact"
                      type="button"
                      onClick={() => void removeSelectedVoice()}
                      disabled={busy}
                    >
                      Remove local voice
                    </button>
                  ) : (
                    <button
                      className="tts-button tts-button--primary tts-button--compact"
                      type="button"
                      onClick={() => void downloadSelectedVoice()}
                      disabled={busy || support?.supported !== true}
                    >
                      Download voice · {selectedSize}
                    </button>
                  )}
                </div>
              ) : null}

              {selectedVoice ? (
                <p className="tts-help tts-license-note">
                  {isStarterVoice(selectedVoice.key)
                    ? "Starter voice source dataset: CC0. "
                    : "Additional voice dataset licenses vary. "}
                  {modelCardUrl(selectedVoice) ? (
                    <a href={modelCardUrl(selectedVoice)!} target="_blank" rel="noreferrer">
                      Review this voice model card ↗
                    </a>
                  ) : null}
                </p>
              ) : null}

              <p className="tts-help">
                Voice models are cached in this site&apos;s browser storage for reuse. Removing site data or browser storage cleanup can remove cached voices.
              </p>

              {operation === "downloading" ? (
                <div className="tts-progress" aria-live="polite">
                  <div className="tts-progress__row">
                    <strong>{stageLabel(stage, operation)}</strong>
                    <span>{progressPercent === null ? "Preparing…" : `${progressPercent}%`}</span>
                  </div>
                  <progress value={progressPercent ?? undefined} max={100} />
                  {progress?.total ? (
                    <span className="tts-help">
                      {formatTransferred(progress.loaded)} of {formatBytes(progress.total)}
                    </span>
                  ) : null}
                </div>
              ) : null}
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
                onChange={(event: { target: { value: string } }) => setText(event.target.value)}
                onKeyDown={(event: { ctrlKey: boolean; metaKey: boolean; key: string; preventDefault: () => void }) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                    event.preventDefault();
                    void generate();
                  }
                }}
                placeholder="Paste narration, lesson text, accessibility copy, or any passage you want to hear."
                aria-describedby="tts-text-help"
                aria-invalid={charactersRemaining < 0 || undefined}
                disabled={operation === "generating"}
              />
              <p id="tts-text-help" className={charactersRemaining < 0 ? "tts-help tts-help--error" : "tts-help"}>
                {charactersRemaining < 0
                  ? `Remove ${Math.abs(charactersRemaining).toLocaleString()} ${Math.abs(charactersRemaining) === 1 ? "character" : "characters"} — the limit is ${MAX_TEXT_LENGTH.toLocaleString()}.`
                  : selectedStored
                    ? "Press Ctrl/⌘ + Enter to generate. Longer text takes more time to synthesize."
                    : "Download the selected voice once before generating speech."}
              </p>
            </div>

            <div className="tts-actions">
              <button
                className="tts-button tts-button--primary"
                type="button"
                onClick={() => void generate()}
                disabled={!canGenerate}
                aria-busy={operation === "generating"}
              >
                {operation === "generating" ? stageLabel(stage, operation) : "Generate speech"}
              </button>
              {operation === "generating" ? (
                <button className="tts-button tts-button--quiet" type="button" onClick={cancelGeneration}>
                  Cancel generation
                </button>
              ) : (
                <button
                  className="tts-button tts-button--quiet"
                  type="button"
                  onClick={() => {
                    setText("");
                    resetMessages();
                  }}
                  disabled={busy || text.length === 0}
                >
                  Clear text
                </button>
              )}
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
            {operation === "generating" ? <span className="tts-badge">Working locally</span> : null}
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
                <p>
                  Download a voice once, enter your text, then generate a WAV entirely in your browser. Your text is not sent to a Darma TTS server.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="tts-note">
        <strong>Privacy:</strong> speech synthesis runs locally in a Web Worker. Your text and generated WAV are not uploaded to a Darma TTS service. Piper runtime and voice-model files are fetched from public asset hosts when needed, and downloaded voices are cached in this site&apos;s browser storage for reuse.
      </div>
    </div>
  );
}
