import { BACKGROUND_MODEL_ID, backgroundModelBackend, createBackgroundMask } from "./smart";
import type { ProgressInfo, Tensor } from "@huggingface/transformers";
import type { BackgroundMask, BackgroundRemovalProgress } from "./types";

type ProgressCallback = (progress: BackgroundRemovalProgress) => void;

const MAX_MODEL_INPUT_EDGE = 1600;

type RawImageStatic = (typeof import("@huggingface/transformers"))["RawImage"];
type RawImageInstance = InstanceType<RawImageStatic>;

/**
 * Transformers.js exposes the model/processor entry points through an internal
 * `_call` member rather than a published call signature, so the loaded
 * instances are not callable under their own types. These two shapes describe
 * exactly the surface this module uses and are applied with a single cast where
 * the bundle is assembled.
 */
type BackgroundModel = (inputs: { input_image: Tensor }) => Promise<{ output_image?: Tensor[] }>;
type BackgroundProcessor = (image: RawImageInstance) => Promise<{ pixel_values: Tensor }>;

type ModelBundle = {
  model: BackgroundModel;
  processor: BackgroundProcessor;
  RawImage: RawImageStatic;
  backend: "webgpu" | "wasm";
};

const cachedBundles = new Map<"webgpu" | "wasm", Promise<ModelBundle>>();

function report(callback: ProgressCallback | undefined, patch: Partial<BackgroundRemovalProgress>) {
  if (!callback) return;
  callback({
    status: patch.status ?? "loading",
    percent: Math.max(0, Math.min(100, patch.percent ?? 0)),
    message: patch.message ?? "Preparing local background removal…",
    backend: patch.backend,
  });
}

async function loadBundle(onProgress?: ProgressCallback, forcedBackend?: "webgpu" | "wasm"): Promise<ModelBundle> {
  const backend = forcedBackend ?? backgroundModelBackend();
  const cached = cachedBundles.get(backend);
  if (cached) return cached;
  const loading = (async () => {
    report(onProgress, { status: "loading", percent: 1, message: "Loading the background-removal model on demand…", backend });

    // Kept as a normal dynamic import so Next can split the ML runtime out of
    // the editor's initial bundle. The dependency is never evaluated until the
    // user explicitly clicks Remove background.
    const { AutoModel, AutoProcessor, RawImage } = await import("@huggingface/transformers");
    const dtype = backend === "webgpu" ? "fp16" : "fp32";
    let lastProgress = 2;
    const progress_callback = (event: ProgressInfo) => {
      if (event?.status !== "progress") return;
      const raw = Number(event.progress ?? 0);
      const percent = raw <= 1 ? raw * 100 : raw;
      lastProgress = Math.max(lastProgress, Math.min(94, Math.round(percent * 0.92)));
      report(onProgress, { status: "loading", percent: lastProgress, message: "Downloading and caching the local model…", backend });
    };

    const model = await AutoModel.from_pretrained(BACKGROUND_MODEL_ID, {
      device: backend,
      dtype,
      progress_callback,
    });
    const processor = await AutoProcessor.from_pretrained(BACKGROUND_MODEL_ID, { progress_callback });
    report(onProgress, { status: "loading", percent: 96, message: "Model ready. Preparing the image…", backend });
    return {
      model: model as unknown as BackgroundModel,
      processor: processor as unknown as BackgroundProcessor,
      RawImage,
      backend,
    };
  })().catch((error) => {
    cachedBundles.delete(backend);
    throw error;
  });
  cachedBundles.set(backend, loading);
  return loading;
}

export async function removeBackgroundLocally(
  sourceUrl: string,
  onProgress?: ProgressCallback,
  forcedBackend?: "webgpu" | "wasm",
): Promise<BackgroundMask> {
  const { model, processor, RawImage, backend } = await loadBundle(onProgress, forcedBackend);
  report(onProgress, { status: "processing", percent: 97, message: "Finding the foreground on this device…", backend });

  const sourceImage = await RawImage.fromURL(sourceUrl);
  const longestEdge = Math.max(sourceImage.width, sourceImage.height);
  const scale = longestEdge > MAX_MODEL_INPUT_EDGE ? MAX_MODEL_INPUT_EDGE / longestEdge : 1;
  const image = scale < 1
    ? await sourceImage.resize(Math.max(1, Math.round(sourceImage.width * scale)), Math.max(1, Math.round(sourceImage.height * scale)))
    : sourceImage;
  const { pixel_values } = await processor(image);
  const result = await model({ input_image: pixel_values });
  const tensor = result?.output_image?.[0];
  if (!tensor) throw new Error("The local model returned no foreground mask.");
  const maskImage = await RawImage.fromTensor(tensor.sigmoid().mul(255).to("uint8")).resize(image.width, image.height);
  const mask = createBackgroundMask(maskImage.width, maskImage.height, maskImage.data);
  report(onProgress, { status: "ready", percent: 100, message: "Background mask ready. The image never left this browser.", backend });
  return mask;
}

export function releaseBackgroundModel() {
  // Transformers.js model objects expose dispose() on supported versions, but
  // we intentionally avoid reaching into a pending promise here. Reloading the
  // page remains the reliable way to release all WebGPU/WASM allocations.
  cachedBundles.clear();
}
