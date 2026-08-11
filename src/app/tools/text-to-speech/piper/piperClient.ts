"use client";

/**
 * Main-thread bridge to the Piper worker.
 *
 * Piper voice/storage work is isolated from React in a dedicated worker. The
 * ONNX session itself is initialized only when synthesis starts, so inference
 * never blocks the React thread.
 */

import type { PiperControls, PiperGenerationProgress, PiperStage } from "./piperWorker";

export type { PiperControls, PiperGenerationProgress, PiperStage } from "./piperWorker";

export type PiperVoice = {
  key: string;
  name: string;
  language: {
    code: string;
    family: string;
    region: string;
    name_native: string;
    name_english: string;
    country_english: string;
  };
  quality: string;
  num_speakers: number;
  speaker_id_map?: Record<string, number>;
  files: Record<string, { size_bytes: number; md5_digest: string }>;
  aliases: string[];
};

export type PiperProgress = { loaded: number; total: number };

export class PiperError extends Error {
  constructor(
    message: string,
    readonly code: string,
    /** Raw upstream cause. Diagnostics only — never render this to visitors. */
    readonly detail?: string,
  ) {
    super(message);
    this.name = "PiperError";
  }
}

type Handlers = {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  onProgress?: (progress: PiperProgress) => void;
  onStage?: (stage: PiperStage) => void;
  onGenerationProgress?: (progress: PiperGenerationProgress) => void;
};

type RequestOptions = {
  onProgress?: (progress: PiperProgress) => void;
  onStage?: (stage: PiperStage) => void;
  onGenerationProgress?: (progress: PiperGenerationProgress) => void;
};

export type SynthesizeOptions = RequestOptions & {
  controls?: Partial<PiperControls>;
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Handlers>();

function rejectAll(error: PiperError) {
  for (const [, handlers] of pending) handlers.reject(error);
  pending.clear();
}

export function getPiperSupport(): { supported: boolean; reason?: string } {
  if (typeof window === "undefined") return { supported: false, reason: "browser-only" };

  if (typeof Worker === "undefined" || typeof WebAssembly === "undefined") {
    return {
      supported: false,
      reason: "This browser does not provide the Web Worker and WebAssembly features required for local speech generation.",
    };
  }

  const storage = navigator.storage as StorageManager & {
    getDirectory?: () => Promise<FileSystemDirectoryHandle>;
  };
  if (typeof storage?.getDirectory !== "function") {
    return {
      supported: false,
      reason: "This browser does not support the private file storage required to cache Piper voice models.",
    };
  }

  return { supported: true };
}

function getWorker(): Worker {
  const support = getPiperSupport();
  if (!support.supported) {
    throw new PiperError(
      support.reason ?? "This browser cannot run the local speech engine.",
      "UNSUPPORTED_BROWSER",
    );
  }

  if (worker) return worker;

  worker = new Worker(new URL("./piperWorker.ts", import.meta.url), {
    type: "module",
    name: "darma-piper-tts",
  });

  worker.addEventListener("message", (event) => {
    const data = event.data as {
      id: number;
      type: string;
      payload?: unknown;
      buffer?: ArrayBuffer;
      message?: string;
      code?: string;
      detail?: string;
      loaded?: number;
      total?: number;
      stage?: PiperStage;
      current?: number;
    };

    const handlers = pending.get(data.id);
    if (!handlers) return;

    switch (data.type) {
      case "progress":
        handlers.onProgress?.({ loaded: data.loaded ?? 0, total: data.total ?? 0 });
        return;
      case "stage":
        if (data.stage) handlers.onStage?.(data.stage);
        return;
      case "generation-progress":
        handlers.onGenerationProgress?.({ current: data.current ?? 1, total: data.total ?? 1 });
        return;
      case "result":
        pending.delete(data.id);
        handlers.resolve(data.payload);
        return;
      case "audio":
        pending.delete(data.id);
        handlers.resolve(data.buffer);
        return;
      case "error":
        pending.delete(data.id);
        handlers.reject(
          new PiperError(
            data.message ?? "Speech generation failed.",
            data.code ?? "UNKNOWN",
            data.detail,
          ),
        );
        return;
    }
  });

  const failWorker = () => {
    rejectAll(
      new PiperError(
        "The local speech engine stopped unexpectedly. Reload the tool and try again.",
        "WORKER",
      ),
    );
    worker?.terminate();
    worker = null;
  };

  worker.addEventListener("error", failWorker);
  worker.addEventListener("messageerror", failWorker);

  return worker;
}

function call<T>(message: Record<string, unknown>, options: RequestOptions = {}): Promise<T> {
  const id = nextId++;

  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
      onProgress: options.onProgress,
      onStage: options.onStage,
      onGenerationProgress: options.onGenerationProgress,
    });

    try {
      getWorker().postMessage({ ...message, id });
    } catch (error) {
      pending.delete(id);
      reject(error);
    }
  });
}

export function listVoices() {
  return call<PiperVoice[]>({ type: "voices" });
}

export function storedVoices() {
  return call<string[]>({ type: "stored" });
}

export function downloadVoice(voiceId: string, onProgress?: (progress: PiperProgress) => void) {
  return call<boolean>({ type: "download", voiceId }, { onProgress });
}

export function removeVoice(voiceId: string) {
  return call<boolean>({ type: "remove", voiceId });
}

export async function synthesize(
  voiceId: string,
  text: string,
  options: SynthesizeOptions = {},
) {
  const { controls, ...requestOptions } = options;
  const buffer = await call<ArrayBuffer>(
    { type: "synthesize", voiceId, text, controls },
    requestOptions,
  );
  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Terminates all local Piper work and rejects every request that was waiting on
 * the worker. A later call lazily creates a fresh worker, so this doubles as a
 * safe cancel/retry mechanism for long synthesis runs.
 */
export function disposePiper(message = "Speech generation was cancelled.") {
  if (!worker && pending.size === 0) return;

  rejectAll(new PiperError(message, "CANCELLED"));
  worker?.terminate();
  worker = null;
}
