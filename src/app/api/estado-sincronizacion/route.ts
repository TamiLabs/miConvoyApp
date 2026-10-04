import { NextResponse, type NextRequest } from "next/server";
import { baseDatos } from "@/db";

// Compara la foto local con la del servidor SIN devolver hashes al cliente.
// Responde qué apartados difieren para activar o no el botón de sincronizar.
export const dynamic = "force-dynamic";

interface CocheFoto {
  marca: string;
  modelo: string;
  matricula: string;
  consumo: number;
  precioPorLitro?: number;
  tipoCombustible?: string;
  plazas?: number;
}

interface CuerpoEstado {
  perfil?: {
    correo?: string;
    nombre?: string;
    foto?: string | null;
    hashContrasena?: string | null;
    coches?: CocheFoto[];
  };
  historialIds?: string[];
}

function normalizarCoche(coche: CocheFoto): string {
  return JSON.stringify({
    marca: coche.marca.trim(),
    modelo: coche.modelo.trim(),
    matricula: coche.matricula.trim().toUpperCase(),
    consumo: coche.consumo,
    precio: coche.precioPorLitro ?? 0,
    tipo: coche.tipoCombustible ?? "gasolina",
    plazas: coche.plazas ?? 5,
  });
}

export async function POST(peticion: NextRequest) {
  if (process.env.SERVER_ON !== "true") {
    return NextResponse.json({ ok: false, error: "Modo online desactivado." }, { status: 503 });
  }

  let cuerpo: CuerpoEstado;
  try {
    cuerpo = (await peticion.json()) as CuerpoEstado;
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }
  if (!cuerpo.perfil?.correo) {
    return NextResponse.json({ ok: false, error: "Falta el correo." }, { status: 400 });
  }

  try {
    const usuario = await baseDatos.user.findUnique({
      where: { email: cuerpo.perfil.correo },
      include: {
        coches: true,
        viajesOrganizados: { select: { origenClienteId: true } },
      },
    });

    const cochesLocales = cuerpo.perfil.coches ?? [];
    const idsLocales = cuerpo.historialIds ?? [];

    if (!usuario) {
      return NextResponse.json({
        ok: true,
        existe: false,
        usuarioDifiere: true,
        cochesDifieren: cochesLocales.length > 0,
        viajesPendientes: idsLocales.length,
      });
    }

    const usuarioDifiere =
      (usuario.name ?? "") !== (cuerpo.perfil.nombre ?? "") ||
      (usuario.image ?? null) !== (cuerpo.perfil.foto ?? null) ||
      (usuario.password ?? null) !== (cuerpo.perfil.hashContrasena ?? null);

    const locales = [...cochesLocales.map(normalizarCoche)].sort();
    const remotos = [
      ...usuario.coches.map((c) =>
        normalizarCoche({
          marca: c.marca,
          modelo: c.modelo,
          matricula: c.matricula,
          consumo: c.consumo,
          precioPorLitro: c.precio,
          tipoCombustible: c.tipoCombustible,
          plazas: c.plazas,
        }),
      ),
    ].sort();
    const cochesDifieren = JSON.stringify(locales) !== JSON.stringify(remotos);

    const idsServidor = new Set(
      usuario.viajesOrganizados.map((v) => v.origenClienteId).filter((id): id is string => !!id),
    );
    const viajesPendientes = idsLocales.filter((id) => !idsServidor.has(id)).length;

    return NextResponse.json({
      ok: true,
      existe: true,
      usuarioDifiere,
      cochesDifieren,
      viajesPendientes,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo comparar con el servidor." },
      { status: 500 },
    );
  }
}
