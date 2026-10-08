import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { baseDatos } from "@/db";
import { publicarPlazas } from "@/tiempoReal";
import { obtenerSesionGoogle } from "@/auth/google";

// Crea un viaje online: coches con conductor (plaza 1 ocupada), gastos y
// ajustes. Devuelve el id y el token de edición (solo organizador).
export const dynamic = "force-dynamic";

interface CocheNuevo {
  marca?: string;
  modelo?: string;
  matricula?: string;
  consumo: number;
  precio?: number;
  plazas: number;
  conductorNombre: string;
  incluirConductorEnReparto?: boolean;
}

interface CuerpoCrearViaje {
  email?: string;
  nombre?: string;
  origen?: string;
  destino?: string;
  fecha?: string | null;
  distanciaKm?: number;
  idaYVuelta?: boolean;
  incluirConductor?: boolean;
  gastos?: { nombre: string; importe: number }[];
  coches?: CocheNuevo[];
}

function esValido(cuerpo: CuerpoCrearViaje): string | null {
  if (!cuerpo.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cuerpo.email))
    return "Falta un correo válido.";
  if (!cuerpo.origen?.trim() || !cuerpo.destino?.trim()) return "Faltan origen y destino.";
  if (!((cuerpo.distanciaKm ?? 0) > 0)) return "Falta la distancia.";
  if (!cuerpo.coches || cuerpo.coches.length === 0) return "Falta al menos un coche.";
  for (const coche of cuerpo.coches) {
    if (!coche.conductorNombre?.trim()) return "Falta el conductor de un coche.";
    if (!(coche.consumo > 0)) return "Falta el consumo de un coche.";
    if (!(coche.plazas >= 1 && coche.plazas <= 9)) return "Las plazas deben ser de 1 a 9.";
  }
  return null;
}

export async function POST(peticion: NextRequest) {
  if (process.env.SERVER_ON !== "true") {
    return NextResponse.json({ ok: false, error: "Modo online desactivado." }, { status: 503 });
  }
  const identidad = await obtenerSesionGoogle(peticion);
  if (!identidad) {
    return NextResponse.json({ ok: false, error: "Inicia sesión con Google para publicar un viaje." }, { status: 401 });
  }
  let cuerpo: CuerpoCrearViaje;
  try {
    cuerpo = (await peticion.json()) as CuerpoCrearViaje;
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }
  const fallo = esValido(cuerpo);
  if (fallo) return NextResponse.json({ ok: false, error: fallo }, { status: 400 });
  if (cuerpo.email?.trim().toLowerCase() !== identidad.correo) {
    return NextResponse.json({ ok: false, error: "La cuenta de Google no coincide con este perfil." }, { status: 403 });
  }
  cuerpo.email = identidad.correo;
  const distanciaKm = cuerpo.distanciaKm as number;

  try {
    const viaje = await baseDatos.$transaction(async (tx) => {
      const usuario = await tx.user.upsert({
        where: { email: cuerpo.email as string },
        update: { name: cuerpo.nombre?.trim() || null },
        create: { email: cuerpo.email as string, name: cuerpo.nombre?.trim() || null },
      });
      const creado = await tx.viaje.create({
        data: {
          origen: (cuerpo.origen as string).trim(),
          destino: (cuerpo.destino as string).trim(),
          fecha: cuerpo.fecha ? new Date(cuerpo.fecha) : null,
          idaYVuelta: cuerpo.idaYVuelta ?? true,
          distanciaKm,
          precioCombustible: 0,
          modoOrigen: "online",
          tokenEdicion: crypto.randomUUID(),
          organizadorId: usuario.id,
          gastos: {
            create: (cuerpo.gastos ?? [])
              .filter((g) => g.nombre?.trim() && g.importe > 0)
              .map((g) => ({ nombre: g.nombre.trim(), importe: g.importe })),
          },
        },
      });
      for (const coche of cuerpo.coches as CocheNuevo[]) {
        // El id local del perfil no vale como FK: se enlaza por matrícula del
        // mismo propietario, y si no existe se deja null (el snapshot basta).
        let cocheId: string | null = null;
        const matricula = coche.matricula?.trim().toUpperCase();
        if (matricula) {
          const existente = await tx.coche.findFirst({
            where: { propietarioId: usuario.id, matricula },
            select: { id: true },
          });
          cocheId = existente?.id ?? null;
        }
        const delViaje = await tx.cocheDelViaje.create({
          data: {
            viajeId: creado.id,
            cocheId,
            conductorNombre: coche.conductorNombre.trim(),
            incluirConductorEnReparto:
              coche.incluirConductorEnReparto ?? cuerpo.incluirConductor ?? true,
            consumo: coche.consumo,
            precio: coche.precio ?? 0,
            plazas: coche.plazas,
          },
        });
        // Plaza 1, la del conductor, nace ocupada.
        await tx.ocupante.create({
          data: {
            viajeId: creado.id,
            cocheDelViajeId: delViaje.id,
            plaza: 1,
            nombre: coche.conductorNombre.trim(),
          },
        });
      }
      return creado;
    });
    return NextResponse.json({ ok: true, id: viaje.id, tokenEdicion: viaje.tokenEdicion });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "Ese nombre ya está en el viaje." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: false, error: "No se pudo crear el viaje." }, { status: 500 });
  }
}
