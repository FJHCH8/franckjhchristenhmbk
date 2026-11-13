import { ImageResponse } from "next/og";
import { PERSON_NAME } from "@/lib/site";

export const alt = PERSON_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function Stars({ count, gap, brightEvery }: { count: number; gap: number; brightEvery: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap }}>
      {Array.from({ length: count }, (_, index) => {
        const bright = index % brightEvery === 0;
        const dot = bright ? 4 : 2;
        return (
          <div
            key={index}
            style={{
              width: dot,
              height: dot,
              borderRadius: dot,
              background: "#ffffff",
              opacity: bright ? 0.95 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "#f4f7ff",
          gap: 28,
        }}
      >
        <Stars count={14} gap={48} brightEvery={4} />
        <Stars count={11} gap={62} brightEvery={3} />
        <div style={{ display: "flex", marginTop: 18, marginBottom: 18, fontSize: 52, fontFamily: "Georgia, serif" }}>
          {PERSON_NAME}
        </div>
        <Stars count={12} gap={56} brightEvery={5} />
        <Stars count={9} gap={70} brightEvery={3} />
      </div>
    ),
    { ...size },
  );
}
