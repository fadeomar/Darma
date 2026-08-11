/// <reference lib="webworker" />

/**
 * Piper speech synthesis, fully off the main thread.
 *
 * User text never leaves this worker. Network activity is limited to the
 * runtime/model assets that Piper needs. Voice models are stored in OPFS.
 */
import * as tts from "@mintplex-labs/piper-tts-web";

export type PiperStage = "downloading" | "saving" | "loading" | "generating" | "finalizing";

export type PiperGenerationProgress = {
  current: number;
  total: number;
};

export type PiperControls = {
  /** Speaking-rate multiplier. 1 = model default, >1 = faster, <1 = slower. */
  rate: number;
  /** Final WAV gain multiplier. */
  volume: number;
  /** Piper noise-scale multiplier. 1 = model default. */
  expressiveness: number;
  /** Normalize the generated WAV to a consistent peak before volume gain. */
  normalize: boolean;
};

type Incoming =
  | { id: number; type: "voices" }
  | { id: number; type: "stored" }
  | { id: number; type: "download"; voiceId: string }
  | { id: number; type: "remove"; voiceId: string }
  | {
      id: number;
      type: "synthesize";
      voiceId: string;
      text: string;
      controls?: Partial<PiperControls>;
    };

type Outgoing =
  | { id: number; type: "result"; payload: unknown }
  | { id: number; type: "audio"; buffer: ArrayBuffer }
  | { id: number; type: "error"; message: string; code: string; detail?: string }
  | { id: number; type: "progress"; loaded: number; total: number }
  | { id: number; type: "stage"; stage: PiperStage }
  | { id: number; type: "generation-progress"; current: number; total: number };

const DEFAULT_CONTROLS: PiperControls = {
  rate: 1,
  volume: 1,
  expressiveness: 1,
  normalize: true,
};

const ctx = self as unknown as DedicatedWorkerGlobalScope;
type VoiceId = Parameters<typeof tts.download>[0];

type VoiceRecord = Awaited<ReturnType<typeof tts.voices>>[number];

class WorkerFault extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "WorkerFault";
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeControls(input?: Partial<PiperControls>): PiperControls {
  return {
    rate: clamp(Number(input?.rate ?? DEFAULT_CONTROLS.rate) || 1, 0.6, 1.6),
    volume: clamp(Number(input?.volume ?? DEFAULT_CONTROLS.volume) || 1, 0.25, 1.5),
    expressiveness: clamp(
      Number(input?.expressiveness ?? DEFAULT_CONTROLS.expressiveness) || 1,
      0.6,
      1.4,
    ),
    normalize: input?.normalize ?? DEFAULT_CONTROLS.normalize,
  };
}

/**
 * TtsSession is a singleton upstream. Reusing it after switching voice IDs can
 * keep the prior ONNX model alive, so explicitly reset the singleton whenever
 * the active voice changes or a model is removed.
 */
let activeVoiceId: string | null = null;

function resetSession() {
  (tts.TtsSession as unknown as { _instance: unknown })._instance = null;
  activeVoiceId = null;
}

function post(message: Outgoing, transfer?: Transferable[]) {
  ctx.postMessage(message, transfer ?? []);
}

function classify(error: unknown): { code: string; message: string } {
  if (error instanceof WorkerFault) return { code: error.code, message: error.message };

  const raw = error instanceof Error ? `${error.name}: ${error.message}` : String(error);

  if (/quota|QuotaExceeded|storage|NotAllowedError/i.test(raw)) {
    return {
      code: "STORAGE",
      message: "The voice could not be saved in browser storage. Free some space and try again.",
    };
  }

  if (/fetch|network|Failed to fetch|NetworkError|ERR_/i.test(raw)) {
    return {
      code: "NETWORK",
      message: "The voice or speech runtime could not be downloaded. Check your connection and try again.",
    };
  }

  if (/getDirectory|Origin Private File System|OPFS/i.test(raw)) {
    return {
      code: "UNSUPPORTED_BROWSER",
      message: "This browser cannot use the private storage required for local Piper voices.",
    };
  }

  if (/wasm|WebAssembly|ort-|onnxruntime/i.test(raw)) {
    return {
      code: "RUNTIME",
      message: "The local speech engine could not start. Try a recent Chrome, Edge, Firefox, or Safari.",
    };
  }

  if (/voice control|InferenceSession\.run|scales tensor/i.test(raw)) {
    return {
      code: "VOICE_CONTROLS",
      message: "The local engine could not apply these voice controls. Reset the controls and try again.",
    };
  }

  return {
    code: "UNKNOWN",
    message: "Speech generation failed. Try again, or choose another voice.",
  };
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

let catalogPromise: Promise<VoiceRecord[]> | null = null;

function getCatalog() {
  catalogPromise ??= tts.voices().catch((error) => {
    catalogPromise = null;
    throw error;
  });
  return catalogPromise;
}

function expectedVoiceFiles(voice: VoiceRecord) {
  return Object.entries(voice.files)
    .filter(([path]) => path.endsWith(".onnx") || path.endsWith(".onnx.json"))
    .map(([path, metadata]) => ({
      name: path.split("/").at(-1)!,
      size: metadata.size_bytes,
    }));
}

async function isVoiceFullyStored(voiceId: string) {
  const catalog = await getCatalog();
  const voice = catalog.find((candidate) => candidate.key === voiceId);
  if (!voice) return false;

  const expected = expectedVoiceFiles(voice);
  if (expected.length < 2) return false;

  try {
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle("piper", { create: true });

    for (const file of expected) {
      const handle = await dir.getFileHandle(file.name);
      const storedFile = await handle.getFile();
      if (storedFile.size !== file.size) return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function verifiedStoredVoices() {
  const candidates = await tts.stored();
  const verified = await Promise.all(
    candidates.map(async (voiceId) => ({
      voiceId,
      ready: await isVoiceFullyStored(voiceId),
    })),
  );

  return verified.filter((entry) => entry.ready).map((entry) => entry.voiceId);
}

/**
 * Upstream `download()` can report completion before OPFS has completely
 * persisted both files. Verify model/config byte sizes before Darma reports a
 * voice as downloaded.
 */
async function waitUntilStored(voiceId: string, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await isVoiceFullyStored(voiceId)) return;
    await delay(150);
  }

  throw new WorkerFault(
    "The voice finished downloading but could not be verified in browser storage. Try the download again.",
    "STORAGE_VERIFY",
  );
}

/**
 * The pinned Piper web wrapper does not expose Piper's inference scale tensor
 * as public options. ONNX Runtime does expose InferenceSession.run, however.
 * Install one worker-local wrapper that adjusts only the well-known Piper
 * `scales` feed immediately before inference. This keeps the dependency pinned
 * and avoids patching node_modules while still using Piper's native
 * length/noise controls.
 */
let currentInferenceControls: PiperControls | null = null;
let ortControlPatchPromise: Promise<void> | null = null;

async function ensureOrtControlPatch() {
  ortControlPatchPromise ??= (async () => {
    const ort = await import("onnxruntime-web");
    const inferenceSessionFactory = ort.InferenceSession as unknown as {
      prototype?: {
        run: (feeds: Record<string, unknown>, ...rest: unknown[]) => Promise<unknown>;
        __darmaPiperControls?: boolean;
      };
    };
    const prototype = inferenceSessionFactory.prototype;
    if (!prototype) {
      throw new WorkerFault("ONNX Runtime does not expose InferenceSession.run.", "VOICE_CONTROLS");
    }

    if (prototype.__darmaPiperControls) return;

    const originalRun = prototype.run;
    if (typeof originalRun !== "function") {
      throw new WorkerFault("ONNX Runtime does not expose InferenceSession.run.", "VOICE_CONTROLS");
    }

    prototype.run = function runWithDarmaPiperControls(
      feeds: Record<string, unknown>,
      ...rest: unknown[]
    ) {
      const controls = currentInferenceControls;
      const typedFeeds = feeds as Record<
        string,
        { data?: ArrayLike<number>; dims?: readonly number[] } | undefined
      >;
      const scales = typedFeeds.scales;

      if (controls && scales?.data && scales.dims) {
        const source = Array.from(scales.data);
        if (source.length < 3) {
          throw new WorkerFault("Piper scales tensor has an unexpected shape.", "VOICE_CONTROLS");
        }

        const nextScales = new Float32Array(source);
        // Piper order: noise_scale, length_scale, noise_w.
        nextScales[0] = clamp(nextScales[0] * controls.expressiveness, 0.05, 2);
        // Piper length_scale is inverse to speaking rate: smaller = faster.
        nextScales[1] = clamp(nextScales[1] / controls.rate, 0.3, 3);
        nextScales[2] = clamp(nextScales[2] * controls.expressiveness, 0.05, 2);

        feeds = {
          ...feeds,
          scales: new ort.Tensor("float32", nextScales, Array.from(scales.dims)),
        };
      }

      return originalRun.call(this, feeds, ...rest);
    };

    Object.defineProperty(prototype, "__darmaPiperControls", {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  })().catch((error) => {
    ortControlPatchPromise = null;
    throw error;
  });

  await ortControlPatchPromise;
}

function readAscii(view: DataView, offset: number, length: number) {
  let output = "";
  for (let index = 0; index < length; index += 1) {
    output += String.fromCharCode(view.getUint8(offset + index));
  }
  return output;
}

/**
 * Piper emits 16-bit PCM WAV. Apply local normalization/gain to the generated
 * file itself (not just the HTML audio element), so playback and downloaded WAV
 * match. Unknown WAV layouts are returned unchanged rather than breaking TTS.
 */
async function applyWavOutputControls(wav: Blob, controls: PiperControls) {
  if (!controls.normalize && Math.abs(controls.volume - 1) < 0.001) return wav;

  const buffer = await wav.arrayBuffer();
  const view = new DataView(buffer);
  if (buffer.byteLength < 44 || readAscii(view, 0, 4) !== "RIFF" || readAscii(view, 8, 4) !== "WAVE") {
    return wav;
  }

  let offset = 12;
  let audioFormat = 0;
  let bitsPerSample = 0;
  let dataOffset = -1;
  let dataLength = 0;

  while (offset + 8 <= view.byteLength) {
    const id = readAscii(view, offset, 4);
    const size = view.getUint32(offset + 4, true);
    const payloadOffset = offset + 8;

    if (id === "fmt " && size >= 16 && payloadOffset + size <= view.byteLength) {
      audioFormat = view.getUint16(payloadOffset, true);
      bitsPerSample = view.getUint16(payloadOffset + 14, true);
    } else if (id === "data" && payloadOffset + size <= view.byteLength) {
      dataOffset = payloadOffset;
      dataLength = size;
      break;
    }

    offset = payloadOffset + size + (size % 2);
  }

  if (audioFormat !== 1 || bitsPerSample !== 16 || dataOffset < 0 || dataLength < 2) {
    return wav;
  }

  let peak = 0;
  for (let cursor = dataOffset; cursor + 1 < dataOffset + dataLength; cursor += 2) {
    peak = Math.max(peak, Math.abs(view.getInt16(cursor, true)) / 32768);
  }

  let gain = controls.volume;
  if (controls.normalize && peak > 0.0001) {
    // 0.78 leaves enough headroom for the user-facing volume control up to 125%.
    const normalizationGain = clamp(0.78 / peak, 0.2, 6);
    gain *= normalizationGain;
  }

  if (Math.abs(gain - 1) < 0.001) return new Blob([buffer], { type: "audio/wav" });

  for (let cursor = dataOffset; cursor + 1 < dataOffset + dataLength; cursor += 2) {
    const sample = view.getInt16(cursor, true);
    const nextSample = Math.round(clamp(sample * gain, -32768, 32767));
    view.setInt16(cursor, nextSample, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}


const SYNTHESIS_CHUNK_TARGET = 700;

function splitOversizedText(value: string, maxChars: number) {
  const pieces: string[] = [];
  let remaining = value.trim();

  while (remaining.length > maxChars) {
    const window = remaining.slice(0, maxChars + 1);
    const preferredBreak = Math.max(
      window.lastIndexOf(" "),
      window.lastIndexOf("\n"),
      window.lastIndexOf(","),
      window.lastIndexOf(";"),
      window.lastIndexOf(":"),
    );
    const cut = preferredBreak >= Math.floor(maxChars * 0.55) ? preferredBreak + 1 : maxChars;
    pieces.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }

  if (remaining) pieces.push(remaining);
  return pieces;
}

/**
 * Piper models are much more reliable with sentence-sized inputs. Darma does
 * not impose a product character quota; long text is broken into natural local
 * chunks and synthesized sequentially inside the same worker/session.
 */
function splitTextForSynthesis(text: string, maxChars = SYNTHESIS_CHUNK_TARGET) {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  const paragraphs = normalized.split(/\n{2,}/u).map((value) => value.trim()).filter(Boolean);

  for (const paragraph of paragraphs) {
    const sentenceLike =
      paragraph.match(/[^.!?…。！？]+[.!?…。！？]+(?:["'”’\])}]+)?|[^.!?…。！？]+$/gu) ?? [paragraph];
    let current = "";

    const flush = () => {
      const value = current.trim();
      if (value) chunks.push(value);
      current = "";
    };

    for (const sentence of sentenceLike) {
      const clean = sentence.trim();
      if (!clean) continue;

      if (clean.length > maxChars) {
        flush();
        chunks.push(...splitOversizedText(clean, maxChars));
        continue;
      }

      const candidate = current ? `${current} ${clean}` : clean;
      if (candidate.length > maxChars) {
        flush();
        current = clean;
      } else {
        current = candidate;
      }
    }

    flush();
  }

  return chunks;
}

type PcmWav = {
  audioFormat: number;
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  data: Uint8Array;
};

async function parsePcmWav(wav: Blob): Promise<PcmWav> {
  const buffer = await wav.arrayBuffer();
  const view = new DataView(buffer);
  if (buffer.byteLength < 44 || readAscii(view, 0, 4) !== "RIFF" || readAscii(view, 8, 4) !== "WAVE") {
    throw new WorkerFault("Piper returned an unsupported WAV layout.", "WAV_MERGE");
  }

  let offset = 12;
  let audioFormat = 0;
  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataOffset = -1;
  let dataLength = 0;

  while (offset + 8 <= buffer.byteLength) {
    const id = readAscii(view, offset, 4);
    const size = view.getUint32(offset + 4, true);
    const payloadOffset = offset + 8;
    if (payloadOffset + size > buffer.byteLength) break;

    if (id === "fmt " && size >= 16) {
      audioFormat = view.getUint16(payloadOffset, true);
      channels = view.getUint16(payloadOffset + 2, true);
      sampleRate = view.getUint32(payloadOffset + 4, true);
      bitsPerSample = view.getUint16(payloadOffset + 14, true);
    } else if (id === "data") {
      dataOffset = payloadOffset;
      dataLength = size;
      break;
    }

    offset = payloadOffset + size + (size % 2);
  }

  if (audioFormat !== 1 || !channels || !sampleRate || bitsPerSample !== 16 || dataOffset < 0) {
    throw new WorkerFault("Piper returned an unsupported PCM WAV format.", "WAV_MERGE");
  }

  return {
    audioFormat,
    channels,
    sampleRate,
    bitsPerSample,
    data: new Uint8Array(buffer.slice(dataOffset, dataOffset + dataLength)),
  };
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

async function mergePcmWavs(wavs: Blob[]) {
  if (wavs.length === 0) throw new WorkerFault("No audio chunks were generated.", "WAV_MERGE");
  if (wavs.length === 1) return wavs[0];

  const parts = await Promise.all(wavs.map(parsePcmWav));
  const first = parts[0];
  for (const part of parts.slice(1)) {
    if (
      part.audioFormat !== first.audioFormat ||
      part.channels !== first.channels ||
      part.sampleRate !== first.sampleRate ||
      part.bitsPerSample !== first.bitsPerSample
    ) {
      throw new WorkerFault("Generated speech chunks use incompatible WAV formats.", "WAV_MERGE");
    }
  }

  const dataLength = parts.reduce((total, part) => total + part.data.byteLength, 0);
  const blockAlign = first.channels * (first.bitsPerSample / 8);
  const byteRate = first.sampleRate * blockAlign;
  const output = new ArrayBuffer(44 + dataLength);
  const view = new DataView(output);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, first.audioFormat, true);
  view.setUint16(22, first.channels, true);
  view.setUint32(24, first.sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, first.bitsPerSample, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataLength, true);

  const bytes = new Uint8Array(output);
  let cursor = 44;
  for (const part of parts) {
    bytes.set(part.data, cursor);
    cursor += part.data.byteLength;
  }

  return new Blob([output], { type: "audio/wav" });
}

async function ensureSession(id: number, voiceId: string) {
  if (activeVoiceId !== voiceId) resetSession();
  post({ id, type: "stage", stage: "loading" });
  const session = await tts.TtsSession.create({ voiceId: voiceId as VoiceId });
  activeVoiceId = voiceId;
  return session;
}

async function handle(data: Incoming) {
  try {
    switch (data.type) {
      case "voices": {
        post({ id: data.id, type: "result", payload: await getCatalog() });
        return;
      }

      case "stored": {
        post({ id: data.id, type: "result", payload: await verifiedStoredVoices() });
        return;
      }

      case "download": {
        post({ id: data.id, type: "stage", stage: "downloading" });
        await tts.download(data.voiceId as VoiceId, (progress) => {
          if (!progress?.total) return;
          post({ id: data.id, type: "progress", loaded: progress.loaded, total: progress.total });
        });

        post({ id: data.id, type: "stage", stage: "saving" });
        await waitUntilStored(data.voiceId);
        post({ id: data.id, type: "result", payload: true });
        return;
      }

      case "remove": {
        if (activeVoiceId === data.voiceId) resetSession();
        await tts.remove(data.voiceId as VoiceId);
        post({ id: data.id, type: "result", payload: true });
        return;
      }

      case "synthesize": {
        if (!(await isVoiceFullyStored(data.voiceId))) {
          throw new WorkerFault("Download this voice before generating speech.", "VOICE_NOT_DOWNLOADED");
        }

        const controls = normalizeControls(data.controls);
        const usesNativeScaleOverrides =
          Math.abs(controls.rate - 1) > 0.001 || Math.abs(controls.expressiveness - 1) > 0.001;
        if (usesNativeScaleOverrides) await ensureOrtControlPatch();

        const session = await ensureSession(data.id, data.voiceId);
        const chunks = splitTextForSynthesis(data.text);
        if (chunks.length === 0) {
          throw new WorkerFault("Enter some text before generating speech.", "EMPTY_TEXT");
        }

        post({ id: data.id, type: "stage", stage: "generating" });

        currentInferenceControls = controls;
        const chunkWavs: Blob[] = [];
        try {
          for (let index = 0; index < chunks.length; index += 1) {
            post({
              id: data.id,
              type: "generation-progress",
              current: index + 1,
              total: chunks.length,
            });
            chunkWavs.push(await session.predict(chunks[index]));
          }
        } finally {
          currentInferenceControls = null;
        }

        post({ id: data.id, type: "stage", stage: "finalizing" });
        let wav = await mergePcmWavs(chunkWavs);
        wav = await applyWavOutputControls(wav, controls);
        const buffer = await wav.arrayBuffer();

        // Transfer instead of cloning potentially multi-megabyte audio data.
        post({ id: data.id, type: "audio", buffer }, [buffer]);
        return;
      }
    }
  } catch (error) {
    currentInferenceControls = null;
    // Failed initialization can leave the upstream singleton half-created.
    resetSession();
    const { code, message } = classify(error);
    console.error("[darma-piper]", code, error);
    post({
      id: data.id,
      type: "error",
      code,
      message,
      detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    });
  }
}

/**
 * Piper's session singleton is not concurrency-safe. Serializing every worker
 * command prevents a voice download/remove/switch from racing inference.
 */
let queue = Promise.resolve();

ctx.addEventListener("message", (event: MessageEvent<Incoming>) => {
  const data = event.data;
  queue = queue.then(() => handle(data));
});
