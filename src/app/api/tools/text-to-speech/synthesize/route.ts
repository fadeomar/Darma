import {
  createTimeoutSignal,
  getTtsServiceUrl,
  ttsFailureResponse,
  ttsUnavailableResponse,
  upstreamErrorResponse,
} from "../service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_TEXT_LENGTH = 5_000;
const MAX_VOICE_ID_LENGTH = 160;
// Piper voice keys look like `en_US-lessac-medium`; dots appear in some packs.
// Everything else (slashes, whitespace, control characters) stays rejected.
const VOICE_ID_PATTERN = /^[a-zA-Z0-9._-]+$/;

type SynthesisPayload = {
  text?: unknown;
  voiceId?: unknown;
};

function invalidRequest(message: string) {
  return Response.json(
    { error: { code: "INVALID_SYNTHESIS_REQUEST", message } },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  const serviceUrl = getTtsServiceUrl();
  if (!serviceUrl) return ttsUnavailableResponse();

  let payload: SynthesisPayload;

  try {
    payload = (await request.json()) as SynthesisPayload;
  } catch {
    return invalidRequest("Request body must be valid JSON.");
  }

  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  const voiceId = typeof payload.voiceId === "string" ? payload.voiceId.trim() : "";

  if (!text) return invalidRequest("Text is required.");
  if (text.length > MAX_TEXT_LENGTH) {
    return invalidRequest(`Text must be ${MAX_TEXT_LENGTH.toLocaleString()} characters or fewer.`);
  }

  if (!voiceId) return invalidRequest("Voice is required.");
  if (voiceId.length > MAX_VOICE_ID_LENGTH || !VOICE_ID_PATTERN.test(voiceId)) {
    return invalidRequest("Voice ID is invalid.");
  }

  const timeout = createTimeoutSignal(50_000);

  try {
    const upstream = await fetch(`${serviceUrl}/api/synthesize`, {
      method: "POST",
      cache: "no-store",
      signal: timeout.signal,
      headers: {
        Accept: "audio/wav, application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, voiceId }),
    });

    if (!upstream.ok) {
      // Drain the body so the socket is released, but never forward it.
      await upstream.text().catch(() => undefined);
      return upstreamErrorResponse("synthesis", upstream.status);
    }

    // A 200 that is not audio (an HTML proxy page, a JSON envelope) would end up
    // as a broken object URL in the player, so it is treated as an upstream fault.
    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("audio/")) {
      await upstream.text().catch(() => undefined);
      return Response.json(
        {
          error: {
            code: "TTS_INVALID_AUDIO_RESPONSE",
            message: "The text-to-speech service did not return audio.",
          },
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Streamed straight through — the WAV is never buffered or re-encoded here.
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": 'inline; filename="tts.wav"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return ttsFailureResponse("synthesis", error);
  } finally {
    timeout.clear();
  }
}
