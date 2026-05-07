import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Kerning AI — Industry 5.0, on the floor.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 96px",
          background:
            "radial-gradient(circle at 20% 0%, #1a1a1a 0%, #050505 60%)",
          color: "#f5f5f5",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            letterSpacing: "0.32em",
            fontSize: 22,
            color: "#d4b773",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 56,
              height: 1,
              background: "#d4b773",
              marginRight: 20,
            }}
          />
          Kerning AI · Operational intelligence
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              fontWeight: 600,
            }}
          >
            Industry 5.0,
          </div>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              fontWeight: 400,
              color: "#d4b773",
              fontStyle: "italic",
            }}
          >
            on the floor.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22,
            color: "rgba(245, 245, 245, 0.6)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <span>Ontology · Agents · Decisions</span>
          <span>kerningai.eu</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
