import { ImageResponse } from "next/og";

export const alt = "Darma open tools and connected technology atlas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", background: "#0d1117", color: "#f8fafc", fontFamily: "sans-serif", backgroundImage: "radial-gradient(circle at 80% 10%, #6d5dfc55, transparent 32%), radial-gradient(circle at 10% 90%, #16a08544, transparent 35%)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 28, fontWeight: 800 }}><div style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "#f4d35e", color: "#111827" }}>D</div>Darma</div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 920 }}><div style={{ fontSize: 68, lineHeight: 1.05, fontWeight: 900, letterSpacing: "-3px" }}>Open tools and a connected technology atlas.</div><div style={{ marginTop: 28, fontSize: 28, lineHeight: 1.35, color: "#cbd5e1" }}>Resources · Learning paths · Careers · Ways of working · Practical guides</div></div>
      <div style={{ display: "flex", gap: 12, fontSize: 18, color: "#94a3b8" }}><span>Open source</span><span>•</span><span>Browser-first</span><span>•</span><span>People-first learning</span></div>
    </div>,
    size,
  );
}
