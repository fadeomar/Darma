import { ImageResponse } from "next/og";

export const atlasOgSize = { width: 1200, height: 630 };
export const atlasOgContentType = "image/png";

type AtlasOgImageInput = {
  eyebrow: string;
  title: string;
  description: string;
  labels?: string[];
  symbol?: string;
  accent?: "orange" | "teal" | "mixed";
};

const palette = {
  orange: { primary: "#ff7148", secondary: "#ffb28f", glow: "rgba(255,106,61,.34)" },
  teal: { primary: "#2dd4bf", secondary: "#99f6e4", glow: "rgba(45,212,191,.3)" },
  mixed: { primary: "#ff7148", secondary: "#2dd4bf", glow: "rgba(255,106,61,.26)" },
};

export function createAtlasOgImage({ eyebrow, title, description, labels = [], symbol = "✦", accent = "mixed" }: AtlasOgImageInput) {
  const colors = palette[accent];
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", padding: "62px 70px", background: "#101312", color: "#f8f4ec", fontFamily: "Arial, sans-serif" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: `radial-gradient(circle at 80% 16%, ${colors.glow}, transparent 34%), radial-gradient(circle at 16% 90%, rgba(45,212,191,.2), transparent 36%), linear-gradient(135deg, #101312, #1f1713)` }} />
      <div style={{ position: "absolute", inset: 0, opacity: .12, backgroundImage: "linear-gradient(rgba(255,255,255,.24) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.24) 1px, transparent 1px)", backgroundSize: "46px 46px" }} />
      <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 58, height: 58, borderRadius: 17, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(145deg, ${colors.primary}, ${colors.secondary})`, color: "#13110f", fontSize: 28, fontWeight: 900 }}>D</div>
            <div style={{ display: "flex", flexDirection: "column" }}><span style={{ fontSize: 27, fontWeight: 900, letterSpacing: "-1px" }}>Darma</span><span style={{ marginTop: 4, fontSize: 14, color: "#bfb7aa", letterSpacing: "2px", textTransform: "uppercase" }}>Tools + Tech Atlas</span></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 17px", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, background: "rgba(255,255,255,.06)", fontSize: 16, fontWeight: 700 }}><span style={{ color: colors.secondary }}>{symbol}</span>{eyebrow}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 50 }}>
          <div style={{ display: "flex", maxWidth: 850, flexDirection: "column" }}>
            <div style={{ fontSize: title.length > 58 ? 55 : 64, lineHeight: 1.02, fontWeight: 900, letterSpacing: "-3px" }}>{title}</div>
            <div style={{ marginTop: 23, maxWidth: 820, fontSize: 23, lineHeight: 1.4, color: "#d5cec2" }}>{description}</div>
            {labels.length ? <div style={{ marginTop: 28, display: "flex", gap: 11, flexWrap: "wrap" }}>{labels.slice(0, 4).map((label) => <span key={label} style={{ padding: "9px 13px", borderRadius: 999, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", fontSize: 14, fontWeight: 700, color: "#ede7dd" }}>{label}</span>)}</div> : null}
          </div>
          <div style={{ flex: "0 0 auto", width: 174, height: 174, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, border: `2px solid ${colors.primary}`, boxShadow: `inset 0 0 0 28px rgba(255,255,255,.035), 0 0 80px ${colors.glow}`, fontSize: 82, color: colors.secondary }}>{symbol}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 15, color: "#a9a196" }}><span>Open source • Browser-first • Cataloged references</span><span>darma-lake.vercel.app</span></div>
      </div>
    </div>,
    atlasOgSize,
  );
}
