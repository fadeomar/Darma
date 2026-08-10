"use client";

// TEMPORARY Phase 47 proof-of-concept. Deleted once browser synthesis is
// integrated into the real tool.

import { useState } from "react";
import { listVoices, storedVoices, synthesize } from "../tools/text-to-speech/piper/piperClient";

export default function Page() {
  const [log, setLog] = useState<string[]>([]);
  const [url, setUrl] = useState<string | null>(null);
  const say = (line: string) => setLog((prev) => [...prev, `${new Date().toISOString().slice(11, 23)}  ${line}`]);

  async function run(voiceId: string, text: string) {
    setUrl(null);
    const t0 = performance.now();
    try {
      say(`stored before: ${JSON.stringify(await storedVoices())}`);
      const blob = await synthesize(voiceId, text, {
        onStage: (stage) => say(`stage: ${stage} (+${Math.round(performance.now() - t0)}ms)`),
        onProgress: (p) => {
          const pct = Math.round((p.loaded / p.total) * 100);
          if (pct % 20 === 0) say(`download ${pct}%  ${(p.loaded / 1e6).toFixed(1)}/${(p.total / 1e6).toFixed(1)} MB`);
        },
      });
      say(`DONE in ${Math.round(performance.now() - t0)}ms — ${blob.size} bytes, type=${blob.type}`);
      say(`stored after: ${JSON.stringify(await storedVoices())}`);
      setUrl(URL.createObjectURL(blob));
      (window as unknown as Record<string, unknown>).__pocResult = {
        ok: true,
        bytes: blob.size,
        ms: Math.round(performance.now() - t0),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const detail = (error as { detail?: string })?.detail;
      const code = (error as { code?: string })?.code;
      say(`ERROR [${code}]: ${message}`);
      if (detail) say(`RAW: ${detail}`);
      (window as unknown as Record<string, unknown>).__pocResult = { ok: false, error: message, detail, code };
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "monospace" }}>
      <h1>Piper browser POC</h1>
      <button id="poc-run" onClick={() => void run("en_US-kathleen-low", "Hello from Darma, generated in the browser.")}>
        Run kathleen-low
      </button>
      <button id="poc-voices" onClick={async () => say(`voices: ${(await listVoices()).length}`)}>
        List voices
      </button>
      {url ? <audio id="poc-audio" controls src={url} style={{ display: "block", marginTop: 16 }} /> : null}
      <pre id="poc-log" style={{ marginTop: 16, fontSize: 12 }}>
        {log.join("\n")}
      </pre>
    </div>
  );
}
