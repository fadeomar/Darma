"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, CopyButton } from "@/components/ui";
import { ControlGrid, ControlSection, NumberField, ResultPanel, SegmentedControl, ToolControlPanel, WarningPanel } from "@/features/tools/components";
import { ToolLayoutSingleUtility } from "@/features/tools/layouts";
import { calculateStrength, generatePassphrase, generatePassword } from "./generator";
import type { PasswordConfig, PasswordMode } from "./types";

const DEFAULT_CONFIG: PasswordConfig = { mode: "password", length: 18, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeSimilar: true, excludeAmbiguous: false, wordCount: 4, separator: "-", capitalizeWords: false, includeNumber: true, includeSymbol: false, seedText: "" };

export default function PasswordGeneratorClient() {
  const [config, setConfig] = useState<PasswordConfig>(DEFAULT_CONFIG);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const regenerate = useCallback(() => { try { setValue(config.mode === "passphrase" ? generatePassphrase(config) : generatePassword(config)); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "Unable to generate password."); } }, [config]);
  useEffect(() => { regenerate(); }, [regenerate]);
  const strength = value ? calculateStrength(value, config) : null;
  const weak = strength && strength.score < 50;
  function patch(next: Partial<PasswordConfig>) { setConfig((current) => ({ ...current, ...next })); }
  return <ToolLayoutSingleUtility
    resultSlot={<ResultPanel title="Generated secret" description="Use the copy button only when you are ready to store it safely." value={<div className="break-all font-mono text-xl font-bold tracking-wide sm:text-2xl">{value || "No password generated"}</div>} actions={<CopyButton text={value} size="sm">Copy password</CopyButton>} />}
    actionsSlot={<><Button size="sm" onClick={regenerate}>Regenerate</Button><SegmentedControl<PasswordMode> ariaLabel="Password mode" value={config.mode} onChange={(mode) => patch({ mode })} options={[{ value: "password", label: "Password" }, { value: "passphrase", label: "Passphrase" }]} /></>}
    controlsSlot={<ToolControlPanel title="Password settings"><ControlSection title="Length and mode"><ControlGrid columns={2}>{config.mode === "password" ? <NumberField label="Length" value={config.length} min={8} max={128} onChange={(length) => patch({ length })} /> : <NumberField label="Words" value={config.wordCount} min={3} max={10} onChange={(wordCount) => patch({ wordCount })} />}</ControlGrid></ControlSection><ControlSection title="Character sets"><div className="flex flex-wrap gap-2">{([ ["uppercase", "Uppercase"], ["lowercase", "Lowercase"], ["numbers", "Numbers"], ["symbols", "Symbols"], ["excludeSimilar", "No similar"], ["excludeAmbiguous", "No ambiguous"] ] as const).map(([key, label]) => <Button key={key} size="sm" variant={config[key] ? "primary" : "secondary"} onClick={() => patch({ [key]: !config[key] } as Partial<PasswordConfig>)}>{label}</Button>)}</div></ControlSection><ControlSection title="Strength">{strength ? <div className="space-y-2 text-left"><div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-soft)]"><div className="h-full bg-[var(--color-primary)]" style={{ width: `${strength.score}%` }} /></div><p className="text-sm font-semibold text-[var(--color-text)]">{strength.label} · {Math.round(strength.entropy)} bits · {strength.crackTime}</p></div> : null}</ControlSection></ToolControlPanel>}
    infoSlot={<WarningPanel messages={[...(error ? [{ id: "error", severity: "danger" as const, title: "Secure random unavailable", message: error }] : []), ...(weak ? [{ id: "weak", severity: "warning" as const, title: "Weak settings", message: "Increase length or enable more character sets for stronger passwords." }] : []), { id: "local", severity: "info" as const, title: "Browser-only", message: "Generation uses the browser Crypto API and never uploads the password." }]} />}
  />;
}
