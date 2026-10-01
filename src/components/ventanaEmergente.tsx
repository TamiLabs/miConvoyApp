"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface PropiedadesVentanaEmergente {
  abierto: boolean;
  alCerrar: () => void;
  titulo?: string;
  children: React.ReactNode;
}

export function VentanaEmergente({
  abierto,
  alCerrar,
  titulo,
  children,
}: PropiedadesVentanaEmergente) {
  useEffect(() => {
    if (!abierto) return;
    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") alCerrar();
    };
    document.addEventListener("keydown", alPulsarTecla);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alPulsarTecla);
      document.body.style.overflow = "";
    };
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  return createPortal(
    <div
      className="ventanaEmergente"
      role="dialog"
      aria-modal="true"
      aria-label={titulo ?? "Ventana"}
    >
      <div className="ventanaEmergente__fondo" onClick={alCerrar} />
      <div className="ventanaEmergente__contenido">
        <div className="ventanaEmergente__cabecera">
          {titulo ? <h2 className="ventanaEmergente__titulo">{titulo}</h2> : null}
          <button
            type="button"
            className="ventanaEmergente__cerrar"
            onClick={alCerrar}
            aria-label="Cerrar ventana"
          >
            ✕
          </button>
        </div>
        <div className="ventanaEmergente__cuerpo">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
