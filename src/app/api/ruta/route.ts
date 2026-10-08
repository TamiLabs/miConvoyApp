import { NextResponse, type NextRequest } from "next/server";
import { consultarORS, respuestaLimiteORS } from "@/mapas/proteccionORS";

// Proxy a OpenRouteService Directions: evita el CORS del navegador y no expone la key.
// Los fallos del proveedor se devuelven como ok:false; la app permite introducir
// la distancia manualmente. La validación y el límite temporal usan HTTP status.
export const dynamic = "force-dynamic";

interface PuntoRutaApi {
  latitud: number;
  longitud: number;
}

export async function POST(peticion: NextRequest) {
  const tamano = Number(peticion.headers.get("content-length") ?? 0);
  if (tamano > 10_000) {
    return NextResponse.json({ ok: false, error: "Solicitud demasiado grande." }, { status: 413 });
  }
  let cuerpo: { origen?: PuntoRutaApi; destino?: PuntoRutaApi };
  try {
    cuerpo = (await peticion.json()) as { origen?: PuntoRutaApi; destino?: PuntoRutaApi };
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }
  if (
    !cuerpo ||
    typeof cuerpo.origen?.latitud !== "number" ||
    typeof cuerpo.origen?.longitud !== "number" ||
    typeof cuerpo.destino?.latitud !== "number" ||
    typeof cuerpo.destino?.longitud !== "number" ||
    !Number.isFinite(cuerpo.origen.latitud) ||
    !Number.isFinite(cuerpo.origen.longitud) ||
    !Number.isFinite(cuerpo.destino.latitud) ||
    !Number.isFinite(cuerpo.destino.longitud) ||
    Math.abs(cuerpo.origen.latitud) > 90 ||
    Math.abs(cuerpo.destino.latitud) > 90 ||
    Math.abs(cuerpo.origen.longitud) > 180 ||
    Math.abs(cuerpo.destino.longitud) > 180
  ) {
    return NextResponse.json({ ok: false, error: "Las coordenadas de origen o destino no son válidas." }, { status: 400 });
  }
  if (
    cuerpo.origen.latitud === cuerpo.destino.latitud &&
    cuerpo.origen.longitud === cuerpo.destino.longitud
  ) {
    return NextResponse.json({ ok: false, error: "El origen y el destino deben ser distintos." }, { status: 400 });
  }
  const clave = process.env.ORS_API_KEY ?? "";
  if (!clave) {
    return NextResponse.json({
      ok: false,
      error: "Servicio de mapas no disponible.",
      servicioCaido: true,
    });
  }
  let datos: {
    features?: {
      geometry?: { coordinates?: [number, number][] };
      properties?: { summary?: { distance?: number; duration?: number } };
    }[];
  };
  try {
    const claveCache = [cuerpo.origen, cuerpo.destino]
      .map((punto) => `${punto.latitud.toFixed(6)},${punto.longitud.toFixed(6)}`)
      .join("|");
    const consulta = await consultarORS(
      peticion,
      `ruta:${claveCache}`,
      24 * 60 * 60 * 1000,
      async () => {
        const respuesta = await fetch(
          "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
          {
            method: "POST",
            headers: { Authorization: clave, "Content-Type": "application/json" },
            body: JSON.stringify({
              coordinates: [
                [cuerpo.origen!.longitud, cuerpo.origen!.latitud],
                [cuerpo.destino!.longitud, cuerpo.destino!.latitud],
              ],
            }),
            signal: AbortSignal.timeout(8000),
          },
        );
        if (!respuesta.ok) throw new Error("OpenRouteService no disponible.");
        return (await respuesta.json()) as typeof datos;
      },
    );
    if (consulta.limitado) return respuestaLimiteORS(consulta.esperaSegundos);
    datos = consulta.datos;
  } catch {
    return NextResponse.json({
      ok: false,
      error: "No se pudo calcular la ruta. Comprueba tu conexión.",
      servicioCaido: true,
    });
  }
  const tramo = datos.features?.[0];
  if (!tramo?.geometry?.coordinates) {
    return NextResponse.json({ ok: false, error: "Sin ruta entre esos dos puntos." });
  }
  return NextResponse.json({
    ok: true,
    distanciaKm: (tramo.properties?.summary?.distance ?? 0) / 1000,
    duracionMin: Math.round((tramo.properties?.summary?.duration ?? 0) / 60),
    linea: tramo.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
  });
}
