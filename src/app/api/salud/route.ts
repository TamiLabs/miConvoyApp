import { NextResponse } from "next/server";
import { baseDatos } from "@/db";

// Salud del "servidor": el cliente nunca lee el .env, pregunta aquí.
// SERVER_ON=false → degradado sin tocar la BBDD.
// SERVER_ON=true + ping OK → disponible; si el ping falla → degradado.
export const dynamic = "force-dynamic";

export async function GET() {
  const servidorOn = process.env.SERVER_ON === "true";
  if (!servidorOn) {
    return NextResponse.json({
      servidorOn: false,
      baseDatosOk: false,
      disponible: false,
      motivo: "Modo online desactivado.",
    });
  }
  try {
    await baseDatos.$queryRaw`SELECT 1`;
    return NextResponse.json({
      servidorOn: true,
      baseDatosOk: true,
      disponible: true,
      motivo: null,
    });
  } catch {
    return NextResponse.json({
      servidorOn: true,
      baseDatosOk: false,
      disponible: false,
      motivo: "Problemas para conectar con el servidor.",
    });
  }
}
