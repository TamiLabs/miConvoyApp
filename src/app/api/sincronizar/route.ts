import { NextResponse, type NextRequest } from "next/server";
import { Prisma, type Coche } from "@prisma/client";
import { baseDatos } from "@/db";
import type { EntradaHistorial, PerfilLocal } from "@/storage/tiposModoGratis";

// Sube el perfil (User + Coches) y los viajes pendientes del historial.
// El cliente filtra lo ya subido (ids) y decide soloPerfil según sus casos.
// Los coches borrados en local se borran en el servidor; los viajes, nunca
// (el historial local está capado a 10, el servidor es el archivo completo).
export const dynamic = "force-dynamic";

interface CuerpoSincronizar {
  perfil?: PerfilLocal;
  historial?: EntradaHistorial[];
  hashContrasena?: string | null;
}

export async function POST(peticion: NextRequest) {
  if (process.env.SERVER_ON !== "true") {
    return NextResponse.json({ ok: false, error: "Modo online desactivado." }, { status: 503 });
  }

  let cuerpo: CuerpoSincronizar;
  try {
    cuerpo = (await peticion.json()) as CuerpoSincronizar;
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }
  if (!cuerpo.perfil?.correo || !cuerpo.perfil?.nombre) {
    return NextResponse.json({ ok: false, error: "Falta el perfil." }, { status: 400 });
  }
  // Const local para que el narrowing sobreviva dentro de la transacción.
  const perfil = cuerpo.perfil;

  try {
    // Todo o nada: si algo falla a mitad, se revierte lo ya escrito.
    const resultado = await baseDatos.$transaction(async (tx) => {
      const usuario = await tx.user.upsert({
        where: { email: perfil.correo },
        update: {
          name: perfil.nombre,
          image: perfil.foto ?? null,
          ...(cuerpo.hashContrasena ? { password: cuerpo.hashContrasena } : {}),
        },
        create: {
          email: perfil.correo,
          name: perfil.nombre,
          image: perfil.foto ?? null,
          password: cuerpo.hashContrasena ?? null,
        },
      });

      // Coches: se emparejan por matrícula del mismo propietario (sin duplicados)
      // y se borran los que ya no están en local. La matrícula se normaliza
      // (mayúsculas, sin espacios) igual que al comparar.
      const matriculasLocales = new Set(
        perfil.coches.map((coche) => coche.matricula.trim().toUpperCase()),
      );
      for (const coche of perfil.coches) {
        const matricula = coche.matricula.trim().toUpperCase();
        const datos = {
          marca: coche.marca,
          modelo: coche.modelo,
          consumo: coche.consumo,
          precio: coche.precioPorLitro ?? 0,
          tipoCombustible: coche.tipoCombustible ?? "gasolina",
          plazas: coche.plazas ?? 5,
        };
        const existente: Pick<Coche, "id"> | null = await tx.coche.findFirst({
          where: { propietarioId: usuario.id, matricula },
          select: { id: true },
        });
        if (existente) {
          await tx.coche.update({ where: { id: existente.id }, data: datos });
        } else {
          await tx.coche.create({
            data: { ...datos, matricula, propietarioId: usuario.id },
          });
        }
      }
      const cochesServidor = await tx.coche.findMany({
        where: { propietarioId: usuario.id },
        select: { id: true, matricula: true },
      });
      const borrados = cochesServidor.filter(
        (c) => !matriculasLocales.has(c.matricula.trim().toUpperCase()),
      );
      let cochesBorrados = 0;
      for (const coche of borrados) {
        await tx.coche.delete({ where: { id: coche.id } });
        cochesBorrados++;
      }

      let viajesSubidos = 0;
      let viajesOmitidos = 0;
      for (const entrada of cuerpo.historial ?? []) {
        // Idempotente: si ya existe por origenClienteId, no se duplica.
        const existente = await tx.viaje.findUnique({
          where: { origenClienteId: entrada.id },
          select: { id: true },
        });
        if (existente) {
          viajesOmitidos++;
          continue;
        }
        await tx.viaje.create({
          data: {
            origen: entrada.origen?.trim() || "—",
            destino: entrada.destino?.trim() || "—",
            fecha: new Date(entrada.fecha),
            idaYVuelta: entrada.idaYVuelta,
            distanciaKm: entrada.distanciaKm,
            precioCombustible: entrada.precioCombustible,
            modoOrigen: "gratis",
            origenClienteId: entrada.id,
            organizadorId: usuario.id,
            resultado: {
              ...entrada.resultado,
              detallePorCoche: entrada.detallePorCoche ?? [],
            } as unknown as Prisma.InputJsonValue,
            coches: {
              create: entrada.coches.map((c) => ({
                conductorNombre: c.nombreConductor,
                incluirConductorEnReparto: c.incluirConductorEnReparto,
                numeroPasajerosLibre: c.numeroPasajeros,
              })),
            },
            gastos: {
              create: entrada.gastosAdicionales.map((g) => ({
                nombre: g.nombre,
                importe: g.importe,
              })),
            },
          },
        });
        viajesSubidos++;
      }

      return { viajesSubidos, viajesOmitidos, cochesSubidos: perfil.coches.length, cochesBorrados };
    });
    return NextResponse.json({ ok: true, ...resultado });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar en el servidor." },
      { status: 500 },
    );
  }
}
