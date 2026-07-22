"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadPhotoFile, releaseLoadedPhoto } from "../lib/imageSafety";
import type { LoadedPhoto, ToolStatus } from "../types";

export function useImageSource(onStatus: (status: ToolStatus) => void) {
  const [photo, setPhoto] = useState<LoadedPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const photoRef = useRef<LoadedPhoto | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const replacePhoto = useCallback((next: LoadedPhoto | null) => {
    releaseLoadedPhoto(photoRef.current);
    photoRef.current = next;
    setPhoto(next);
  }, []);

  const load = useCallback(async (file: File | null | undefined) => {
    if (!file) return false;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    const result = await loadPhotoFile(file, controller.signal);
    if (controller.signal.aborted) return false;
    setLoading(false);
    if (result.ok === false) {
      onStatus({ tone: "error", message: result.error });
      return false;
    }
    replacePhoto(result.photo);
    onStatus({
      tone: result.warning ? "warning" : "success",
      message: result.warning ?? `Loaded ${result.photo.info.fileName} (${result.photo.info.width}×${result.photo.info.height}).`,
    });
    return true;
  }, [onStatus, replacePhoto]);

  const remove = useCallback(() => {
    controllerRef.current?.abort();
    setLoading(false);
    replacePhoto(null);
  }, [replacePhoto]);

  useEffect(() => () => {
    controllerRef.current?.abort();
    releaseLoadedPhoto(photoRef.current);
    photoRef.current = null;
  }, []);

  return { photo, loading, load, remove };
}
