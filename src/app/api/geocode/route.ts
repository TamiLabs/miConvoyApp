import { NextResponse, type NextRequest } from "next/server";

// Proxy a OpenRouteService Geocode: evita el CORS del navegador y no expone la key.
// Devuelve SIEMPRE 200 (con ok:false si falla) para no ensuciar la consola:
// un fallo aquí es esperado (sin key, sin cuota, sin red) y la app lo gestiona.
export const dynamic = "force-dynamic";

export async function GET(peticion: NextRequest) {
  const texto = peticion.nextUrl.searchParams.get("text")?.trim();
  if (!texto) {
    return NextResponse.json({ ok: false, error: "Escribe una dirección." });
  }
  const clave = process.env.ORS_API_KEY ?? process.env.NEXT_PUBLIC_ORS_API_KEY ?? "";
  if (!clave) {
    return NextResponse.json({
      ok: false,
      error: "Servicio de mapas no disponible.",
      servicioCaido: true,
    });
  }
  const url =
    `https://api.openrouteservice.org/geocode/autocomplete` +
    `?api_key=${clave}&text=${encodeURIComponent(texto)}` +
    `&size=5&lang=es`;
  let respuesta: Response;
  try {
    respuesta = await fetch(url);
  } catch {
    return NextResponse.json({
      ok: false,
      error: "No se pudo buscar la dirección. Comprueba tu conexión.",
      servicioCaido: true,
    });
  }
  if (!respuesta.ok) {
    return NextResponse.json({
      ok: false,
      error: "No se pudo buscar la dirección. Comprueba tu conexión.",
      servicioCaido: true,
    });
  }
  const datos = await respuesta.json();
  const sugerencias = (
    (datos.features ?? []) as {
      properties?: { id?: string; label?: string; name?: string };
      geometry?: { coordinates?: [number, number] };
    }[]
  )
    .filter((f) => f.geometry?.coordinates)
    .map((f, i) => ({
      id: `${f.properties?.id ?? i}-${f.geometry?.coordinates?.join(",")}`,
      etiqueta: f.properties?.label ?? f.properties?.name ?? texto,
      longitud: f.geometry?.coordinates?.[0] ?? 0,
      latitud: f.geometry?.coordinates?.[1] ?? 0,
    }));
  return NextResponse.json({ ok: true, sugerencias });
}
