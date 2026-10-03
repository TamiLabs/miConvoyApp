"use client";

import { useEffect, useState } from "react";

export interface EstadoServidor {
  cargando: boolean;
  disponible: boolean | null;
  motivo: string | null;
}

// Todo lo online depende de SERVER_ON a través de GET /api/salud:
// el cliente jamás lee el .env directamente.
export function useEstadoServidor(): EstadoServidor {
  const [estado, setEstado] = useState<EstadoServidor>({
    cargando: true,
    disponible: null,
    motivo: null,
  });

  useEffect(() => {
    let vivo = true;
    fetch("/api/salud", { cache: "no-store" })
      .then(async (respuesta) => {
        if (!respuesta.ok) throw new Error();
        const datos = await respuesta.json();
        if (vivo) {
          setEstado({
            cargando: false,
            disponible: !!datos.disponible,
            motivo: datos.motivo ?? null,
          });
        }
      })
      .catch(() => {
        if (vivo) {
          setEstado({
            cargando: false,
            disponible: false,
            motivo: "Sin conexión con la app.",
          });
        }
      });
    return () => {
      vivo = false;
    };
  }, []);

  return estado;
}
