import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

interface ContadorLimite {
  minuto: number;
  peticionesMinuto: number;
  dia: number;
  peticionesDia: number;
  actividad: number;
}

interface EntradaCache {
  caduca: number;
  valor: unknown;
}

interface EstadoORS {
  contadores: Map<string, ContadorLimite>;
  cache: Map<string, EntradaCache>;
  enCurso: Map<string, Promise<unknown>>;
}

const globalORS = globalThis as typeof globalThis & { __miconvoyEstadoORS?: EstadoORS };
const estado = (globalORS.__miconvoyEstadoORS ??= {
  contadores: new Map(),
  cache: new Map(),
  enCurso: new Map(),
});

function leerLimite(nombre: string, predeterminado: number): number {
  const configurado = Number(process.env[nombre]);
  return Number.isInteger(configurado) && configurado > 0
    ? Math.min(configurado, 100_000)
    : predeterminado;
}

const MAXIMO_POR_MINUTO = leerLimite("ORS_MAX_REQUESTS_PER_MINUTE", 30);
const MAXIMO_POR_DIA = leerLimite("ORS_MAX_REQUESTS_PER_DAY", 250);
const MAXIMO_ENTRADAS_CACHE = 1000;
const MINUTO_MS = 60_000;
const DIA_MS = 24 * 60 * MINUTO_MS;

function obtenerIp(peticion: NextRequest): string {
  // Netlify define este encabezado desde el borde. En otros hosts, estos
  // encabezados deben ser escritos por un proxy de confianza.
  return (
    peticion.headers.get("x-nf-client-connection-ip") ??
    peticion.headers.get("cf-connecting-ip") ??
    peticion.headers.get("x-real-ip") ??
    peticion.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "desconocida"
  );
}

function limitarPorIp(peticion: NextRequest, ahora: number): number | null {
  const huella = createHash("sha256").update(obtenerIp(peticion)).digest("hex");
  const minuto = Math.floor(ahora / MINUTO_MS);
  const dia = Math.floor(ahora / DIA_MS);
  const contador = estado.contadores.get(huella) ?? {
    minuto,
    peticionesMinuto: 0,
    dia,
    peticionesDia: 0,
    actividad: ahora,
  };

  if (contador.minuto !== minuto) {
    contador.minuto = minuto;
    contador.peticionesMinuto = 0;
  }
  if (contador.dia !== dia) {
    contador.dia = dia;
    contador.peticionesDia = 0;
  }
  contador.actividad = ahora;

  if (contador.peticionesMinuto >= MAXIMO_POR_MINUTO) {
    estado.contadores.set(huella, contador);
    return Math.max(1, Math.ceil(((minuto + 1) * MINUTO_MS - ahora) / 1000));
  }
  if (contador.peticionesDia >= MAXIMO_POR_DIA) {
    estado.contadores.set(huella, contador);
    return Math.max(1, Math.ceil(((dia + 1) * DIA_MS - ahora) / 1000));
  }

  contador.peticionesMinuto++;
  contador.peticionesDia++;
  estado.contadores.set(huella, contador);

  // Mantiene acotado el consumo de memoria de instancias que reciben muchas IPs.
  if (estado.contadores.size > 2000) {
    for (const [clave, entrada] of estado.contadores) {
      if (ahora - entrada.actividad > DIA_MS) estado.contadores.delete(clave);
    }
    while (estado.contadores.size > 2000) {
      const masAntigua = [...estado.contadores].sort((a, b) => a[1].actividad - b[1].actividad)[0];
      if (!masAntigua) break;
      estado.contadores.delete(masAntigua[0]);
    }
  }
  return null;
}

export async function consultarORS<T>(
  peticion: NextRequest,
  claveCache: string,
  duracionCacheMs: number,
  cargar: () => Promise<T>,
): Promise<{ datos: T; limitado: false } | { limitado: true; esperaSegundos: number }> {
  const ahora = Date.now();
  const entrada = estado.cache.get(claveCache);
  if (entrada && entrada.caduca > ahora) {
    return { datos: entrada.valor as T, limitado: false };
  }
  if (entrada) estado.cache.delete(claveCache);

  const pendiente = estado.enCurso.get(claveCache) as Promise<T> | undefined;
  if (pendiente) return { datos: await pendiente, limitado: false };

  const esperaSegundos = limitarPorIp(peticion, ahora);
  if (esperaSegundos !== null) return { limitado: true, esperaSegundos };

  const carga = cargar();
  estado.enCurso.set(claveCache, carga);
  try {
    const datos = await carga;
    estado.cache.set(claveCache, { valor: datos, caduca: Date.now() + duracionCacheMs });
    if (estado.cache.size > MAXIMO_ENTRADAS_CACHE) {
      for (const [clave, valor] of estado.cache) {
        if (valor.caduca <= Date.now()) estado.cache.delete(clave);
      }
      while (estado.cache.size > MAXIMO_ENTRADAS_CACHE) {
        const primera = estado.cache.keys().next().value as string | undefined;
        if (!primera) break;
        estado.cache.delete(primera);
      }
    }
    return { datos, limitado: false };
  } finally {
    estado.enCurso.delete(claveCache);
  }
}

export function respuestaLimiteORS(esperaSegundos: number): Response {
  return Response.json(
    { ok: false, error: "Has alcanzado el límite temporal de búsqueda. Inténtalo más tarde." },
    { status: 429, headers: { "Retry-After": String(esperaSegundos) } },
  );
}
