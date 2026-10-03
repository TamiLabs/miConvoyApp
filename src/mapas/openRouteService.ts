// src/mapas/openRouteService.ts — cliente mínimo de OpenRouteService.
//
// - Geocode (autocompletado) para convertir texto en coordenadas.
// - Directions (driving-car, GeoJSON) para distancia, duración y trazado.
// La clave va en .env como NEXT_PUBLIC_ORS_API_KEY. Sin clave, la calculadora
// sigue funcionando con los km manuales.

export interface PuntoRuta {
  latitud: number;
  longitud: number;
  etiqueta: string;
}

export interface SugerenciaDireccion {
  id: string;
  etiqueta: string;
  latitud: number;
  longitud: number;
}

export interface RutaCalculada {
  distanciaKm: number;
  duracionMin: number;
  // Línea [lat, lng] lista para Leaflet.
  linea: [number, number][];
}

export function leerClaveORS(): string {
  return process.env.NEXT_PUBLIC_ORS_API_KEY ?? "";
}

interface RespuestaGeocode {
  features?: {
    properties?: { id?: string; label?: string; name?: string };
    geometry?: { coordinates?: [number, number] };
  }[];
}

export async function buscarDirecciones(
  texto: string,
  senal?: AbortSignal,
): Promise<SugerenciaDireccion[]> {
  const clave = leerClaveORS();
  if (!clave) throw new Error("Servicio de mapas no disponible.");
  const url =
    `https://api.openrouteservice.org/geocode/autocomplete` +
    `?api_key=${clave}&text=${encodeURIComponent(texto)}` +
    `&boundary.country=ES&size=5&lang=es`;
  const respuesta = await fetch(url, { signal: senal });
  if (!respuesta.ok) throw new Error("No se pudo buscar la dirección. Comprueba tu conexión.");
  const datos = (await respuesta.json()) as RespuestaGeocode;
  return (datos.features ?? [])
    .filter((f) => f.geometry?.coordinates)
    .map((f, i) => ({
      id: `${f.properties?.id ?? i}-${f.geometry?.coordinates?.join(",")}`,
      etiqueta: f.properties?.label ?? f.properties?.name ?? texto,
      longitud: f.geometry?.coordinates?.[0] ?? 0,
      latitud: f.geometry?.coordinates?.[1] ?? 0,
    }));
}

interface RespuestaRuta {
  features?: {
    geometry?: { coordinates?: [number, number][] };
    properties?: { summary?: { distance?: number; duration?: number } };
  }[];
}

export async function calcularRutaORS(
  origen: PuntoRuta,
  destino: PuntoRuta,
): Promise<RutaCalculada> {
  const clave = leerClaveORS();
  if (!clave) throw new Error("Servicio de mapas no disponible.");
  const respuesta = await fetch(
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
    {
      method: "POST",
      headers: { Authorization: clave, "Content-Type": "application/json" },
      body: JSON.stringify({
        coordinates: [
          [origen.longitud, origen.latitud],
          [destino.longitud, destino.latitud],
        ],
      }),
    },
  );
  if (!respuesta.ok) throw new Error("No se pudo calcular la ruta. Comprueba tu conexión.");
  const datos = (await respuesta.json()) as RespuestaRuta;
  const tramo = datos.features?.[0];
  if (!tramo?.geometry?.coordinates) throw new Error("Sin ruta entre esos dos puntos.");
  return {
    distanciaKm: (tramo.properties?.summary?.distance ?? 0) / 1000,
    duracionMin: Math.round((tramo.properties?.summary?.duration ?? 0) / 60),
    linea: tramo.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
  };
}
