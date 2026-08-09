import {
  createTimeoutSignal,
  getTtsServiceUrl,
  ttsFailureResponse,
  ttsUnavailableResponse,
  upstreamErrorResponse,
} from "../service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UpstreamVoice = { id?: unknown };

/** Accepts both `[...]` and `{ voices: [...] }` upstream shapes. */
function extractVoiceList(payload: unknown): UpstreamVoice[] | null {
  if (Array.isArray(payload)) return payload as UpstreamVoice[];

  if (typeof payload === "object" && payload !== null) {
    const { voices } = payload as { voices?: unknown };
    if (Array.isArray(voices)) return voices as UpstreamVoice[];
  }

  return null;
}

export async function GET() {
  const serviceUrl = getTtsServiceUrl();
  if (!serviceUrl) return ttsUnavailableResponse();

  const timeout = createTimeoutSignal(10_000);

  try {
    const upstream = await fetch(`${serviceUrl}/api/voices`, {
      cache: "no-store",
      signal: timeout.signal,
      headers: { Accept: "application/json" },
    });

    if (!upstream.ok) {
      await upstream.text().catch(() => undefined);
      return upstreamErrorResponse("voices", upstream.status);
    }

    const body = await upstream.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      // A proxy error page or plain-text response would otherwise surface as a
      // raw JSON.parse message in the browser.
      return Response.json(
        {
          error: {
            code: "TTS_INVALID_VOICES_RESPONSE",
            message: "The text-to-speech service returned an unreadable voice list.",
          },
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const list = extractVoiceList(parsed);
    if (!list) {
      return Response.json(
        {
          error: {
            code: "TTS_INVALID_VOICES_RESPONSE",
            message: "The text-to-speech service returned an unexpected voice list.",
          },
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Entries are passed through as-is (the client only reads id/language/gender),
    // but anything without a usable id is dropped so the selector cannot break.
    const voices = list.filter(
      (voice) => typeof voice === "object" && voice !== null && typeof voice.id === "string" && voice.id.length > 0,
    );

    return Response.json({ voices }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return ttsFailureResponse("voices", error);
  } finally {
    timeout.clear();
  }
}
