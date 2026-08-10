/// <reference lib="webworker" />

/**
 * Piper speech synthesis, off the main thread.
 *
 * `@mintplex-labs/piper-tts-web` documents `predict()` as running "in a new
 * worker thread", but its implementation does not spawn one — inference would
 * run wherever it is called. ONNX inference on a 60 MB model blocks for
 * seconds, so the tool owns this worker instead and the UI thread stays free.
 *
 * Nothing here ever sends the user's text anywhere: the only network traffic is
 * the voice model / runtime asset download performed by the library.
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
  | { id: number; type: "stage"; stage: SynthesisStage };

export type SynthesisStage = "downloading" | "loading" | "generating";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

/**
 * `TtsSession` is a singleton internally: its constructor returns the existing
 * instance and only reassigns `voiceId`, while the loaded ONNX session and
 * model config still belong to the previous voice. Switching voices therefore
 * has to clear the static instance, or the new voice silently renders with the
 * old model.
 */
let activeVoiceId: string | null = null;

function resetSession() {
  (tts.TtsSession as unknown as { _instance: unknown })._instance = null;
  activeVoiceId = null;
}

function post(message: Outgoing, transfer?: Transferable[]) {
  ctx.postMessage(message, transfer ?? []);
}

/** Upstream failures are network/WASM noise; map them to something actionable. */
function classify(error: unknown): { code: string; message: string } {
  const raw = error instanceof Error ? error.message : String(error);

  if (/quota|storage|NotAllowedError|QuotaExceeded/i.test(raw)) {
    return {
      code: "STORAGE",
      message: "Not enough browser storage to save this voice. Free up space and try again.",
    };
  }
  if (/fetch|network|Failed to fetch|NetworkError|ERR_/i.test(raw)) {
    return {
      code: "NETWORK",
      message: "The voice model could not be downloaded. Check your connection and try again.",
    };
  }
  if (/wasm|WebAssembly|ort-|onnxruntime/i.test(raw)) {
    return {
      code: "RUNTIME",
      message: "The speech engine could not start in this browser. Try a recent Chrome, Edge, or Firefox.",
    };
  }
  return { code: "UNKNOWN", message: "Speech generation failed. Try again, or pick another voice." };
}

async function ensureSession(id: number, voiceId: string, alreadyStored: boolean) {
  if (activeVoiceId !== voiceId) resetSession();

  post({ id, type: "stage", stage: alreadyStored ? "loading" : "downloading" });

  const session = await tts.TtsSession.create({
    voiceId,
    progress: (progress) => {
      if (!progress?.total) return;
      post({ id, type: "progress", loaded: progress.loaded, total: progress.total });
    },
  });

  activeVoiceId = voiceId;
  return session;
}

ctx.addEventListener("message", async (event: MessageEvent<Incoming>) => {
  const data = event.data;

  try {
    switch (data.type) {
      case "voices": {
        post({ id: data.id, type: "result", payload: await tts.voices() });
        return;
      }

      case "stored": {
        post({ id: data.id, type: "result", payload: await tts.stored() });
        return;
      }

      case "download": {
        await tts.download(data.voiceId, (progress) => {
          if (!progress?.total) return;
          post({ id: data.id, type: "progress", loaded: progress.loaded, total: progress.total });
        });
        post({ id: data.id, type: "result", payload: true });
        return;
      }

      case "remove": {
        // Dropping the cached model invalidates a session bound to it.
        if (activeVoiceId === data.voiceId) resetSession();
        await tts.remove(data.voiceId);
        post({ id: data.id, type: "result", payload: true });
        return;
      }

      case "synthesize": {
        const stored = await tts.stored();
        const session = await ensureSession(data.id, data.voiceId, stored.includes(data.voiceId));

        post({ id: data.id, type: "stage", stage: "generating" });
        const wav = await session.predict(data.text);
        const buffer = await wav.arrayBuffer();

        // Transferred, not copied — a long clip can be several MB.
        post({ id: data.id, type: "audio", buffer }, [buffer]);
        return;
      }
    }
  } catch (error) {
    // A failed init leaves the singleton half-built; drop it so a retry is clean.
    resetSession();
    const { code, message } = classify(error);
    // Raw cause goes to the worker console only (never the UI, never telemetry)
    // so a failure is diagnosable without exposing internals to the visitor.
    console.error("[piper]", code, error);
    post({
      id: data.id,
      type: "error",
      code,
      message,
      detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    });
  }
});
