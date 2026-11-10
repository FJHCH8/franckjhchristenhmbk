import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #7eb8e6 0%, #d7ecf8 100%)",
          color: "#122433",
          fontSize: 38,
          fontFamily: "Georgia, serif",
        }}
      >
        F
      </div>
    ),
    { ...size },
  );
}
