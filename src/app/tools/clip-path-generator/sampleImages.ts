// Built-in sample backgrounds for the preview.
//
// These are hand-authored SVGs encoded as `data:` URIs so they ship with the
// bundle: no network request, no external asset, no licensing concerns, and —
// because a `data:` URI is same-origin — they never taint the export canvas,
// so PNG/SVG export keeps working with a sample selected. This matches the
// tool's browser-only promise.

export type SampleBackground = {
  id: string;
  label: string;
  /** Ready-to-use `data:image/svg+xml` URI. */
  dataUri: string;
  /** Descriptive width/height, useful for object-fit demonstrations. */
  width: number;
  height: number;
};

function svgToDataUri(svg: string): string {
  // Collapse the authoring whitespace, then percent-encode. `encodeURIComponent`
  // covers every character that is unsafe inside an <img>/CSS `url()` data URI.
  const compact = svg.replace(/\n\s*/g, "").trim();
  return `data:image/svg+xml,${encodeURIComponent(compact)}`;
}

const SUNSET = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2b1055"/>
      <stop offset="0.45" stop-color="#7f3b8c"/>
      <stop offset="0.72" stop-color="#f0743b"/>
      <stop offset="1" stop-color="#ffd07a"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff4c2"/>
      <stop offset="0.6" stop-color="#ffca6b"/>
      <stop offset="1" stop-color="#ff9b52" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#sky)"/>
  <circle cx="600" cy="470" r="190" fill="url(#sun)"/>
  <circle cx="600" cy="470" r="95" fill="#fff1c9"/>
  <path d="M0 640 Q300 600 600 640 T1200 640 V800 H0 Z" fill="#3a1c4d" opacity="0.9"/>
  <path d="M0 700 Q300 675 600 700 T1200 700 V800 H0 Z" fill="#241035"/>
</svg>`;

const OCEAN = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8fe3ff"/>
      <stop offset="0.5" stop-color="#2aa9d8"/>
      <stop offset="1" stop-color="#0b4a75"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#water)"/>
  <g fill="#ffffff" opacity="0.14">
    <path d="M0 250 Q150 210 300 250 T600 250 T900 250 T1200 250 V320 H0 Z"/>
    <path d="M0 420 Q150 380 300 420 T600 420 T900 420 T1200 420 V500 H0 Z"/>
    <path d="M0 600 Q150 560 300 600 T600 600 T900 600 T1200 600 V700 H0 Z"/>
  </g>
  <circle cx="960" cy="150" r="70" fill="#fdfbe4" opacity="0.85"/>
</svg>`;

const AURORA = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#020617"/>
      <stop offset="1" stop-color="#0b1e3f"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22d3aa"/>
      <stop offset="0.5" stop-color="#38bdf8"/>
      <stop offset="1" stop-color="#a855f7"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="34"/>
    </filter>
  </defs>
  <rect width="1200" height="800" fill="url(#night)"/>
  <g fill="#ffffff">
    <circle cx="120" cy="90" r="2"/><circle cx="300" cy="60" r="1.5"/><circle cx="520" cy="120" r="2"/>
    <circle cx="760" cy="70" r="1.5"/><circle cx="980" cy="140" r="2"/><circle cx="1120" cy="80" r="1.5"/>
    <circle cx="220" cy="200" r="1.5"/><circle cx="880" cy="220" r="2"/>
  </g>
  <g filter="url(#soft)" opacity="0.75">
    <path d="M0 380 Q300 200 600 360 T1200 300 V520 Q900 620 600 520 T0 560 Z" fill="url(#glow)"/>
  </g>
  <path d="M0 620 L200 560 L380 640 L560 570 L760 660 L980 580 L1200 650 V800 H0 Z" fill="#04121f"/>
</svg>`;

const MESH = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <radialGradient id="m1" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff6ec7"/><stop offset="1" stop-color="#ff6ec7" stop-opacity="0"/></radialGradient>
    <radialGradient id="m2" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#5b8cff"/><stop offset="1" stop-color="#5b8cff" stop-opacity="0"/></radialGradient>
    <radialGradient id="m3" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#43e0c0"/><stop offset="1" stop-color="#43e0c0" stop-opacity="0"/></radialGradient>
    <radialGradient id="m4" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient>
    <filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="60"/></filter>
  </defs>
  <rect width="1200" height="800" fill="#141225"/>
  <g filter="url(#blur)">
    <circle cx="260" cy="230" r="320" fill="url(#m1)"/>
    <circle cx="930" cy="200" r="360" fill="url(#m2)"/>
    <circle cx="330" cy="640" r="340" fill="url(#m3)"/>
    <circle cx="920" cy="620" r="320" fill="url(#m4)"/>
  </g>
</svg>`;

const PEAKS = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbc2eb"/>
      <stop offset="0.4" stop-color="#a6c1ee"/>
      <stop offset="1" stop-color="#e5eefc"/>
    </linearGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#dawn)"/>
  <circle cx="540" cy="240" r="90" fill="#fff6ea"/>
  <path d="M0 620 L160 430 L300 560 L430 360 L560 540 L700 420 L800 520 V1000 H0 Z" fill="#5566a3" opacity="0.55"/>
  <path d="M0 760 L180 560 L340 720 L500 520 L660 700 L800 620 V1000 H0 Z" fill="#3c4a80" opacity="0.8"/>
  <path d="M0 880 L220 700 L420 860 L620 690 L800 820 V1000 H0 Z" fill="#26305c"/>
</svg>`;

export const SAMPLE_BACKGROUNDS: SampleBackground[] = [
  { id: "sunset", label: "Sunset", dataUri: svgToDataUri(SUNSET), width: 1200, height: 800 },
  { id: "ocean", label: "Ocean", dataUri: svgToDataUri(OCEAN), width: 1200, height: 800 },
  { id: "aurora", label: "Aurora", dataUri: svgToDataUri(AURORA), width: 1200, height: 800 },
  { id: "mesh", label: "Mesh gradient", dataUri: svgToDataUri(MESH), width: 1200, height: 800 },
  { id: "peaks", label: "Peaks (portrait)", dataUri: svgToDataUri(PEAKS), width: 800, height: 1000 },
];
