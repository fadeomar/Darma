/// <reference lib="webworker" />

/**
 * Piper speech synthesis, fully off the main thread.
 *
 * User text never leaves this worker. Network activity is limited to the
 * runtime/model assets that Piper needs. Voice models are stored in OPFS.
 */
import * as tts from "@mintplex-labs/piper-tts-web";

type Incoming =
  | { id: number; type: "voices" }
  | { id: number; type: "stored" }
  | { id: number; type: "download"; voiceId: string }
  | { id: number; type: "remove"; voiceId: string }
  | { id: number; type: "synthesize"; voiceId: string; text: string };

type Outgoing =
  | { id: number; type: "result"; payload: unknown }
  | { id: number; type: "audio"; buffer: ArrayBuffer }
  | { id: number; type: "error"; message: string; code: string; detail?: string }
  | { id: number; type: "progress"; loaded: number; total: number }
  | { id: number; type: "stage"; stage: PiperStage };

export type PiperStage = "downloading" | "saving" | "loading" | "generating";

const ctx = self as unknown as DedicatedWorkerGlobalScope;
type VoiceId = Parameters<typeof tts.download>[0];

class WorkerFault extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "WorkerFault";
  }
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

  return {
    code: "UNKNOWN",
    message: "Speech generation failed. Try again, or choose another voice.",
  };
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

type VoiceRecord = Awaited<ReturnType<typeof tts.voices>>[number];
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
 * Upstream `download()` starts OPFS writes but does not await `writeBlob()`.
 * Upstream `stored()` only checks for an `.onnx` filename, so it can report a
 * model before the write is complete. Verify both model/config file sizes
 * against Piper voice metadata before Darma reports the voice as Downloaded.
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
          throw new WorkerFault(
            "Download this voice before generating speech.",
            "VOICE_NOT_DOWNLOADED",
          );
        }

        const session = await ensureSession(data.id, data.voiceId);
        post({ id: data.id, type: "stage", stage: "generating" });
        const wav = await session.predict(data.text);
        const buffer = await wav.arrayBuffer();

        // Transfer instead of cloning potentially multi-megabyte audio data.
        post({ id: data.id, type: "audio", buffer }, [buffer]);
        return;
      }
    }
  } catch (error) {
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
