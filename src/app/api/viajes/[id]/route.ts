import { NextResponse, type NextRequest } from "next/server";
import { baseDatos } from "@/db";
import { calcularCoche } from "@/calculadora";

// Viaje público con plazas y reparto calculado en vivo según ocupantes reales.
export const dynamic = "force-dynamic";

export async function GET(_peticion: NextRequest, { params }: { params: { id: string } }) {
  try {
    const viaje = await baseDatos.viaje.findUnique({
      where: { id: params.id },
      include: {
        coches: { include: { ocupantes: true, coche: true } },
        gastos: true,
      },
    });
    if (!viaje) {
      return NextResponse.json({ ok: false, error: "Viaje no encontrado." }, { status: 404 });
    }
    const gastosPorCoche =
      viaje.gastos.reduce((suma, g) => suma + g.importe, 0) / Math.max(viaje.coches.length, 1);
    const coches = viaje.coches.map((coche) => {
      const consumo = coche.consumo ?? coche.coche?.consumo ?? 0;
      const precio = coche.precio ?? coche.coche?.precio ?? 0;
      const plazas = coche.plazas ?? coche.coche?.plazas ?? 5;
      const ocupantes = [...coche.ocupantes].sort((a, b) => a.plaza - b.plaza);
      const total = ocupantes.length;
      const pagan = coche.incluirConductorEnReparto ? total : Math.max(total - 1, 1);
      let costePorPersona = 0;
      let costeTotal = 0;
      if (consumo > 0 && precio > 0 && viaje.distanciaKm > 0 && total > 0) {
        const resultado = calcularCoche({
          consumo,
          distanciaKm: viaje.distanciaKm,
          precioPorLitro: precio,
          idaYVuelta: viaje.idaYVuelta,
          gastosAdicionales: [{ nombre: "compartidos", importe: gastosPorCoche }],
          numeroPasajeros: total - 1,
          incluirConductorEnReparto: coche.incluirConductorEnReparto,
        });
        costePorPersona = resultado.costePorPersona;
        costeTotal = resultado.costeTotal;
      }
      return {
        id: coche.id,
        conductorNombre: coche.conductorNombre,
        incluirConductorEnReparto: coche.incluirConductorEnReparto,
        consumo,
        precio,
        plazas,
        marca: coche.coche?.marca ?? null,
        modelo: coche.coche?.modelo ?? null,
        ocupantes: ocupantes.map((o) => ({ id: o.id, plaza: o.plaza, nombre: o.nombre })),
        total,
        pagan,
        costePorPersona,
        costeTotal,
      };
    });
    return NextResponse.json({
      ok: true,
      viaje: {
        id: viaje.id,
        origen: viaje.origen,
        destino: viaje.destino,
        fecha: viaje.fecha,
        idaYVuelta: viaje.idaYVuelta,
        distanciaKm: viaje.distanciaKm,
        gastos: viaje.gastos,
        coches,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo leer el viaje." }, { status: 500 });
  }
}
