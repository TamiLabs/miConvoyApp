"use client";

import { useEffect } from "react";

interface CanalAbly {
  subscribe(evento: string, devolucion: () => void): Promise<void>;
}

interface ClienteAbly {
  channels: { get(nombre: string): CanalAbly };
  close(): void;
}

interface AblyGlobal {
  Realtime: new (opciones: object) => ClienteAbly;
}

declare global {
  interface Window {
    Ably?: AblyGlobal;
  }
}

let promesaCarga: Promise<AblyGlobal> | null = null;

// El SDK va por CDN para no meter su bundle en webpack.
function cargarAbly(): Promise<AblyGlobal> {
  if (typeof window === "undefined") return Promise.reject(new Error("Sin ventana."));
  if (window.Ably) return Promise.resolve(window.Ably);
  if (!promesaCarga) {
    promesaCarga = new Promise<AblyGlobal>((resolver, rechazar) => {
      const guion = document.createElement("script");
      guion.src = "https://cdn.ably.com/lib/ably.min-2.js";
      guion.async = true;
      guion.onload = () => {
        if (window.Ably) resolver(window.Ably);
        else rechazar(new Error("Sin Ably."));
      };
      guion.onerror = () => rechazar(new Error("Sin Ably."));
      document.head.appendChild(guion);
    });
  }
  return promesaCarga;
}

// Se suscribe al canal del viaje y llama a alCambiar cada vez que alguien
// mueve una plaza. Sin red o sin key, la página sigue funcionando.
export function useCanalViaje(viajeId: string | null, alCambiar: () => void): void {
  useEffect(() => {
    if (!viajeId) return;
    let cerrado = false;
    let cliente: ClienteAbly | null = null;
    (async () => {
      try {
        const Ably = await cargarAbly();
        if (cerrado) return;
        const realtime = new Ably.Realtime({
          authUrl: "/api/ably/token",
          authParams: { viajeId },
        });
        cliente = realtime;
        const canal = realtime.channels.get(`viaje-${viajeId}`);
        await canal.subscribe("plazas", () => {
          if (!cerrado) alCambiar();
        });
      } catch {
        // Sin tiempo real (sin key, sin red, sin CDN): la página sigue funcionando.
      }
    })();
    return () => {
      cerrado = true;
      cliente?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viajeId]);
}
