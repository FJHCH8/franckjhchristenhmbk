import { ImageResponse } from "next/og";

export const alt = "Bienvenue — Franck J.H. CHRISTEN H.M.B.K.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "72px",
          background: "linear-gradient(180deg, #6eafdf 0%, #b7ddf4 46%, #e7f4fb 100%)",
          color: "#122433",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 0.4 }}>Bienvenue</div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 52, lineHeight: 1.05, maxWidth: 1040 }}>
          Franck J.H. CHRISTEN H.M.B.K.
        </div>
        <div style={{ display: "flex", marginTop: 16, fontSize: 28 }}>Polyhymate</div>
      </div>
    ),
    { ...size },
  );
}
