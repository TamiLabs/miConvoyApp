// src/storage/datosLocales.ts — funciones específicas de MiConvoy que
// usan el adaptador genérico de almacenamiento.ts. Aquí sí se conocen las claves,
// el límite de 10 viajes y las entidades del dominio (EntradaHistorial,
// PerfilLocal, definidas en tiposModoGratis.ts).

import type { Almacenamiento } from "./almacenamiento";
import type { EntradaHistorial, PerfilLocal, UltimoViajeLocal } from "./tiposModoGratis";

const CLAVE_HISTORIAL = "miconvoy_historial";
const CLAVE_PERFIL = "miconvoy_perfil";
const CLAVE_ULTIMO_VIAJE = "miconvoy_ultimo_viaje";
const CLAVE_HISTORIAL_ACTIVO = "miconvoy_historial_activo";
const CLAVE_ULTIMO_CORREO = "miconvoy_ultimo_correo";
const CLAVE_CREDENCIAL = "miconvoy_credencial";
const CLAVE_HISTORIAL_SUBIDO = "miconvoy_historial_subido";
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

export async function eliminarPerfil(almacenamiento: Almacenamiento): Promise<void> {
  await almacenamiento.limpiar(CLAVE_PERFIL);
}

export async function obtenerUltimoViaje(
  almacenamiento: Almacenamiento,
): Promise<UltimoViajeLocal | null> {
  return almacenamiento.obtener<UltimoViajeLocal>(CLAVE_ULTIMO_VIAJE);
}

export async function guardarUltimoViaje(
  almacenamiento: Almacenamiento,
  viaje: UltimoViajeLocal,
): Promise<void> {
  await almacenamiento.guardar(CLAVE_ULTIMO_VIAJE, viaje);
}

export async function eliminarUltimoViaje(almacenamiento: Almacenamiento): Promise<void> {
  await almacenamiento.limpiar(CLAVE_ULTIMO_VIAJE);
}

// El historial se puede desactivar desde el perfil: si está apagado, la
// calculadora no guarda nada al finalizar el viaje.
export async function obtenerHistorialActivo(almacenamiento: Almacenamiento): Promise<boolean> {
  return (await almacenamiento.obtener<boolean>(CLAVE_HISTORIAL_ACTIVO)) ?? true;
}

export async function guardarHistorialActivo(
  almacenamiento: Almacenamiento,
  activo: boolean,
): Promise<void> {
  await almacenamiento.guardar(CLAVE_HISTORIAL_ACTIVO, activo);
}

// Último correo usado, para recordarlo al volver a iniciar sesión tras olvidar
// el perfil en el dispositivo.
export async function obtenerUltimoCorreo(almacenamiento: Almacenamiento): Promise<string | null> {
  return almacenamiento.obtener<string>(CLAVE_ULTIMO_CORREO);
}

export async function guardarUltimoCorreo(
  almacenamiento: Almacenamiento,
  correo: string,
): Promise<void> {
  await almacenamiento.guardar(CLAVE_ULTIMO_CORREO, correo);
}

// Hash local de la contraseña (provisional hasta el registro con servidor).
// NO es protección real: solo evita pedirla cada vez en este dispositivo.
export async function guardarHashContrasena(
  almacenamiento: Almacenamiento,
  hash: string,
): Promise<void> {
  await almacenamiento.guardar(CLAVE_CREDENCIAL, hash);
}

export async function obtenerHashContrasena(
  almacenamiento: Almacenamiento,
): Promise<string | null> {
  return almacenamiento.obtener<string>(CLAVE_CREDENCIAL);
}

// Ids del historial ya subidos al servidor (para no duplicar viajes).
export async function obtenerIdsHistorialSubidos(
  almacenamiento: Almacenamiento,
): Promise<string[]> {
  return (await almacenamiento.obtener<string[]>(CLAVE_HISTORIAL_SUBIDO)) ?? [];
}

export async function guardarIdsHistorialSubidos(
  almacenamiento: Almacenamiento,
  ids: string[],
): Promise<void> {
  await almacenamiento.guardar(CLAVE_HISTORIAL_SUBIDO, ids);
}
