import { ImageResponse } from "next/og";

export const alt = "Franck J.H. Christen H.M.B.K. — Site personnel";
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
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, textTransform: "uppercase" }}>
          Site personnel
        </div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 84, lineHeight: 0.9 }}>Franck</div>
        <div style={{ display: "flex", marginTop: 8, fontSize: 48 }}>J.H. Christen H.M.B.K.</div>
      </div>
    ),
    { ...size },
  );
}
