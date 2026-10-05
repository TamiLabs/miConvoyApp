"use client";

import { useCallback, useEffect, useState } from "react";
import { useCanalViaje } from "@/hooks/useCanalViaje";

export interface OcupanteVista {
  id: string;
  plaza: number;
  nombre: string;
}

export interface CocheVista {
  id: string;
  conductorNombre: string;
  incluirConductorEnReparto: boolean;
  consumo: number;
  precio: number;
  plazas: number;
  marca: string | null;
  modelo: string | null;
  ocupantes: OcupanteVista[];
  total: number;
  pagan: number;
  costePorPersona: number;
  costeTotal: number;
}

export interface ViajeVista {
  id: string;
  origen: string;
  destino: string;
  fecha: string | null;
  idaYVuelta: boolean;
  distanciaKm: number;
  gastos: { nombre: string; importe: number }[];
  coches: CocheVista[];
}

// Lee el viaje y lo refresca solo cuando Ably avisa de cambios.
export function useViaje(id: string) {
  const [viaje, setViaje] = useState<ViajeVista | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      const respuesta = await fetch(`/api/viajes/${id}`, { cache: "no-store" });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.ok) throw new Error(datos.error ?? "No se pudo leer el viaje.");
      setViaje(datos.viaje as ViajeVista);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el viaje.");
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useCanalViaje(id, recargar);

  return { viaje, cargando, error, recargar };
}
