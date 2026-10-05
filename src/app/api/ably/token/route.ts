import { NextResponse, type NextRequest } from "next/server";
import { obtenerAbly } from "@/tiempoReal";

// Token temporal para UN viaje (canal viaje-{id}, solo suscripción, 1 hora).
// Así el navegador nunca ve la API key completa.
export const dynamic = "force-dynamic";

export async function POST(peticion: NextRequest) {
  let cuerpo: { viajeId?: string };
  try {
    cuerpo = (await peticion.json()) as { viajeId?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }
  if (!cuerpo.viajeId) {
    return NextResponse.json({ ok: false, error: "Falta el viaje." }, { status: 400 });
  }
  try {
    const token = await obtenerAbly().auth.createTokenRequest({
      capability: { [`viaje-${cuerpo.viajeId}`]: ["subscribe"] },
      ttl: 3600 * 1000,
    });
    return NextResponse.json(token);
  } catch {
    return NextResponse.json({ ok: false, error: "Tiempo real no configurado." }, { status: 503 });
  }
}
