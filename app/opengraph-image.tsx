import { ImageResponse } from "next/og";

export const alt = "Stint — Entertainment delivered to you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #6d28d9 0%, #db2777 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 44, fontWeight: 800 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "white",
              display: "flex",
            }}
          />
          Stint
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            Entertainment delivered to you
          </div>
          <div style={{ fontSize: 34, opacity: 0.92, maxWidth: 900 }}>
            Book vetted chefs, performers, bartenders & event crews who come to your party.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 28, opacity: 0.85 }}>
          Now booking in New York City
        </div>
      </div>
    ),
    { ...size },
  );
}
