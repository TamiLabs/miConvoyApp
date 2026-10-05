import { NextResponse, type NextRequest } from "next/server";
import { baseDatos } from "@/db";
import { publicarPlazas } from "@/tiempoReal";

// Solo organizador (tokenEdicion): expulsa a un ocupante (menos al conductor).
export const dynamic = "force-dynamic";

export async function POST(peticion: NextRequest, { params }: { params: { id: string } }) {
  if (process.env.SERVER_ON !== "true") {
    return NextResponse.json({ ok: false, error: "Modo online desactivado." }, { status: 503 });
  }
  let cuerpo: { ocupanteId?: string; tokenEdicion?: string };
  try {
    cuerpo = (await peticion.json()) as { ocupanteId?: string; tokenEdicion?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }
  if (!cuerpo.ocupanteId || !cuerpo.tokenEdicion) {
    return NextResponse.json({ ok: false, error: "Faltan datos." }, { status: 400 });
  }
  try {
    const viaje = await baseDatos.viaje.findUnique({
      where: { id: params.id },
      select: { tokenEdicion: true },
    });
    if (!viaje || viaje.tokenEdicion !== cuerpo.tokenEdicion) {
      return NextResponse.json({ ok: false, error: "Sin permiso." }, { status: 403 });
    }
    const ocupante = await baseDatos.ocupante.findFirst({
      where: { id: cuerpo.ocupanteId, viajeId: params.id },
    });
    if (!ocupante) {
      return NextResponse.json({ ok: false, error: "Esa plaza ya está libre." }, { status: 404 });
    }
    if (ocupante.plaza === 1) {
      return NextResponse.json(
        { ok: false, error: "No se puede expulsar al conductor." },
        { status: 400 },
      );
    }
    await baseDatos.ocupante.delete({ where: { id: ocupante.id } });
    await publicarPlazas(params.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo expulsar." }, { status: 500 });
  }
}
