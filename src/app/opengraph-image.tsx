import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MiConvoy: organiza viajes compartidos y reparte los gastos";
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
          justifyContent: "space-between",
          padding: "72px 84px",
          color: "#14181f",
          background: "linear-gradient(145deg, #ffffff 0%, #f1f4f6 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 700 }}>
          <div style={{ width: 52, height: 52, borderRadius: 18, background: "#ff6b4a" }} />
          MiConvoy
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 960 }}>
          <div style={{ color: "#e0532f", fontSize: 24, fontWeight: 700, letterSpacing: 4 }}>
            VIAJAR JUNTOS, MÁS FÁCIL
          </div>
          <div style={{ fontSize: 68, lineHeight: 1.12, fontWeight: 700 }}>
            Organiza el viaje.
            <br />
            Reparte los gastos.
          </div>
          <div style={{ color: "#5b6472", fontSize: 30 }}>
            Coches, plazas y cuentas claras para todo el grupo.
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 74,
            bottom: 90,
            width: 210,
            height: 82,
            borderRadius: 36,
            background: "#202a39",
            transform: "rotate(-8deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 142,
            bottom: 154,
            width: 96,
            height: 48,
            borderRadius: "30px 30px 0 0",
            background: "#ffb39f",
            transform: "rotate(-8deg)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
