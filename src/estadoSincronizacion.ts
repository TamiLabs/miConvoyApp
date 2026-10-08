// src/estadoSincronizacion.ts — comprobación compartida de diferencias con el
// servidor. La usan el apartado Sincronización y los avisos globales.

import { adaptadorAlmacenamientoLocal } from "@/storage/almacenamiento";
import { obtenerIdsHistorialSubidos } from "@/storage/datosLocales";
import type { EntradaHistorial, PerfilLocal } from "@/storage/tiposModoGratis";

export interface DiferenciasSync {
  usuarioDifiere: boolean;
  cochesDifieren: boolean;
  viajesPendientes: number;
}

export function hayCambiosSync(diferencias: DiferenciasSync | null): boolean {
  return (
    !!diferencias &&
    (diferencias.usuarioDifiere || diferencias.cochesDifieren || diferencias.viajesPendientes > 0)
  );
}

// Evento que el perfil dispara cuando cambian sus datos locales.
export const EVENTO_DATOS_CAMBIADOS = "miconvoy:datos-cambiados";

export function avisarDatosCambiados(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_DATOS_CAMBIADOS));
  }
}

export async function comprobarDiferencias(
  perfil: PerfilLocal,
  historial: EntradaHistorial[],
  historialActivo: boolean,
): Promise<DiferenciasSync | null> {
  try {
    const subidos = await obtenerIdsHistorialSubidos(adaptadorAlmacenamientoLocal);
    const respuesta = await fetch("/api/estado-sincronizacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        perfil: {
          correo: perfil.correo,
          nombre: perfil.nombre,
          foto: perfil.foto ?? null,
          coches: perfil.coches,
        },
        historialIds: historialActivo
          ? historial.map((e) => e.id).filter((id) => !subidos.includes(id))
          : [],
      }),
    });
    const datos = await respuesta.json();
    if (!respuesta.ok || !datos.ok) return null;
    return {
      usuarioDifiere: !!datos.usuarioDifiere,
      cochesDifieren: !!datos.cochesDifieren,
      viajesPendientes: datos.viajesPendientes ?? 0,
    };
  } catch {
    return null;
  }
}
