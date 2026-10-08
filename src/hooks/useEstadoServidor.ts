"use client";

import { useEffect, useState } from "react";

export interface EstadoServidor {
  cargando: boolean;
  disponible: boolean | null;
  motivo: string | null;
  servidorOn: boolean | null;
  baseDatosOk: boolean | null;
  recomprobar: () => void;
}

// Todo lo online depende de SERVER_ON a través de GET /api/salud:
// el cliente jamás lee el .env directamente.
export function useEstadoServidor(): EstadoServidor {
  const [estado, setEstado] = useState<Omit<EstadoServidor, "recomprobar">>({
    cargando: true,
    disponible: null,
    motivo: null,
    servidorOn: null,
    baseDatosOk: null,
  });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vivo = true;
    // Solo la primera vez muestra "cargando".
    let primeraVez = true;
    const comprobar = () => {
      if (primeraVez) setEstado((previo) => ({ ...previo, cargando: true }));
      fetch("/api/salud", { cache: "no-store" })
        .then(async (respuesta) => {
          if (!respuesta.ok) throw new Error();
          const datos = await respuesta.json();
          if (vivo) {
            primeraVez = false;
            setEstado({
              cargando: false,
              disponible: !!datos.disponible,
              motivo: datos.motivo ?? null,
              servidorOn: datos.servidorOn ?? null,
              baseDatosOk: datos.baseDatosOk ?? null,
            });
          }
        })
        .catch(() => {
          if (vivo) {
            primeraVez = false;
            setEstado({
              cargando: false,
              disponible: false,
              motivo: "Sin conexión al servidor.",
              servidorOn: null,
              baseDatosOk: null,
            });
          }
        });
    };
    // Sin sondeo: se comprueba al montar, al volver a la pestaña y cuando el
    // navegador avisa de que se pierde o recupera la red. El resto lo cubren
    // los errores de cada acción (sincronizar, publicar, reservar…).
    const alVolver = () => {
      if (document.visibilityState === "visible") comprobar();
    };
    const alPerderRed = () => {
      if (!vivo) return;
      primeraVez = false;
      setEstado({
        cargando: false,
        disponible: false,
        motivo: "Sin conexión.",
        servidorOn: null,
        baseDatosOk: null,
      });
    };
    const alRecuperarRed = () => comprobar();
    comprobar();
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("offline", alPerderRed);
    window.addEventListener("online", alRecuperarRed);
    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("offline", alPerderRed);
      window.removeEventListener("online", alRecuperarRed);
    };
  }, [intento]);

  return { ...estado, recomprobar: () => setIntento((n) => n + 1) };
}
