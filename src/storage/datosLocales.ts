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
const CLAVE_PASO_CALCULADORA = "miconvoy_paso_calculadora";
const CLAVE_VERSION_PERFIL = "miconvoy_perfil_version";
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

// Paso actual de la calculadora, para retomarlo al volver de otra página.
export async function obtenerPasoCalculadora(almacenamiento: Almacenamiento): Promise<number> {
  const paso = await almacenamiento.obtener<number>(CLAVE_PASO_CALCULADORA);
  return paso !== null && Number.isInteger(paso) && paso >= 0 && paso <= 3 ? paso : 0;
}

export async function guardarPasoCalculadora(
  almacenamiento: Almacenamiento,
  paso: number,
): Promise<void> {
  await almacenamiento.guardar(CLAVE_PASO_CALCULADORA, paso);
}

// Versión del esquema del perfil local. Al subirla, los perfiles antiguos se
// migran una sola vez en vez de compararse por JSON en cada carga.
export const VERSION_PERFIL = 2;

// Rellena los campos que no existían en versiones anteriores. Pura y testeable.
export function migrarPerfilLocal(guardado: PerfilLocal): PerfilLocal {
  return {
    ...guardado,
    tieneCoche: guardado.tieneCoche ?? true,
    coches: guardado.coches.map((coche) => ({
      ...coche,
      precioPorLitro: coche.precioPorLitro ?? 0,
      tipoCombustible: coche.tipoCombustible ?? "gasolina",
      plazas: coche.plazas ?? 5,
    })),
  };
}

export async function obtenerVersionPerfil(almacenamiento: Almacenamiento): Promise<number> {
  return (await almacenamiento.obtener<number>(CLAVE_VERSION_PERFIL)) ?? 0;
}

export async function guardarVersionPerfil(almacenamiento: Almacenamiento): Promise<void> {
  await almacenamiento.guardar(CLAVE_VERSION_PERFIL, VERSION_PERFIL);
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
