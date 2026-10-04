// src/mapas/openRouteService.ts — cliente de mapas para el navegador.
//
// Pasa por nuestras APIs (/api/geocode y /api/ruta): evita el CORS de
// OpenRouteService y no expone la key. Sin key en el servidor, la
// calculadora sigue funcionando con los km manuales.

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

// Si el servicio falla se deja de intentar en la sesión para no spamear.
// Se resetea al recargar (arreglar la key exige reiniciar el dev igualmente).
let mapasCaidos = false;

export function estanCaidosLosMapas(): boolean {
  return mapasCaidos;
}

export async function buscarDirecciones(
  texto: string,
  senal?: AbortSignal,
): Promise<SugerenciaDireccion[]> {
  if (mapasCaidos) throw new Error("Servicio de mapas no disponible.");
  const respuesta = await fetch(`/api/geocode?text=${encodeURIComponent(texto)}`, {
    signal: senal,
  });
  const datos = await respuesta.json();
  if (datos.servicioCaido) mapasCaidos = true;
  if (!respuesta.ok || !datos.ok) {
    throw new Error(datos.error ?? "No se pudo buscar la dirección. Comprueba tu conexión.");
  }
  return datos.sugerencias as SugerenciaDireccion[];
}

export async function calcularRutaORS(
  origen: PuntoRuta,
  destino: PuntoRuta,
): Promise<RutaCalculada> {
  if (mapasCaidos) throw new Error("Servicio de mapas no disponible.");
  const respuesta = await fetch("/api/ruta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origen, destino }),
  });
  const datos = await respuesta.json();
  if (datos.servicioCaido) mapasCaidos = true;
  if (!respuesta.ok || !datos.ok) {
    throw new Error(datos.error ?? "No se pudo calcular la ruta. Comprueba tu conexión.");
  }
  return {
    distanciaKm: datos.distanciaKm,
    duracionMin: datos.duracionMin,
    linea: datos.linea,
  };
}
