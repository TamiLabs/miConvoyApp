import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { baseDatos } from "@/db";
import { publicarPlazas } from "@/tiempoReal";

// Reserva una plaza libre con tu nombre. Sin cuenta: el nombre te identifica.
export const dynamic = "force-dynamic";

// Error de validación (mensaje apto para mostrar). El resto es 500.
class ErrorReserva extends Error {}

export async function POST(peticion: NextRequest, { params }: { params: { id: string } }) {
  if (process.env.SERVER_ON !== "true") {
    return NextResponse.json({ ok: false, error: "Modo online desactivado." }, { status: 503 });
  }
  let cuerpo: { cocheDelViajeId?: string; plaza?: number; nombre?: string };
  try {
    cuerpo = (await peticion.json()) as {
      cocheDelViajeId?: string;
      plaza?: number;
      nombre?: string;
    };
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }
  const nombre = cuerpo.nombre?.trim();
  if (!cuerpo.cocheDelViajeId || !Number.isInteger(cuerpo.plaza) || !nombre) {
    return NextResponse.json(
      { ok: false, error: "Faltan coche, plaza o nombre." },
      { status: 400 },
    );
  }
  try {
    await baseDatos.$transaction(async (tx) => {
      const coche = await tx.cocheDelViaje.findFirst({
        where: { id: cuerpo.cocheDelViajeId, viajeId: params.id },
        include: { coche: true },
      });
      if (!coche) throw new ErrorReserva("Ese coche no es del viaje.");
      const plazas = coche.plazas ?? coche.coche?.plazas ?? 5;
      if ((cuerpo.plaza as number) < 1 || (cuerpo.plaza as number) > plazas) {
        throw new ErrorReserva(`Solo hay ${plazas} plazas en ese coche.`);
      }
      await tx.ocupante.create({
        data: {
          viajeId: params.id,
          cocheDelViajeId: coche.id,
          plaza: cuerpo.plaza as number,
          nombre,
        },
      });
    });
    await publicarPlazas(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "Esa plaza ya está ocupada o ese nombre ya está en el viaje." },
        { status: 409 },
      );
    }
    if (e instanceof ErrorReserva) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "No se pudo reservar." }, { status: 500 });
  }
}
