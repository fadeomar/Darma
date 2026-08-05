import { ImageResponse } from "next/og";

export const alt = "Darma browser tools and connected technology atlas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const smallCard = (label: string, value: string, left: number, top: number, accent: string) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width: 180,
      height: 92,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "18px 20px",
      border: "1px solid #393b37",
      borderRadius: 22,
      background: "#1b1d1a",
      boxShadow: "0 18px 48px rgba(0,0,0,.28)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 9, color: "#aaa69d", fontSize: 15, fontWeight: 800 }}>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: accent }} />
      {label}
    </div>
    <div style={{ marginTop: 7, color: "#f7f4ed", fontSize: 29, fontWeight: 950 }}>{value}</div>
  </div>
);

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        overflow: "hidden",
        padding: "58px 64px",
        background: "#111310",
        color: "#f7f4ed",
        fontFamily: "sans-serif",
        backgroundImage:
          "radial-gradient(circle at 74% 24%, rgba(45,212,191,.18), transparent 30%), radial-gradient(circle at 14% 88%, rgba(255,106,61,.16), transparent 34%), linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 44px 44px, 44px 44px",
      }}
    >
      <div style={{ width: 650, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 58, height: 58, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 18, background: "linear-gradient(145deg,#ff6a3d,#2dd4bf)", color: "#111310", fontSize: 31, fontWeight: 950 }}>D</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 28, fontWeight: 950 }}>Darma</span>
            <span style={{ marginTop: 2, color: "#aaa69d", fontSize: 14, fontWeight: 800, letterSpacing: 2 }}>TOOLS · GAMES · TECH ATLAS</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ maxWidth: 640, fontSize: 65, lineHeight: .98, fontWeight: 950, letterSpacing: "-3.5px" }}>
            Use the tool. Understand the system. Keep moving.
          </div>
          <div style={{ marginTop: 23, maxWidth: 600, color: "#cbc6bc", fontSize: 23, lineHeight: 1.38 }}>
            Useful browser workspaces, practical learning routes, reviewed technology decisions, and focused games.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, color: "#aaa69d", fontSize: 16, fontWeight: 800 }}>
          <span style={{ color: "#ff8b68" }}>✦</span><span>Open source</span><span>•</span><span>No account required</span><span>•</span><span>Light + dark</span>
        </div>
      </div>

      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", width: 440, height: 440, border: "1px dashed #4e504b", borderRadius: 999 }} />
        <div style={{ position: "absolute", width: 300, height: 300, border: "1px dashed rgba(45,212,191,.45)", borderRadius: 999 }} />
        <div style={{ width: 132, height: 132, display: "flex", alignItems: "center", justifyContent: "center", border: "4px solid #ff6a3d", borderRadius: 38, background: "#171a17", boxShadow: "0 24px 60px rgba(0,0,0,.4)", color: "#f7f4ed", fontSize: 62, fontWeight: 950 }}>D</div>
        <div style={{ position: "absolute", left: 80, top: 180, width: 135, height: 3, background: "linear-gradient(90deg,#ff6a3d,transparent)" }} />
        <div style={{ position: "absolute", right: 80, top: 180, width: 135, height: 3, background: "linear-gradient(90deg,transparent,#2dd4bf)" }} />
        <div style={{ position: "absolute", left: 210, top: 95, width: 3, height: 100, background: "linear-gradient(#ff6a3d,transparent)" }} />
        <div style={{ position: "absolute", left: 210, bottom: 95, width: 3, height: 100, background: "linear-gradient(transparent,#2dd4bf)" }} />
        {smallCard("TOOLS", "BUILD", 18, 74, "#ff6a3d")}
        {smallCard("GAMES", "PLAY", 300, 48, "#2dd4bf")}
        {smallCard("PATHS", "LEARN", 310, 365, "#ff6a3d")}
        {smallCard("ATLAS", "LIVE", 10, 390, "#2dd4bf")}
      </div>
    </div>,
    size,
  );
}
