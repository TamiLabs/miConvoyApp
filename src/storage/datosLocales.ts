// src/storage/datosLocales.ts — funciones específicas de MiConvoy que
// usan el adaptador genérico de almacenamiento.ts. Aquí sí se conocen las claves,
// el límite de 10 viajes y las entidades del dominio (EntradaHistorial,
// PerfilLocal, definidas en tiposModoGratis.ts).

import type { Almacenamiento } from "./almacenamiento";
import type { EntradaHistorial, PerfilLocal } from "./tiposModoGratis";

const CLAVE_HISTORIAL = "miconvoy_historial";
const CLAVE_PERFIL = "miconvoy_perfil";
const MAXIMO_HISTORIAL = 10;

export async function obtenerHistorial(
  almacenamiento: Almacenamiento,
): Promise<EntradaHistorial[]> {
  return (await almacenamiento.obtener<EntradaHistorial[]>(CLAVE_HISTORIAL)) ?? [];
}

export async function anadirEntradaHistorial(
  almacenamiento: Almacenamiento,
  entrada: EntradaHistorial,
): Promise<void> {
  const historialActual = await obtenerHistorial(almacenamiento);
  // El más reciente primero; al superar el máximo se descarta el más antiguo.
  const historialActualizado = [entrada, ...historialActual].slice(0, MAXIMO_HISTORIAL);
  await almacenamiento.guardar(CLAVE_HISTORIAL, historialActualizado);
}

export async function limpiarHistorial(almacenamiento: Almacenamiento): Promise<void> {
  await almacenamiento.limpiar(CLAVE_HISTORIAL);
}

export async function obtenerPerfil(almacenamiento: Almacenamiento): Promise<PerfilLocal | null> {
  return almacenamiento.obtener<PerfilLocal>(CLAVE_PERFIL);
}

export async function guardarPerfil(
  almacenamiento: Almacenamiento,
  perfil: PerfilLocal,
): Promise<void> {
  await almacenamiento.guardar(CLAVE_PERFIL, perfil);
}
