import { NextResponse, type NextRequest } from "next/server";
import { consultarORS, respuestaLimiteORS } from "@/mapas/proteccionORS";

// Proxy a OpenRouteService Geocode: evita el CORS del navegador y no expone la key.
// Los fallos del proveedor se devuelven como ok:false para que la app permita
// continuar manualmente. La validación y el límite temporal usan sus HTTP status.
export const dynamic = "force-dynamic";

export async function GET(peticion: NextRequest) {
  const texto = peticion.nextUrl.searchParams.get("text")?.trim();
  if (!texto || texto.length < 3 || texto.length > 120 || /[\u0000-\u001f\u007f]/.test(texto)) {
    return NextResponse.json(
      { ok: false, error: "Escribe una dirección de entre 3 y 120 caracteres." },
      { status: 400 },
    );
  }
  const clave = process.env.ORS_API_KEY ?? "";
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
  let datos: {
    features?: {
      properties?: { id?: string; label?: string; name?: string };
      geometry?: { coordinates?: [number, number] };
    }[];
  };
  try {
    const consulta = await consultarORS(
      peticion,
      `geocode:${texto.normalize("NFKC").toLocaleLowerCase("es").replace(/\s+/g, " ")}`,
      6 * 60 * 60 * 1000,
      async () => {
        const respuesta = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!respuesta.ok) throw new Error("OpenRouteService no disponible.");
        return (await respuesta.json()) as typeof datos;
      },
    );
    if (consulta.limitado) return respuestaLimiteORS(consulta.esperaSegundos);
    datos = consulta.datos;
  } catch {
    return NextResponse.json({
      ok: false,
      error: "No se pudo buscar la dirección. Comprueba tu conexión.",
      servicioCaido: true,
    });
  }
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
