// src/tiempoReal.ts — Ably solo en servidor.
//
// La key completa (ABLY_API_KEY) jamás sale de aquí: el navegador pide
// tokens temporales a POST /api/ably/token, limitados a su viaje.
// Vale igual en Netlify, Docker o cualquier hosting (solo HTTPS saliente).

import * as Ably from "ably";

let cliente: Ably.Rest | null = null;

export function obtenerAbly(): Ably.Rest {
  const clave = process.env.ABLY_API_KEY ?? "";
  if (!clave) throw new Error("Falta ABLY_API_KEY en el .env.");
  cliente ??= new Ably.Rest(clave);
  return cliente;
}

// Avisa a todos los que miran el viaje de que las plazas cambiaron.
export async function publicarPlazas(viajeId: string): Promise<void> {
  await obtenerAbly().channels.get(`viaje-${viajeId}`).publish("plazas", {
    fecha: new Date().toISOString(),
  });
}
