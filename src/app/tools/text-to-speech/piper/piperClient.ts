"use client";

/**
 * Main-thread bridge to {@link ./piperWorker}. Keeps one worker for the page
 * and correlates replies by request id so several calls can be in flight.
 *
 * The worker (and the ~1 MB of Piper/ONNX glue it pulls in) is only created on
 * first use, so opening the tool costs nothing until the visitor acts.
 */

import type { SynthesisStage } from "./piperWorker";

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
  files: Record<string, { size_bytes: number; md5_digest: string }>;
  aliases: string[];
};

export type PiperProgress = { loaded: number; total: number };

export class PiperError extends Error {
  constructor(
    message: string,
    readonly code: string,
    /** Raw upstream cause. Diagnostics only — never rendered to the visitor. */
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
  onStage?: (stage: SynthesisStage) => void;
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Handlers>();

function getWorker(): Worker {
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
      stage?: SynthesisStage;
    };

    const handlers = pending.get(data.id);
    if (!handlers) return;

    switch (data.type) {
      case "progress":
        handlers.onProgress?.({ loaded: data.loaded ?? 0, total: data.total ?? 0 });
        return;
      case "stage":
        handlers.onStage?.(data.stage as SynthesisStage);
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
          new PiperError(data.message ?? "Speech generation failed.", data.code ?? "UNKNOWN", data.detail),
        );
        return;
    }
  });

  worker.addEventListener("error", () => {
    // A worker-level failure kills every in-flight request; fail them all
    // rather than leaving the UI spinning forever.
    const failure = new PiperError(
      "The speech engine could not start in this browser. Try a recent Chrome, Edge, or Firefox.",
      "WORKER",
    );
    for (const [, handlers] of pending) handlers.reject(failure);
    pending.clear();
    worker = null;
  });

  return worker;
}

function call<T>(
  message: Record<string, unknown>,
  options: { onProgress?: (progress: PiperProgress) => void; onStage?: (stage: SynthesisStage) => void } = {},
): Promise<T> {
  const id = nextId++;

  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
      onProgress: options.onProgress,
      onStage: options.onStage,
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
  options: { onProgress?: (progress: PiperProgress) => void; onStage?: (stage: SynthesisStage) => void } = {},
) {
  const buffer = await call<ArrayBuffer>({ type: "synthesize", voiceId, text }, options);
  return new Blob([buffer], { type: "audio/wav" });
}

/** Frees the worker (and its ONNX session) when the tool unmounts. */
export function disposePiper() {
  if (!worker) return;
  worker.terminate();
  worker = null;
  pending.clear();
}
