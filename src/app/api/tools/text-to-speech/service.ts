const LOCAL_TTS_URL = "http://127.0.0.1:5050";

export function getTtsServiceUrl(): string | null {
  const configured = process.env.TTS_SERVICE_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_TTS_URL;
  }

  return null;
}

export function ttsUnavailableResponse() {
  return Response.json(
    {
      error: {
        code: "TTS_SERVICE_NOT_CONFIGURED",
        message:
          "Text-to-speech is not configured on this deployment. Set TTS_SERVICE_URL to the Piper TTS service origin.",
      },
    },
    { status: 503 },
  );
}

export function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
}

/**
 * The Piper service is an internal origin, so its raw error bodies (stack
 * traces, model paths, upstream hostnames) must never reach the browser. Only
 * the status class is preserved so the client can still tell "your request was
 * rejected" apart from "the service is broken".
 */
export function upstreamErrorResponse(context: "voices" | "synthesis", upstreamStatus: number) {
  const isClientFault = upstreamStatus >= 400 && upstreamStatus < 500;
  const status = isClientFault ? 400 : 502;

  const message = isClientFault
    ? context === "voices"
      ? "The text-to-speech service rejected the voices request."
      : "The text-to-speech service rejected this text or voice."
    : context === "voices"
      ? "The text-to-speech service failed to list voices."
      : "The text-to-speech service failed to generate speech.";

  return Response.json(
    {
      error: {
        code: isClientFault ? "TTS_REQUEST_REJECTED" : "TTS_SERVICE_ERROR",
        message,
      },
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function ttsFailureResponse(context: "voices" | "synthesis", error: unknown) {
  const timedOut = error instanceof Error && error.name === "AbortError";

  return Response.json(
    {
      error: {
        code: timedOut
          ? context === "voices"
            ? "TTS_SERVICE_TIMEOUT"
            : "TTS_SYNTHESIS_TIMEOUT"
          : "TTS_SERVICE_UNAVAILABLE",
        message: timedOut
          ? context === "voices"
            ? "The text-to-speech service did not respond in time."
            : "Speech generation took too long. Try a shorter passage."
          : "The text-to-speech service is unavailable.",
      },
    },
    { status: timedOut ? 504 : 502, headers: { "Cache-Control": "no-store" } },
  );
}
