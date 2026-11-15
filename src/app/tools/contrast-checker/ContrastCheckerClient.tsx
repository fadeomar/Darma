"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Check, Copy, Download, Info, Pipette, RotateCcw, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { buildCss, buildReport, checkContrast, colorCss, colorInput, DEFAULT_SETTINGS, findAlternatives, formatRatio, parseColor, readSettings, serializeSettings, TARGETS, toHex, type Color, type Settings, type Target } from "./contrast";
import styles from "./contrast.module.css";

type EyeDropperWindow = Window & { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } };

function ColorField({ kind, value, onChange, canPick, onPick }: { kind: "foreground" | "background"; value: string; onChange: (value: string) => void; canPick: boolean; onPick: () => void }) {
  const parsed = parseColor(value), invalid = !parsed || (kind === "background" && parsed.a !== 1), id = `contrast-${kind}`;
  return <div className={styles.colorField}>
    <label htmlFor={id}>{kind === "foreground" ? "Text color" : "Background color"}</label>
    <div className={styles.colorInput}>
      <input className={styles.picker} type="color" aria-label={`Pick ${kind === "foreground" ? "text" : "background"} color`} value={parsed ? toHex(parsed) : "#777777"} onChange={(event) => {
        const next = parseColor(event.target.value)!; onChange(colorInput({ ...next, a: kind === "foreground" ? parsed?.a ?? 1 : 1 }));
      }} />
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} maxLength={120} spellCheck={false} autoComplete="off" aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : "contrast-formats"} className={styles.colorText} />
      {canPick && <Button size="icon" variant="ghost" aria-label={`Sample ${kind === "foreground" ? "text" : "background"} color from screen`} onClick={onPick}><Pipette className="h-4 w-4" aria-hidden /></Button>}
    </div>
    {invalid && <p id={`${id}-error`} className={styles.error}>{parsed ? "Use an opaque background so the contrast can be calculated." : "Enter a valid HEX, RGB, or HSL color."}</p>}
  </div>;
}
function Sample({ foreground, background, mode, text }: { foreground: Color; background: Color; mode: "text" | "ui"; text: string }) {
  return <div className={styles.sample} style={{ backgroundColor: colorCss(background) }} role="img" aria-label={`Color preview: ${text}. This is sample content; use the contrast results for the selected target.`}>
    <div style={{ color: colorCss(foreground) }} aria-hidden="true">
      {mode === "text" ? <><span className={styles.sampleEyebrow}>A LITTLE MORE CLARITY</span><p className={styles.sampleTitle}>{text || "Good design is for everyone."}</p><p className={styles.sampleBody}>The right contrast makes everyday things easier to read, use, and enjoy.</p><span className={styles.sampleLink}>Explore the possibilities ↗</span></> : <><p className={styles.sampleTitle}>Make yourself at home.</p><p className={styles.sampleBody}>Helpful details. Clear next steps.</p><div className={styles.exampleField}>Your email address</div><div className={styles.exampleButton}>Get started ↗</div></>}
    </div>
  </div>;
}

export default function ContrastCheckerClient() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [change, setChange] = useState<"foreground" | "background">("foreground");
  const [mode, setMode] = useState<"text" | "ui">("text");
  const [text, setText] = useState("Good design is for everyone.");
  const [previous, setPrevious] = useState<Settings | null>(null);
  const [canPick, setCanPick] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [fallback, setFallback] = useState("");
  const result = useMemo(() => checkContrast(settings), [settings]);
  const alternatives = useMemo(() => findAlternatives(settings, change), [settings, change]);
  const selected = TARGETS[settings.target], pass = !!result && result.ratio >= selected.minimum;
  const parsedForeground = parseColor(settings.foreground);
  useEffect(() => {
    setCanPick("EyeDropper" in window && window.isSecureContext);
    let lastSearch: string | undefined;
    function restore() {
      if (lastSearch === window.location.search) return;
      lastSearch = window.location.search;
      const params = new URLSearchParams(window.location.search);
      if (!["fg", "bg", "target"].some((key) => params.has(key))) { setSettings(DEFAULT_SETTINGS); return; }
      const shared = readSettings(window.location.search);
      setSettings(shared ?? DEFAULT_SETTINGS);
      setPrevious(null);
      if (!shared) setFeedback("This shared link has invalid settings. The default pair is shown.");
    }
    restore(); window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setAnnouncement(result ? `${formatRatio(result.ratio)} to 1. ${selected.label}: ${pass ? "Pass" : "Fail"}. Requires ${selected.minimum} to 1.` : "Contrast unavailable. Check the color inputs."), 350);
    return () => window.clearTimeout(timer);
  }, [result, selected, pass]);
  function update(key: "foreground" | "background", value: string) { setSettings((current) => ({ ...current, [key]: value })); setFeedback(""); setFallback(""); }
  async function pick(key: "foreground" | "background") {
    const Picker = (window as EyeDropperWindow).EyeDropper;
    if (!Picker) return;
    try {
      const picked = await new Picker().open(), color = parseColor(picked.sRGBHex);
      if (color) update(key, colorInput({ ...color, a: key === "foreground" ? parsedForeground?.a ?? 1 : 1 }));
    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setFeedback("Screen picker unavailable. Use the color swatch or enter a value."); }
  }
  async function copy(value: string, label: string) {
    if (!value) return;
    try { await navigator.clipboard.writeText(value); setFeedback(`${label} copied.`); setFallback(""); }
    catch { setFeedback("Clipboard unavailable. Select and copy the text below."); setFallback(value); }
  }
  function share() {
    if (!result) return;
    const url = new URL(window.location.href); url.search = serializeSettings(settings); url.hash = "";
    void copy(url.toString(), "Share link");
  }
  function downloadCss() {
    const blob = new Blob([buildCss(settings)], { type: "text/css;charset=utf-8" }), url = URL.createObjectURL(blob), anchor = document.createElement("a");
    anchor.href = url; anchor.download = "darma-contrast.css"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000); setFeedback("CSS file downloaded.");
  }
  return <div className={styles.root}>
    <p className="sr-only" role="status">{announcement}</p>
    <div className={styles.workspace}>
      <section className={styles.inputs} aria-labelledby="contrast-colors-heading">
        <div className={styles.sectionHeader}><h2 id="contrast-colors-heading">Your colors</h2><Button size="sm" variant="ghost" onClick={() => { setSettings(DEFAULT_SETTINGS); setPrevious(null); setFeedback("Default colors restored."); setFallback(""); }}>Reset</Button></div>
        <ColorField kind="foreground" value={settings.foreground} onChange={(value) => update("foreground", value)} canPick={canPick} onPick={() => void pick("foreground")} />
        <div className={styles.swap}><Button size="sm" variant="ghost" disabled={!result || result.foreground.a !== 1} onClick={() => setSettings((current) => ({ ...current, foreground: current.background, background: current.foreground }))} leftIcon={<ArrowDownUp className="h-3.5 w-3.5" aria-hidden />}>Swap colors</Button></div>
        <ColorField kind="background" value={settings.background} onChange={(value) => update("background", value)} canPick={canPick} onPick={() => void pick("background")} />
        <p id="contrast-formats" className={styles.hint}>HEX, RGB, or HSL. Text transparency supported.</p>
        <div className={styles.opacity}><label htmlFor="contrast-opacity">Text opacity <output>{parsedForeground ? `${Number((parsedForeground.a * 100).toFixed(1))}%` : "—"}</output></label><input id="contrast-opacity" type="range" min="0" max="100" step="1" disabled={!parsedForeground} value={parsedForeground ? parsedForeground.a * 100 : 100} onChange={(event) => { if (parsedForeground) update("foreground", colorInput({ ...parsedForeground, a: Number(event.target.value) / 100 })); }} />{parsedForeground && parsedForeground.a < 1 && <p className={styles.hint}>Blended over the background below. Swapping requires opaque colors.</p>}</div>
        <div className={styles.target}><label htmlFor="contrast-target">Check for</label><Select id="contrast-target" value={settings.target} onChange={(event) => setSettings((current) => ({ ...current, target: event.target.value as Target }))}>{Object.entries(TARGETS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</Select></div>
        <div className={styles.presets}><span>Try a pair</span><div><Button size="sm" variant="outline" onClick={() => { setSettings(DEFAULT_SETTINGS); setPrevious(null); }}>Low contrast</Button><Button size="sm" variant="outline" onClick={() => { setSettings({ foreground: "#FFFFFF", background: "#CC4715", target: "normal-aa" }); setPrevious(null); }}>Brand color</Button></div></div>
        <p className={styles.local}><ShieldCheck size={17} aria-hidden /><span>No account. No uploads.<br />Your colors stay on your device.</span></p>
      </section>
      <section className={styles.results} aria-label="Contrast results">
        <div className={styles.score}><div className={styles.ratioBlock}><span className={styles.eyebrow}>CONTRAST RATIO</span><div className={styles.ratio}><strong data-testid="contrast-ratio">{result ? formatRatio(result.ratio) : "—"}</strong><span>:1</span></div></div><div className={styles.verdict}><span className={`${styles.status} ${result && pass ? styles.success : result ? styles.failure : styles.neutral}`} data-testid="contrast-status">{result ? pass ? <Check size={16} aria-hidden /> : <X size={16} aria-hidden /> : <Info size={16} aria-hidden />}{result ? pass ? "Pass" : "Fail" : "Unavailable"}</span><p>{result ? pass ? `Meets ${selected.label}.` : `${selected.label} requires at least ${selected.minimum}:1.` : "Enter two valid colors to check."}</p></div></div>
        <div className={styles.previewHeader}><span>Live preview</span><div role="group" aria-label="Preview style">{(["text", "ui"] as const).map((item) => <button key={item} type="button" aria-pressed={mode === item} onClick={() => setMode(item)}>{item === "text" ? "Text" : "UI"}</button>)}</div></div>
        {result ? <Sample foreground={result.foreground} background={result.background} mode={mode} text={text} /> : <div className={styles.unavailable}>Your preview will appear when both colors are valid.</div>}
        <div className={styles.checks}><div className={styles.checksHeader}><h3>All contrast checks</h3><span>Required ratio</span></div><ul>{(Object.keys(TARGETS) as Target[]).map((id) => {
          const item = TARGETS[id], checkPass = result && result.ratio >= item.minimum;
          return <li key={id}><span>{item.label}</span><span className={styles.minimum}>{item.minimum}:1</span><span className={result ? checkPass ? styles.passText : styles.failText : styles.muted}>{result ? checkPass ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden /> : null}{result ? checkPass ? "Pass" : "Fail" : "—"}</span></li>;
        })}</ul></div>
        <div className={styles.actions}><Button size="sm" variant="secondary" disabled={!result} leftIcon={<Copy size={14} aria-hidden />} onClick={() => void copy(buildReport(settings), "Result")}>Copy result</Button><Button size="sm" variant="ghost" disabled={!result} onClick={share}>Share link</Button></div>
      </section>
    </div>
    <section className={styles.fixes} aria-labelledby="contrast-fix-heading">
      <div className={styles.fixIntro}><div><span className={styles.eyebrow}>KEEP THE FEEL. IMPROVE THE READABILITY.</span><h2 id="contrast-fix-heading">Find a readable alternative.</h2><p>Keep one color. Adjust the other. You choose what changes.</p></div><div className={styles.fixControls}><label htmlFor="contrast-adjust">Adjust</label><Select id="contrast-adjust" value={change} onChange={(event) => setChange(event.target.value as typeof change)} width="auto"><option value="foreground">Text color</option><option value="background">Background</option></Select>{previous && <Button size="sm" variant="secondary" leftIcon={<RotateCcw size={14} aria-hidden />} onClick={() => { setSettings(previous); setPrevious(null); setFeedback("Previous colors restored."); }}>Undo</Button>}</div></div>
      {!result ? <div className={styles.empty}>Enter two valid colors to see alternatives.</div> : pass ? <div className={styles.already}><Check size={20} aria-hidden /><div><strong>Your pair already meets {selected.label}.</strong><p>Try a stricter target, or copy your result and keep moving.</p></div></div> : alternatives.length ? <div className={styles.alternatives}>{alternatives.map((alternative, index) => {
        const next = checkContrast({ ...settings, [change]: alternative.value })!;
        return <article key={alternative.value} className={styles.alternative}><div className={styles.altPreview} style={{ backgroundColor: colorCss(next.background) }} aria-hidden="true"><span style={{ color: colorCss(next.foreground) }}>Aa</span><span style={{ color: colorCss(next.foreground) }}>{index === 0 ? "Similar tone" : "More contrast"}</span></div><div className={styles.altBody}><div className={styles.altMeta}><code>{toHex(next[change])}</code><span className={styles.passText}><Check size={13} aria-hidden />{formatRatio(alternative.ratio)}:1</span></div><p className={styles.hint}>{selected.label} · Pass{next.foreground.a < 1 ? ` · ${Number((next.foreground.a * 100).toFixed(1))}% text opacity` : ""}</p><Button fullWidth variant={index === 0 ? "primary" : "soft"} onClick={() => { setPrevious(settings); setSettings({ ...settings, [change]: alternative.value }); setFeedback(`Alternative applied to ${change === "foreground" ? "text color" : "background"}. Use Undo to compare.`); setFallback(""); }}>Apply {change === "foreground" ? "text color" : "background"}</Button></div></article>;
      })}</div> : <div className={styles.empty}>No matching alternative with these settings. Increase text opacity or try adjusting the other color.</div>}
    </section>
    <div role="status" className={styles.feedback}>{feedback}</div>
    {fallback && <div className={styles.fallback}><label htmlFor="contrast-copy-fallback">Select and copy</label><textarea id="contrast-copy-fallback" value={fallback} readOnly rows={6} onFocus={(event) => event.target.select()} /></div>}
    <details className={styles.details}><summary>Customize preview & export CSS</summary><div className={styles.detailsContent}><label htmlFor="contrast-preview-text">Preview headline</label><Input id="contrast-preview-text" value={text} maxLength={100} onChange={(event) => setText(event.target.value)} /><p className={styles.hint}>Preview styling does not change your selected WCAG target.</p>{result && result.foreground.a < 1 && <p className={styles.hint}>Effective text color: {colorCss(result.effective)}. Contrast uses this blend without rounding.</p>}<pre><code>{result ? buildCss(settings) : "Enter valid colors to export CSS."}</code></pre><div className={styles.actions}><Button size="sm" variant="secondary" disabled={!result} leftIcon={<Copy size={14} aria-hidden />} onClick={() => void copy(buildCss(settings), "CSS")}>Copy CSS</Button><Button size="sm" variant="outline" disabled={!result} leftIcon={<Download size={14} aria-hidden />} onClick={downloadCss}>Download CSS</Button></div></div></details>
    <p className={styles.scope}><Info size={15} aria-hidden />Checks your color pair, not the accessibility of an entire page.</p>
  </div>;
}
