import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #6eafdf 0%, #d5ebf8 100%)",
          color: "#122433",
          fontSize: 104,
          fontFamily: "Georgia, serif",
        }}
      >
        F
      </div>
    ),
    { ...size },
  );
}
