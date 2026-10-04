import { NextResponse, type NextRequest } from "next/server";

// Proxy a OpenRouteService Directions: evita el CORS del navegador y no expone la key.
// Devuelve SIEMPRE 200 (con ok:false si falla) para no ensuciar la consola.
export const dynamic = "force-dynamic";

interface PuntoRutaApi {
  latitud: number;
  longitud: number;
}

export async function POST(peticion: NextRequest) {
  let cuerpo: { origen?: PuntoRutaApi; destino?: PuntoRutaApi };
  try {
    cuerpo = (await peticion.json()) as { origen?: PuntoRutaApi; destino?: PuntoRutaApi };
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." });
  }
  if (
    typeof cuerpo.origen?.latitud !== "number" ||
    typeof cuerpo.origen?.longitud !== "number" ||
    typeof cuerpo.destino?.latitud !== "number" ||
    typeof cuerpo.destino?.longitud !== "number" ||
    !Number.isFinite(cuerpo.origen.latitud) ||
    !Number.isFinite(cuerpo.origen.longitud) ||
    !Number.isFinite(cuerpo.destino.latitud) ||
    !Number.isFinite(cuerpo.destino.longitud)
  ) {
    return NextResponse.json({ ok: false, error: "Faltan origen y destino." });
  }
  const clave = process.env.ORS_API_KEY ?? process.env.NEXT_PUBLIC_ORS_API_KEY ?? "";
  if (!clave) {
    return NextResponse.json({
      ok: false,
      error: "Servicio de mapas no disponible.",
      servicioCaido: true,
    });
  }
  let respuesta: Response;
  try {
    respuesta = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
      method: "POST",
      headers: { Authorization: clave, "Content-Type": "application/json" },
      body: JSON.stringify({
        coordinates: [
          [cuerpo.origen.longitud, cuerpo.origen.latitud],
          [cuerpo.destino.longitud, cuerpo.destino.latitud],
        ],
      }),
    });
  } catch {
    return NextResponse.json({
      ok: false,
      error: "No se pudo calcular la ruta. Comprueba tu conexión.",
      servicioCaido: true,
    });
  }
  if (!respuesta.ok) {
    return NextResponse.json({
      ok: false,
      error: "No se pudo calcular la ruta. Comprueba tu conexión.",
      servicioCaido: true,
    });
  }
  const datos = (await respuesta.json()) as {
    features?: {
      geometry?: { coordinates?: [number, number][] };
      properties?: { summary?: { distance?: number; duration?: number } };
    }[];
  };
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
