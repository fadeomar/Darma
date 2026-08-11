"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  disposePiper,
  downloadVoice,
  getPiperSupport,
  listVoices,
  PiperError,
  type PiperControls,
  type PiperProgress,
  type PiperStage,
  type PiperVoice,
  removeVoice,
  storedVoices,
  synthesize,
} from "./piper/piperClient";

const MAX_TEXT_LENGTH = 5_000;
const STARTER_VOICE_IDS = ["en_US-kathleen-low", "en_US-joe-medium"] as const;
const PIPER_VOICE_REPO_BASE = "https://huggingface.co/diffusionstudio/piper-voices/blob/main";
const PIPER_SAMPLE_REPO_BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/main";

const DEFAULT_CONTROLS: PiperControls = {
  rate: 1,
  volume: 1,
  expressiveness: 1,
  normalize: true,
};

type Operation = "idle" | "downloading" | "removing" | "generating";

type PreviewState = {
  loadingVoiceId: string | null;
  playingVoiceId: string | null;
  unavailableVoiceIds: Set<string>;
};

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
  if (voice.name?.trim()) {
    return voice.name.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
  }
  const idTail = voice.key.split("-").slice(-2, -1)[0] || voice.key;
  return idTail.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function modelCardUrl(voice: PiperVoice) {
  const modelCard = Object.keys(voice.files ?? {}).find((path) => path.endsWith("MODEL_CARD"));
  return modelCard ? `${PIPER_VOICE_REPO_BASE}/${modelCard}` : null;
}

function sampleUrl(voice: PiperVoice) {
  const modelPath = Object.keys(voice.files ?? {}).find((path) => path.endsWith(".onnx"));
  if (!modelPath) return null;
  const directory = modelPath.split("/").slice(0, -1).join("/");
  return `${PIPER_SAMPLE_REPO_BASE}/${directory}/samples/speaker_0.mp3`;
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
    if (stage === "generating") return "Synthesizing speech locally…";
    if (stage === "finalizing") return "Finalizing your WAV…";
    return "Preparing local speech engine…";
  }

  if (operation === "removing") return "Removing local voice…";
  return "";
}

function generationStepState(
  step: "loading" | "generating" | "finalizing",
  stage: PiperStage | null,
): "waiting" | "active" | "done" {
  const order = ["loading", "generating", "finalizing"] as const;
  const currentIndex = Math.max(0, order.indexOf((stage ?? "loading") as (typeof order)[number]));
  const stepIndex = order.indexOf(step);
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "active";
  return "waiting";
}

function messageFromError(error: unknown, fallback: string) {
  if (error instanceof PiperError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function controlPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function controlsAreDefault(controls: PiperControls) {
  return (
    Math.abs(controls.rate - DEFAULT_CONTROLS.rate) < 0.001 &&
    Math.abs(controls.volume - DEFAULT_CONTROLS.volume) < 0.001 &&
    Math.abs(controls.expressiveness - DEFAULT_CONTROLS.expressiveness) < 0.001 &&
    controls.normalize === DEFAULT_CONTROLS.normalize
  );
}

export default function TextToSpeechClient() {
  const [support, setSupport] = useState<{ supported: boolean; reason?: string } | null>(null);
  const [voices, setVoices] = useState<PiperVoice[]>([]);
  const [storedVoiceIds, setStoredVoiceIds] = useState<Set<string>>(new Set());
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(STARTER_VOICE_IDS[0]);
  const [text, setText] = useState("Hello from Darma TTS Studio!");
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [operation, setOperation] = useState<Operation>("idle");
  const [operationVoiceId, setOperationVoiceId] = useState<string | null>(null);
  const [stage, setStage] = useState<PiperStage | null>(null);
  const [progress, setProgress] = useState<PiperProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("darma-tts.wav");
  const [showAllVoices, setShowAllVoices] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [downloadedOnly, setDownloadedOnly] = useState(false);
  const [controls, setControls] = useState<PiperControls>(DEFAULT_CONTROLS);
  const [lastGenerationControls, setLastGenerationControls] = useState<PiperControls | null>(null);
  const [previewState, setPreviewState] = useState<PreviewState>({
    loadingVoiceId: null,
    playingVoiceId: null,
    unavailableVoiceIds: new Set(),
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const trimmedLength = text.trim().length;
  const charactersRemaining = MAX_TEXT_LENGTH - text.length;
  const busy = operation !== "idle";
  const hasDownloadedVoices = storedVoiceIds.size > 0;

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.key === selectedVoiceId) ?? null,
    [selectedVoiceId, voices],
  );

  const selectedStored = storedVoiceIds.has(selectedVoiceId);
  const operationVoice = useMemo(
    () => voices.find((voice) => voice.key === operationVoiceId) ?? null,
    [operationVoiceId, voices],
  );

  const starterVoices = useMemo(() => {
    const starter = STARTER_VOICE_IDS.map((id) => voices.find((voice) => voice.key === id)).filter(
      (voice): voice is PiperVoice => Boolean(voice),
    );
    const storedExtras = voices.filter(
      (voice) =>
        storedVoiceIds.has(voice.key) &&
        !STARTER_VOICE_IDS.includes(voice.key as (typeof STARTER_VOICE_IDS)[number]),
    );
    return [...starter, ...storedExtras];
  }, [storedVoiceIds, voices]);

  const languages = useMemo(() => {
    const entries = new Map<string, string>();
    for (const voice of voices) {
      const code = voice.language?.code;
      if (!code) continue;
      entries.set(code, formatLocale(voice));
    }
    return [...entries.entries()].sort((left, right) => left[1].localeCompare(right[1]));
  }, [voices]);

  const qualities = useMemo(
    () => [...new Set(voices.map((voice) => voice.quality).filter(Boolean))].sort(),
    [voices],
  );

  const filteredVoices = useMemo(() => {
    const query = voiceQuery.trim().toLowerCase();
    return voices.filter((voice) => {
      if (languageFilter !== "all" && voice.language?.code !== languageFilter) return false;
      if (qualityFilter !== "all" && voice.quality !== qualityFilter) return false;
      if (downloadedOnly && !storedVoiceIds.has(voice.key)) return false;
      if (!query) return true;

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
  }, [downloadedOnly, languageFilter, qualityFilter, storedVoiceIds, voiceQuery, voices]);

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

  const stopVoicePreview = useCallback(() => {
    const preview = previewAudioRef.current;
    if (preview) {
      preview.pause();
      preview.removeAttribute("src");
      preview.load();
      previewAudioRef.current = null;
    }
    if (mountedRef.current) {
      setPreviewState((current) => ({
        ...current,
        loadingVoiceId: null,
        playingVoiceId: null,
      }));
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
        return (
          STARTER_VOICE_IDS.find((id) => voiceList.some((voice) => voice.key === id)) ??
          voiceList[0]?.key ??
          ""
        );
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

  const selectVoice = useCallback(
    (voiceId: string) => {
      if (busy) return;
      stopVoicePreview();
      setSelectedVoiceId(voiceId);
      setError(null);
      setSuccess(null);
    },
    [busy, stopVoicePreview],
  );

  const previewVoice = useCallback(
    async (voice: PiperVoice) => {
      if (busy) return;
      const url = sampleUrl(voice);
      if (!url) {
        setPreviewState((current) => ({
          ...current,
          unavailableVoiceIds: new Set(current.unavailableVoiceIds).add(voice.key),
        }));
        setError("A sample preview is not available for this voice. You can still download and use it locally.");
        return;
      }

      if (previewState.playingVoiceId === voice.key) {
        stopVoicePreview();
        return;
      }

      stopVoicePreview();
      setSelectedVoiceId(voice.key);
      setError(null);
      setSuccess(null);
      setPreviewState((current) => ({
        ...current,
        loadingVoiceId: voice.key,
        playingVoiceId: null,
      }));

      const preview = new Audio(url);
      preview.preload = "auto";
      previewAudioRef.current = preview;

      preview.addEventListener(
        "playing",
        () => {
          if (!mountedRef.current || previewAudioRef.current !== preview) return;
          setPreviewState((current) => ({
            ...current,
            loadingVoiceId: null,
            playingVoiceId: voice.key,
          }));
        },
        { once: true },
      );

      preview.addEventListener(
        "ended",
        () => {
          if (previewAudioRef.current === preview) stopVoicePreview();
        },
        { once: true },
      );

      preview.addEventListener(
        "error",
        () => {
          if (!mountedRef.current || previewAudioRef.current !== preview) return;
          previewAudioRef.current = null;
          setPreviewState((current) => {
            const unavailableVoiceIds = new Set(current.unavailableVoiceIds);
            unavailableVoiceIds.add(voice.key);
            return {
              loadingVoiceId: null,
              playingVoiceId: null,
              unavailableVoiceIds,
            };
          });
          setError("This voice does not publish a sample preview. You can still download and use the model locally.");
        },
        { once: true },
      );

      try {
        await preview.play();
      } catch (caught) {
        if (!mountedRef.current || previewAudioRef.current !== preview) return;
        previewAudioRef.current = null;
        setPreviewState((current) => ({
          ...current,
          loadingVoiceId: null,
          playingVoiceId: null,
        }));
        setError(messageFromError(caught, "The voice sample could not be played."));
      }
    },
    [busy, previewState.playingVoiceId, stopVoicePreview],
  );

  const downloadVoiceModel = useCallback(
    async (voice: PiperVoice) => {
      if (storedVoiceIds.has(voice.key) || busy) return;

      stopVoicePreview();
      setSelectedVoiceId(voice.key);
      setOperation("downloading");
      setOperationVoiceId(voice.key);
      setStage("downloading");
      setProgress({ loaded: 0, total: voiceBytes(voice) });
      resetMessages();

      try {
        await downloadVoice(voice.key, (nextProgress) => {
          if (mountedRef.current) setProgress(nextProgress);
        });
        const stored = await storedVoices();
        if (!stored.includes(voice.key)) {
          throw new PiperError(
            "The voice downloaded but could not be verified in browser storage. Please try again.",
            "STORAGE_VERIFY",
          );
        }
        if (!mountedRef.current) return;
        setStoredVoiceIds(new Set(stored));
        setSuccess(`${voiceDisplayName(voice)} is downloaded and ready. Add text, tune the voice, and generate.`);
      } catch (caught) {
        if (!mountedRef.current) return;
        setError(messageFromError(caught, "Voice download failed."));
      } finally {
        if (mountedRef.current) {
          setOperation("idle");
          setOperationVoiceId(null);
          setStage(null);
          setProgress(null);
        }
      }
    },
    [busy, resetMessages, stopVoicePreview, storedVoiceIds],
  );

  const removeVoiceModel = useCallback(
    async (voice: PiperVoice) => {
      if (!storedVoiceIds.has(voice.key) || busy) return;

      stopVoicePreview();
      setSelectedVoiceId(voice.key);
      setOperation("removing");
      setOperationVoiceId(voice.key);
      setStage(null);
      resetMessages();

      try {
        await removeVoice(voice.key);
        const stored = await storedVoices();
        if (stored.includes(voice.key)) {
          throw new PiperError(
            "The voice could not be removed from browser storage. Please try again.",
            "STORAGE_VERIFY",
          );
        }
        if (!mountedRef.current) return;
        setStoredVoiceIds(new Set(stored));
        setSuccess(`${voiceDisplayName(voice)} was removed from this browser.`);
      } catch (caught) {
        if (!mountedRef.current) return;
        setError(messageFromError(caught, "Could not remove this voice."));
      } finally {
        if (mountedRef.current) {
          setOperation("idle");
          setOperationVoiceId(null);
        }
      }
    },
    [busy, resetMessages, stopVoicePreview, storedVoiceIds],
  );

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

    stopVoicePreview();
    setOperation("generating");
    setOperationVoiceId(selectedVoice.key);
    setStage("loading");
    setProgress(null);
    resetMessages();

    const controlsSnapshot = { ...controls };

    try {
      const blob = await synthesize(selectedVoice.key, text, {
        controls: controlsSnapshot,
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
      setLastGenerationControls(controlsSnapshot);
      setSuccess("Speech generated locally. Your tuned WAV file is ready.");
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
        setOperationVoiceId(null);
        setStage(null);
      }
    }
  }, [canGenerate, controls, resetMessages, revokeAudioUrl, selectedVoice, stopVoicePreview, text]);

  const cancelGeneration = useCallback(() => {
    if (operation !== "generating") return;
    disposePiper();
  }, [operation]);

  const resetControls = useCallback(() => {
    if (operation === "generating") return;
    setControls(DEFAULT_CONTROLS);
  }, [operation]);

  useEffect(() => {
    mountedRef.current = true;
    void refreshLibrary();

    return () => {
      mountedRef.current = false;
      stopVoicePreview();
      disposePiper("TTS Studio closed.");
      revokeAudioUrl();
    };
  }, [refreshLibrary, revokeAudioUrl, stopVoicePreview]);

  const selectedSize = formatBytes(voiceBytes(selectedVoice));
  const downloadVoiceName = operationVoice ? voiceDisplayName(operationVoice) : "voice";

  const renderPreviewLabel = (voice: PiperVoice) => {
    if (previewState.unavailableVoiceIds.has(voice.key)) return "Preview unavailable";
    if (previewState.loadingVoiceId === voice.key) return "Loading sample…";
    if (previewState.playingVoiceId === voice.key) return "Stop preview";
    return "Preview voice";
  };

  const renderStarterVoiceCard = (voice: PiperVoice) => {
    const isSelected = selectedVoiceId === voice.key;
    const isStored = storedVoiceIds.has(voice.key);
    const previewDisabled = busy || previewState.unavailableVoiceIds.has(voice.key);

    return (
      <article
        className={`tts-voice-card${isSelected ? " tts-voice-card--selected" : ""}`}
        key={voice.key}
      >
        <button
          className="tts-voice-card__select"
          type="button"
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
        <div className="tts-voice-card__actions">
          <button
            className="tts-button tts-button--quiet tts-button--mini"
            type="button"
            onClick={() => void previewVoice(voice)}
            disabled={previewDisabled}
            aria-pressed={previewState.playingVoiceId === voice.key}
          >
            <span aria-hidden="true">{previewState.playingVoiceId === voice.key ? "■" : "▶"}</span>
            {renderPreviewLabel(voice)}
          </button>
          {isStored ? (
            <button
              className="tts-button tts-button--quiet tts-button--mini"
              type="button"
              onClick={() => void removeVoiceModel(voice)}
              disabled={busy}
            >
              Remove local voice
            </button>
          ) : (
            <button
              className="tts-button tts-button--primary tts-button--mini"
              type="button"
              onClick={() => void downloadVoiceModel(voice)}
              disabled={busy || support?.supported !== true}
            >
              Download · {formatBytes(voiceBytes(voice))}
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="tts-studio">
      <div className="tts-studio__status-strip" aria-label="TTS Studio capabilities">
        <span>Piper neural voices</span>
        <span>Runs locally in your browser</span>
        <span>Voice controls</span>
        <span>WAV export</span>
        <span>No account or paid TTS API</span>
      </div>

      {support && !support.supported ? (
        <div className="tts-alert tts-alert--error" role="alert">
          <strong>Local TTS is not supported in this browser.</strong> {support.reason}
        </div>
      ) : null}

      {!loadingVoices && support?.supported && !hasDownloadedVoices && selectedVoice ? (
        <section className="tts-first-run" aria-labelledby="tts-first-run-title">
          <div className="tts-first-run__icon" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="tts-first-run__copy">
            <p className="tts-eyebrow">First time here?</p>
            <h2 id="tts-first-run-title">Start by previewing and downloading one voice</h2>
            <p>
              Piper voices run on your device, so the browser needs one model before it can generate speech.
              Listen to a tiny sample first, then download the full model once. It stays cached for later visits.
            </p>
            <ol className="tts-first-run__steps" aria-label="TTS Studio first-use steps">
              <li><strong>1</strong><span>Preview a voice</span></li>
              <li><strong>2</strong><span>Download it once</span></li>
              <li><strong>3</strong><span>Generate locally</span></li>
            </ol>
          </div>
          <div className="tts-first-run__actions">
            <button
              className="tts-button tts-button--quiet"
              type="button"
              onClick={() => void previewVoice(selectedVoice)}
              disabled={busy || previewState.unavailableVoiceIds.has(selectedVoice.key)}
            >
              <span aria-hidden="true">{previewState.playingVoiceId === selectedVoice.key ? "■" : "▶"}</span>
              {renderPreviewLabel(selectedVoice)}
            </button>
            <button
              className="tts-button tts-button--primary"
              type="button"
              onClick={() => void downloadVoiceModel(selectedVoice)}
              disabled={busy}
            >
              Download {voiceDisplayName(selectedVoice)} · {selectedSize}
            </button>
          </div>
        </section>
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
                <label>Starter voices</label>
                <span className="tts-count">
                  {storedVoiceIds.size} downloaded {storedVoiceIds.size === 0 ? "· download one to begin" : ""}
                </span>
              </div>

              <div className="tts-voice-list" aria-busy={loadingVoices}>
                {loadingVoices ? (
                  <div className="tts-voice-card tts-voice-card--loading">
                    <span className="tts-loading-dots" aria-hidden="true"><i /><i /><i /></span>
                    Loading Piper voice catalog…
                  </div>
                ) : starterVoices.length ? (
                  starterVoices.map(renderStarterVoiceCard)
                ) : (
                  <div className="tts-voice-card tts-voice-card--loading">No starter voices were found.</div>
                )}
              </div>

              <button
                className="tts-button tts-button--link tts-browse-toggle"
                type="button"
                onClick={() => setShowAllVoices((current) => !current)}
                disabled={loadingVoices || voices.length === 0 || busy}
                aria-expanded={showAllVoices}
              >
                {showAllVoices ? "Hide voice browser ↑" : `Browse all ${voices.length} voices ↓`}
              </button>

              {showAllVoices ? (
                <div className="tts-catalog">
                  <div className="tts-catalog__header">
                    <div>
                      <strong>Voice browser</strong>
                      <span>{filteredVoices.length} matching voices</span>
                    </div>
                    <span className="tts-help">Preview before downloading when a sample is available.</span>
                  </div>

                  <div className="tts-catalog__filters">
                    <label>
                      <span>Search</span>
                      <input
                        id="tts-voice-search"
                        type="search"
                        value={voiceQuery}
                        onChange={(event: { target: { value: string } }) => setVoiceQuery(event.target.value)}
                        placeholder="Voice, language, country…"
                        disabled={busy}
                      />
                    </label>
                    <label>
                      <span>Language</span>
                      <select
                        value={languageFilter}
                        onChange={(event: { target: { value: string } }) => setLanguageFilter(event.target.value)}
                        disabled={busy}
                      >
                        <option value="all">All languages</option>
                        {languages.map(([code, label]) => (
                          <option key={code} value={code}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Quality</span>
                      <select
                        value={qualityFilter}
                        onChange={(event: { target: { value: string } }) => setQualityFilter(event.target.value)}
                        disabled={busy}
                      >
                        <option value="all">All qualities</option>
                        {qualities.map((quality) => (
                          <option key={quality} value={quality}>{quality.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="tts-checkbox-row">
                    <input
                      type="checkbox"
                      checked={downloadedOnly}
                      onChange={(event: { target: { checked: boolean } }) => setDownloadedOnly(event.target.checked)}
                      disabled={busy}
                    />
                    <span>Show downloaded voices only</span>
                  </label>

                  <label htmlFor="tts-voice">Choose from results</label>
                  <select
                    id="tts-voice"
                    value={filteredVoices.some((voice) => voice.key === selectedVoiceId) ? selectedVoiceId : ""}
                    onChange={(event: { target: { value: string } }) => selectVoice(event.target.value)}
                    disabled={busy || filteredVoices.length === 0}
                  >
                    {filteredVoices.length === 0 ? (
                      <option value="">No matching voices</option>
                    ) : (
                      <>
                        {!filteredVoices.some((voice) => voice.key === selectedVoiceId) ? (
                          <option value="" disabled>Select a voice…</option>
                        ) : null}
                        {filteredVoices.map((voice) => (
                          <option key={voice.key} value={voice.key}>
                            {voiceDisplayName(voice)} · {formatLocale(voice)} · {voice.quality.replace(/_/g, " ")} · {formatBytes(voiceBytes(voice))}
                            {storedVoiceIds.has(voice.key) ? " · downloaded" : ""}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              ) : null}

              {selectedVoice ? (
                <div className="tts-voice-selection">
                  <div className="tts-voice-selection__copy">
                    <div className="tts-voice-selection__title">
                      <strong>{voiceDisplayName(selectedVoice)}</strong>
                      {selectedStored ? <span className="tts-badge tts-badge--ready">Ready locally</span> : null}
                    </div>
                    <p>
                      {formatLocale(selectedVoice)} · {selectedVoice.quality.replace(/_/g, " ")} quality · {selectedSize}
                    </p>
                  </div>
                  <div className="tts-voice-selection__actions">
                    <button
                      className="tts-button tts-button--quiet tts-button--compact"
                      type="button"
                      onClick={() => void previewVoice(selectedVoice)}
                      disabled={busy || previewState.unavailableVoiceIds.has(selectedVoice.key)}
                      aria-pressed={previewState.playingVoiceId === selectedVoice.key}
                    >
                      <span aria-hidden="true">{previewState.playingVoiceId === selectedVoice.key ? "■" : "▶"}</span>
                      {renderPreviewLabel(selectedVoice)}
                    </button>
                    {selectedStored ? (
                      <button
                        className="tts-button tts-button--quiet tts-button--compact"
                        type="button"
                        onClick={() => void removeVoiceModel(selectedVoice)}
                        disabled={busy}
                      >
                        Remove local voice
                      </button>
                    ) : (
                      <button
                        className="tts-button tts-button--primary tts-button--compact"
                        type="button"
                        onClick={() => void downloadVoiceModel(selectedVoice)}
                        disabled={busy || support?.supported !== true}
                      >
                        Download voice · {selectedSize}
                      </button>
                    )}
                  </div>
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
                Sample previews are small public audio files and do not contain your text. Full voice models are
                cached in this site&apos;s browser storage for reuse.
              </p>

              {operation === "downloading" ? (
                <div className="tts-download-state" aria-live="polite" aria-busy="true">
                  <div className="tts-download-state__visual" aria-hidden="true">
                    <span /><span /><span /><span /><span />
                  </div>
                  <div className="tts-download-state__content">
                    <div className="tts-progress__row">
                      <div>
                        <strong>{stageLabel(stage, operation)}</strong>
                        <span>{downloadVoiceName}</span>
                      </div>
                      <b>{progressPercent === null ? "Preparing…" : `${progressPercent}%`}</b>
                    </div>
                    <progress value={progressPercent ?? undefined} max={100} />
                    <div className="tts-download-state__footer">
                      <span>
                        {progress?.total
                          ? `${formatTransferred(progress.loaded)} of ${formatBytes(progress.total)}`
                          : "Preparing download…"}
                      </span>
                      <span>Keep this tab open. You only need to download this voice once.</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <section className="tts-controls" aria-labelledby="tts-controls-title">
              <div className="tts-controls__header">
                <div>
                  <p className="tts-eyebrow">Voice studio</p>
                  <h3 id="tts-controls-title">Tune the generated voice</h3>
                  <p>These settings are applied locally and baked into the downloaded WAV.</p>
                </div>
                <button
                  className="tts-button tts-button--quiet tts-button--compact"
                  type="button"
                  onClick={resetControls}
                  disabled={operation === "generating" || controlsAreDefault(controls)}
                >
                  Reset controls
                </button>
              </div>

              <div className="tts-controls__grid">
                <label className="tts-control">
                  <span className="tts-control__title">
                    <strong>Speaking speed</strong>
                    <output>{controls.rate.toFixed(2)}×</output>
                  </span>
                  <input
                    type="range"
                    min="0.75"
                    max="1.4"
                    step="0.05"
                    value={controls.rate}
                    onChange={(event: { target: { value: string } }) =>
                      setControls((current) => ({ ...current, rate: Number(event.target.value) }))
                    }
                    disabled={operation === "generating"}
                    aria-label="Speaking speed"
                  />
                  <span className="tts-control__scale"><span>Slower</span><span>Normal</span><span>Faster</span></span>
                </label>

                <label className="tts-control">
                  <span className="tts-control__title">
                    <strong>Output volume</strong>
                    <output>{controlPercent(controls.volume)}</output>
                  </span>
                  <input
                    type="range"
                    min="0.5"
                    max="1.25"
                    step="0.05"
                    value={controls.volume}
                    onChange={(event: { target: { value: string } }) =>
                      setControls((current) => ({ ...current, volume: Number(event.target.value) }))
                    }
                    disabled={operation === "generating"}
                    aria-label="Output volume"
                  />
                  <span className="tts-control__scale"><span>50%</span><span>100%</span><span>125%</span></span>
                </label>
              </div>

              <details className="tts-controls__advanced">
                <summary>Advanced controls</summary>
                <div className="tts-controls__advanced-body">
                  <label className="tts-control">
                    <span className="tts-control__title">
                      <strong>Voice variation</strong>
                      <output>{controls.expressiveness.toFixed(2)}×</output>
                    </span>
                    <input
                      type="range"
                      min="0.75"
                      max="1.25"
                      step="0.05"
                      value={controls.expressiveness}
                      onChange={(event: { target: { value: string } }) =>
                        setControls((current) => ({ ...current, expressiveness: Number(event.target.value) }))
                      }
                      disabled={operation === "generating"}
                      aria-label="Voice variation"
                    />
                    <span className="tts-control__scale"><span>Steadier</span><span>Default</span><span>More varied</span></span>
                  </label>

                  <label className="tts-normalize-toggle">
                    <span>
                      <strong>Normalize loudness</strong>
                      <small>Reduce large volume differences between voice models before applying your volume setting.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={controls.normalize}
                      onChange={(event: { target: { checked: boolean } }) =>
                        setControls((current) => ({ ...current, normalize: event.target.checked }))
                      }
                      disabled={operation === "generating"}
                    />
                  </label>

                  <p className="tts-controls__tip">
                    <strong>Performance tip:</strong> model quality and size affect generation time more than these
                    controls. Choose an x-low/low model when faster local generation matters most.
                  </p>
                </div>
              </details>
            </section>

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
                onKeyDown={(event: {
                  ctrlKey: boolean;
                  metaKey: boolean;
                  key: string;
                  preventDefault: () => void;
                }) => {
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
              <p
                id="tts-text-help"
                className={charactersRemaining < 0 ? "tts-help tts-help--error" : "tts-help"}
              >
                {charactersRemaining < 0
                  ? `Remove ${Math.abs(charactersRemaining).toLocaleString()} ${
                      Math.abs(charactersRemaining) === 1 ? "character" : "characters"
                    } — the limit is ${MAX_TEXT_LENGTH.toLocaleString()}.`
                  : selectedStored
                    ? "Press Ctrl/⌘ + Enter to generate. Longer text takes more time to synthesize."
                    : "Choose and download a voice first. The model is stored locally for future generations."}
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
            {operation === "generating" ? <span className="tts-badge tts-badge--working">Working locally</span> : null}
          </div>

          <div className="tts-panel__body tts-output">
            {operation === "generating" ? (
              <div className="tts-processing" aria-live="polite" aria-busy="true">
                <div className="tts-processing__wave" aria-hidden="true">
                  <span /><span /><span /><span /><span /><span /><span />
                </div>
                <p className="tts-eyebrow">On-device processing</p>
                <h3>{stageLabel(stage, operation)}</h3>
                <p>
                  Piper is generating this audio inside your browser. Your text is not being sent to a Darma TTS server.
                </p>
                <ol className="tts-processing__steps">
                  <li data-state={generationStepState("loading", stage)}>
                    <span aria-hidden="true" />
                    <div><strong>Load voice</strong><small>Prepare the downloaded model and ONNX runtime.</small></div>
                  </li>
                  <li data-state={generationStepState("generating", stage)}>
                    <span aria-hidden="true" />
                    <div><strong>Synthesize speech</strong><small>Apply speaking speed and voice variation locally.</small></div>
                  </li>
                  <li data-state={generationStepState("finalizing", stage)}>
                    <span aria-hidden="true" />
                    <div><strong>Finalize WAV</strong><small>Apply loudness controls and prepare the downloadable file.</small></div>
                  </li>
                </ol>
                <button className="tts-button tts-button--quiet" type="button" onClick={cancelGeneration}>
                  Cancel generation
                </button>
              </div>
            ) : audioUrl ? (
              <>
                <div className="tts-output__ready">
                  <span className="tts-output__dot" aria-hidden="true" />
                  WAV ready
                </div>
                <audio ref={audioRef} controls src={audioUrl} className="tts-audio" />
                {lastGenerationControls ? (
                  <div className="tts-output__settings" aria-label="Generated voice settings">
                    <span>Speed {lastGenerationControls.rate.toFixed(2)}×</span>
                    <span>Volume {controlPercent(lastGenerationControls.volume)}</span>
                    <span>Variation {lastGenerationControls.expressiveness.toFixed(2)}×</span>
                    <span>{lastGenerationControls.normalize ? "Normalized" : "Original loudness"}</span>
                  </div>
                ) : null}
                <a
                  className="tts-button tts-button--primary tts-button--download"
                  href={audioUrl}
                  download={downloadName}
                >
                  Download WAV
                </a>
                <p className="tts-file-name" title={downloadName}>{downloadName}</p>
              </>
            ) : (
              <div className="tts-empty">
                <div className="tts-empty__visual" aria-hidden="true">
                  <span /><span /><span /><span /><span />
                </div>
                <h3>{hasDownloadedVoices ? "Your audio will appear here" : "Download one voice to get started"}</h3>
                <p>
                  {hasDownloadedVoices
                    ? "Enter text, tune the voice controls, then generate a WAV entirely in your browser."
                    : "Preview a starter voice, download its model once, then generate private local speech whenever you need it."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="tts-note">
        <strong>Privacy:</strong> speech synthesis and voice tuning run locally in a Web Worker. Your text and
        generated WAV are not uploaded to a Darma TTS service. Piper runtime/model files and optional sample
        previews are fetched from public asset hosts when needed; downloaded voices are cached in this site&apos;s
        browser storage for reuse.
      </div>
    </div>
  );
}
