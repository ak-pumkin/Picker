import { ImageResponse } from "next/og";

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";

export function renderOgImage(title: string, subtitle: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0A0A0D 0%, #171225 55%, #0A0A0D 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 44 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg,#8B6CFF 0%,#5CA0FF 50%,#22D3EE 100%)",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>Picker</div>
        </div>
        <div style={{ display: "flex", fontSize: 66, fontWeight: 700, lineHeight: 1.08, maxWidth: 1000 }}>
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#AFAFC0", marginTop: 26, maxWidth: 920 }}>
          {subtitle}
        </div>
      </div>
    ),
    { ...ogImageSize }
  );
}
