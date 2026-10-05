import { NextResponse, type NextRequest } from "next/server";
import { baseDatos } from "@/db";
import { publicarPlazas } from "@/tiempoReal";

// Libera tu propia plaza (debes escribir el mismo nombre con el que la cogiste).
export const dynamic = "force-dynamic";

export async function POST(peticion: NextRequest, { params }: { params: { id: string } }) {
  if (process.env.SERVER_ON !== "true") {
    return NextResponse.json({ ok: false, error: "Modo online desactivado." }, { status: 503 });
  }
  let cuerpo: { ocupanteId?: string; nombre?: string };
  try {
    cuerpo = (await peticion.json()) as { ocupanteId?: string; nombre?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }
  const nombre = cuerpo.nombre?.trim();
  if (!cuerpo.ocupanteId || !nombre) {
    return NextResponse.json({ ok: false, error: "Faltan plaza y nombre." }, { status: 400 });
  }
  try {
    const ocupante = await baseDatos.ocupante.findFirst({
      where: { id: cuerpo.ocupanteId, viajeId: params.id },
    });
    if (!ocupante) {
      return NextResponse.json({ ok: false, error: "Esa plaza ya está libre." }, { status: 404 });
    }
    if (ocupante.plaza === 1) {
      return NextResponse.json(
        { ok: false, error: "La plaza del conductor la gestiona el organizador." },
        { status: 400 },
      );
    }
    if (ocupante.nombre.toLowerCase() !== nombre.toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: "Ese no es tu nombre: solo puedes liberar tu plaza." },
        { status: 403 },
      );
    }
    await baseDatos.ocupante.delete({ where: { id: ocupante.id } });
    await publicarPlazas(params.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo liberar." }, { status: 500 });
  }
}
