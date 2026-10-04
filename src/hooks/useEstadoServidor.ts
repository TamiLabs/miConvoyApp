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
    setEstado((previo) => ({ ...previo, cargando: true }));
    fetch("/api/salud", { cache: "no-store" })
      .then(async (respuesta) => {
        if (!respuesta.ok) throw new Error();
        const datos = await respuesta.json();
        if (vivo) {
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
          setEstado({
            cargando: false,
            disponible: false,
            motivo: "Sin conexión al servidor.",
            servidorOn: null,
            baseDatosOk: null,
          });
        }
      });
    return () => {
      vivo = false;
    };
  }, [intento]);

  return { ...estado, recomprobar: () => setIntento((n) => n + 1) };
}
