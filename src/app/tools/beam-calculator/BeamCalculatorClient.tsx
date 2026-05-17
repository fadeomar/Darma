"use client";

import { useMemo, useState } from "react";
import type { PointerEvent } from "react";
import { Download, Trash2 } from "lucide-react";

type SupportType = "pin" | "roller" | "fixed";
type Support = { id: string; type: SupportType; x: number };
type PointLoad = { id: string; x: number; value: number };
type UdlLoad = { id: string; xStart: number; xEnd: number; w: number };
type Selected = { kind: "support" | "point" | "udl"; id: string } | null;
type Station = { x: number; shear: number; moment: number };

const W = 1000, H = 300, A = 70, B = 930, Y = 160, EPS = 1e-9;
const presets = [
  { name: "Simply supported + mid point load", length: 6, supports: [{ id: "S1", type: "pin" as const, x: 0 }, { id: "S2", type: "roller" as const, x: 6 }], points: [{ id: "P1", x: 3, value: -20 }], udls: [] as UdlLoad[] },
  { name: "Simply supported + full UDL", length: 8, supports: [{ id: "S1", type: "pin" as const, x: 0 }, { id: "S2", type: "roller" as const, x: 8 }], points: [] as PointLoad[], udls: [{ id: "W1", xStart: 0, xEnd: 8, w: -5 }] },
  { name: "Cantilever + tip point load", length: 4, supports: [{ id: "S1", type: "fixed" as const, x: 0 }], points: [{ id: "P1", x: 4, value: -12 }], udls: [] as UdlLoad[] },
];
const round = (n: number, d = 3) => Number.isFinite(n) ? Number(n.toFixed(d)) : 0;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function analyze(length: number, supports: Support[], points: PointLoad[], udls: UdlLoad[]) {
  const loads = [...points.map((p) => ({ p: p.value, x: p.x })), ...udls.map((w) => ({ p: w.w * (w.xEnd - w.xStart), x: (w.xStart + w.xEnd) / 2 }))];
  const totalLoad = loads.reduce((s, l) => s + l.p, 0);
  const active = supports.filter((s) => s.type === "fixed" || s.type === "pin" || s.type === "roller").sort((a, b) => a.x - b.x);
  const reactions: { id: string; x: number; value: number }[] = [];
  let warning = "";
  if (active.length === 1 && active[0].type === "fixed") reactions.push({ id: active[0].id, x: active[0].x, value: -totalLoad });
  else if (active.length === 2) {
    const [left, right] = active;
    const span = right.x - left.x;
    if (Math.abs(span) < EPS) warning = "Supports cannot share the same position.";
    else {
      const mLeft = loads.reduce((s, l) => s + l.p * (l.x - left.x), 0);
      const rb = -mLeft / span;
      reactions.push({ id: left.id, x: left.x, value: -totalLoad - rb }, { id: right.id, x: right.x, value: rb });
    }
  } else warning = "Phase 1.5 supports one fixed cantilever support or exactly two vertical supports.";

  const xs = new Set<number>([0, length]);
  for (let i = 0; i <= 160; i++) xs.add((length * i) / 160);
  supports.forEach((s) => xs.add(s.x)); points.forEach((p) => xs.add(p.x)); udls.forEach((u) => { xs.add(u.xStart); xs.add(u.xEnd); });
  const stations: Station[] = [...xs].sort((a, b) => a - b).map((x) => {
    const rv = reactions.reduce((s, r) => s + (r.x <= x + EPS ? r.value : 0), 0);
    const pv = points.reduce((s, p) => s + (p.x <= x + EPS ? p.value : 0), 0);
    const uv = udls.reduce((s, u) => s + u.w * Math.max(0, clamp(x, u.xStart, u.xEnd) - u.xStart), 0);
    const rm = reactions.reduce((s, r) => s + (r.x <= x + EPS ? r.value * (x - r.x) : 0), 0);
    const pm = points.reduce((s, p) => s + (p.x <= x + EPS ? p.value * (x - p.x) : 0), 0);
    const um = udls.reduce((s, u) => { const a = Math.max(0, clamp(x, u.xStart, u.xEnd) - u.xStart); return s + u.w * a * (x - (u.xStart + a / 2)); }, 0);
    return { x, shear: rv + pv + uv, moment: rm + pm + um };
  });
  return { ok: !warning, warning, reactions, stations, maxShear: Math.max(0, ...stations.map((s) => Math.abs(s.shear))), maxMoment: Math.max(0, ...stations.map((s) => Math.abs(s.moment))) };
}

function makePath(stations: Station[], key: "shear" | "moment") {
  const maxX = Math.max(1, ...stations.map((s) => s.x));
  const maxY = Math.max(1, ...stations.map((s) => Math.abs(s[key])));
  const zero = 100;
  return { zero, maxY, d: stations.map((s, i) => `${i ? "L" : "M"} ${(s.x / maxX) * 900} ${zero - (s[key] / maxY) * 78}`).join(" ") };
}

export default function BeamCalculatorClient() {
  const [length, setLength] = useState(6);
  const [unit, setUnit] = useState("m");
  const [supports, setSupports] = useState<Support[]>(presets[0].supports);
  const [points, setPoints] = useState<PointLoad[]>(presets[0].points);
  const [udls, setUdls] = useState<UdlLoad[]>([]);
  const [selected, setSelected] = useState<Selected>({ kind: "point", id: "P1" });
  const [drag, setDrag] = useState<Selected>(null);
  const analysis = useMemo(() => analyze(length, supports, points, udls), [length, supports, points, udls]);
  const toPx = (x: number) => A + (x / length) * (B - A);
  const fromPx = (px: number) => round(clamp(((px - A) / (B - A)) * length, 0, length), 2);
  const selectedItem = selected?.kind === "support" ? supports.find((i) => i.id === selected.id) : selected?.kind === "point" ? points.find((i) => i.id === selected.id) : selected?.kind === "udl" ? udls.find((i) => i.id === selected.id) : null;
  function svgX(e: PointerEvent<SVGSVGElement>) { const r = e.currentTarget.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * W; }
  function move(e: PointerEvent<SVGSVGElement>) {
    if (!drag) return; const x = fromPx(svgX(e));
    if (drag.kind === "support") setSupports((v) => v.map((i) => i.id === drag.id ? { ...i, x } : i));
    if (drag.kind === "point") setPoints((v) => v.map((i) => i.id === drag.id ? { ...i, x } : i));
    if (drag.kind === "udl") setUdls((v) => v.map((i) => { if (i.id !== drag.id) return i; const w = i.xEnd - i.xStart; const s = clamp(x - w / 2, 0, length - w); return { ...i, xStart: round(s, 2), xEnd: round(s + w, 2) }; }));
  }
  function addSupport(type: SupportType) { const id = `S${supports.length + 1}`; setSupports([...supports, { id, type, x: round(length / 2, 2) }]); setSelected({ kind: "support", id }); }
  function addPoint() { const id = `P${points.length + 1}`; setPoints([...points, { id, x: round(length / 2, 2), value: -10 }]); setSelected({ kind: "point", id }); }
  function addUdl() { const id = `W${udls.length + 1}`; setUdls([...udls, { id, xStart: 0, xEnd: length, w: -2 }]); setSelected({ kind: "udl", id }); }
  function removeSelected() { if (!selected) return; if (selected.kind === "support") setSupports(supports.filter((i) => i.id !== selected.id)); if (selected.kind === "point") setPoints(points.filter((i) => i.id !== selected.id)); if (selected.kind === "udl") setUdls(udls.filter((i) => i.id !== selected.id)); setSelected(null); }
  function applyPreset(index: number) { const p = presets[index]; setLength(p.length); setSupports(p.supports); setPoints(p.points); setUdls(p.udls); setSelected(null); }
  function exportJson() { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify({ beam: { length, unit }, supports, pointLoads: points, distributedLoads: udls, results: analysis }, null, 2)], { type: "application/json" })); a.download = "darma-beam-calculator.json"; a.click(); }
  const shear = makePath(analysis.stations, "shear"), moment = makePath(analysis.stations, "moment");
  return <div className="beam-tool">
    <section className="beam-toolbar"><h2>Beam Calculator</h2><label>Length<input type="number" value={length} min="0.5" step="0.1" onChange={(e) => setLength(Math.max(.5, Number(e.target.value) || .5))} /></label><label>Unit<select value={unit} onChange={(e) => setUnit(e.target.value)}><option>m</option><option>ft</option></select></label><select defaultValue="" onChange={(e) => applyPreset(Number(e.target.value))}><option value="" disabled>Load preset</option>{presets.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}</select><button onClick={exportJson}><Download size={16} /> Export</button></section>
    <div className="beam-grid"><aside className="beam-panel"><h3>Canvas parts</h3><p>Click to add, then drag along the beam. Use the inspector for exact values.</p><div className="part-grid"><button onClick={() => addSupport("pin")}>Pin support</button><button onClick={() => addSupport("roller")}>Roller support</button><button onClick={() => addSupport("fixed")}>Fixed support</button><button onClick={addPoint}>Point load</button><button onClick={addUdl}>UDL</button></div><div className="beam-note">Phase 1.5: single-span determinate beams, vertical loads, point loads, and uniform distributed loads.</div></aside>
    <main className="beam-main"><svg className="beam-canvas" viewBox={`0 0 ${W} ${H}`} onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}><defs><marker id="beam-arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#ef4444" /></marker></defs><rect width={W} height={H} rx="26" fill="#f8fafc" />{[0,.25,.5,.75,1].map((t) => <g key={t}><line x1={A+t*(B-A)} x2={A+t*(B-A)} y1="55" y2="235" stroke="#e2e8f0" /><text x={A+t*(B-A)} y="265" textAnchor="middle" fontSize="13" fill="#64748b">{round(t*length,2)} {unit}</text></g>)}<line x1={A} x2={B} y1={Y} y2={Y} stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />{udls.map((u) => { const x1=toPx(u.xStart), x2=toPx(u.xEnd); return <g key={u.id} onPointerDown={(e) => { e.stopPropagation(); setSelected({kind:"udl",id:u.id}); setDrag({kind:"udl",id:u.id}); }}><rect x={x1} y="65" width={Math.max(10,x2-x1)} height="45" rx="10" fill={selected?.id===u.id?"#dbeafe":"#e0f2fe"} stroke="#38bdf8" />{Array.from({length:8}).map((_,i)=><line key={i} x1={x1+(i+.5)*(x2-x1)/8} x2={x1+(i+.5)*(x2-x1)/8} y1="112" y2="147" stroke="#ef4444" strokeWidth="2" markerEnd="url(#beam-arrow)"/>)}<text x={(x1+x2)/2} y="55" textAnchor="middle" fontSize="13" fontWeight="800">{u.id}: {Math.abs(u.w)} kN/{unit}</text></g>})}{points.map((p)=>{const x=toPx(p.x);return <g key={p.id} onPointerDown={(e)=>{e.stopPropagation();setSelected({kind:"point",id:p.id});setDrag({kind:"point",id:p.id});}}><line x1={x} x2={x} y1="60" y2="145" stroke="#ef4444" strokeWidth={selected?.id===p.id?5:4} markerEnd="url(#beam-arrow)"/><circle cx={x} cy="56" r="11" fill="#fee2e2" stroke="#ef4444"/><text x={x} y="36" textAnchor="middle" fontSize="13" fontWeight="800">{p.id}: {Math.abs(p.value)} kN</text></g>})}{supports.map((s)=>{const x=toPx(s.x);return <g key={s.id} onPointerDown={(e)=>{e.stopPropagation();setSelected({kind:"support",id:s.id});setDrag({kind:"support",id:s.id});}}>{s.type==="fixed"?<rect x={x-9} y={Y-44} width="18" height="88" rx="3" fill={selected?.id===s.id?"#2563eb":"#334155"}/>:<path d={`M ${x} ${Y+6} L ${x-24} ${Y+50} L ${x+24} ${Y+50} Z`} fill={selected?.id===s.id?"#dbeafe":"#e2e8f0"} stroke="#334155" strokeWidth="3"/>}{s.type==="roller"&&<><circle cx={x-12} cy={Y+57} r="5" fill="#94a3b8"/><circle cx={x+12} cy={Y+57} r="5" fill="#94a3b8"/></>}<text x={x} y={Y+88} textAnchor="middle" fontSize="13" fontWeight="800">{s.id} {s.type}</text></g>})}</svg>{analysis.warning&&<div className="beam-warning">{analysis.warning}</div>}<div className="result-cards"><div><span>Max shear</span><b>{round(analysis.maxShear,2)} kN</b></div><div><span>Max moment</span><b>{round(analysis.maxMoment,2)} kN{unit}</b></div><div><span>Solver</span><b>{analysis.ok?"Equilibrium OK":"Needs valid supports"}</b></div></div></main>
    <aside className="beam-panel"><div className="panel-head"><h3>Inspector</h3>{selected&&<button className="danger" onClick={removeSelected}><Trash2 size={15}/>Delete</button>}</div>{!selectedItem&&<p>Select a canvas item.</p>}{selected?.kind==="support"&&selectedItem&&"type" in selectedItem&&<div className="fields"><label>Type<select value={selectedItem.type} onChange={(e)=>setSupports(supports.map((s)=>s.id===selected.id?{...s,type:e.target.value as SupportType}:s))}><option value="pin">Pin</option><option value="roller">Roller</option><option value="fixed">Fixed</option></select></label><label>x ({unit})<input type="number" value={selectedItem.x} onChange={(e)=>setSupports(supports.map((s)=>s.id===selected.id?{...s,x:clamp(Number(e.target.value),0,length)}:s))}/></label></div>}{selected?.kind==="point"&&selectedItem&&"value" in selectedItem&&<div className="fields"><label>x ({unit})<input type="number" value={selectedItem.x} onChange={(e)=>setPoints(points.map((p)=>p.id===selected.id?{...p,x:clamp(Number(e.target.value),0,length)}:p))}/></label><label>Load kN<input type="number" value={selectedItem.value} onChange={(e)=>setPoints(points.map((p)=>p.id===selected.id?{...p,value:Number(e.target.value)}:p))}/></label><small>Downward loads are negative.</small></div>}{selected?.kind==="udl"&&selectedItem&&"w" in selectedItem&&<div className="fields"><label>Start<input type="number" value={selectedItem.xStart} onChange={(e)=>setUdls(udls.map((u)=>u.id===selected.id?{...u,xStart:clamp(Number(e.target.value),0,u.xEnd)}:u))}/></label><label>End<input type="number" value={selectedItem.xEnd} onChange={(e)=>setUdls(udls.map((u)=>u.id===selected.id?{...u,xEnd:clamp(Number(e.target.value),u.xStart,length)}:u))}/></label><label>kN/{unit}<input type="number" value={selectedItem.w} onChange={(e)=>setUdls(udls.map((u)=>u.id===selected.id?{...u,w:Number(e.target.value)}:u))}/></label></div>}<h4>Reactions</h4>{analysis.reactions.map((r)=><div className="reaction" key={r.id}><span>{r.id} @ {round(r.x,2)} {unit}</span><b>{r.value>=0?"+":""}{round(r.value,2)} kN</b></div>)}</aside></div>
    <section className="diagram-grid"><Diagram title="Shear Force Diagram" unit="kN" path={shear.d} zero={shear.zero} max={shear.maxY}/><Diagram title="Bending Moment Diagram" unit={`kN${unit}`} path={moment.d} zero={moment.zero} max={moment.maxY}/></section>
  </div>;
}

function Diagram({ title, unit, path, zero, max }: { title: string; unit: string; path: string; zero: number; max: number }) {
  return <div className="diagram-card"><div className="panel-head"><h3>{title}</h3><span>max {round(max,2)} {unit}</span></div><svg viewBox="0 0 900 200"><rect width="900" height="200" rx="18" fill="#f8fafc"/><line x1="0" x2="900" y1={zero} y2={zero} stroke="#94a3b8" strokeDasharray="6 6"/><path d={path} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinejoin="round"/><path d={`${path} L 900 ${zero} L 0 ${zero} Z`} fill="#2563eb" opacity=".08"/></svg><p>Diagram values are sampled from beam equations. Point loads create shear jumps; UDLs create sloped shear and curved moment.</p></div>;
}
