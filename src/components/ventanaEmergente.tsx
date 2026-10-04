"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface PropiedadesVentanaEmergente {
  abierto: boolean;
  alCerrar: () => void;
  titulo?: string;
  children: React.ReactNode;
}

const SELECTOR_FOCO = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Ventanas abiertas ahora mismo: el scroll vuelve solo cuando se cierra la última.
let ventanasAbiertas = 0;

export function VentanaEmergente({
  abierto,
  alCerrar,
  titulo,
  children,
}: PropiedadesVentanaEmergente) {
  const referenciaContenido = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    ventanasAbiertas++;
    document.body.style.overflow = "hidden";
    referenciaContenido.current
      ?.querySelector<HTMLElement>(SELECTOR_FOCO)
      ?.focus({ preventScroll: true });

    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        alCerrar();
        return;
      }
      if (evento.key !== "Tab") return;
      const elementos = [
        ...(referenciaContenido.current?.querySelectorAll<HTMLElement>(SELECTOR_FOCO) ?? []),
      ].filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
      if (elementos.length === 0) return;
      const primero = elementos[0];
      const ultimo = elementos[elementos.length - 1];
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener("keydown", alPulsarTecla);
    return () => {
      document.removeEventListener("keydown", alPulsarTecla);
      ventanasAbiertas = Math.max(0, ventanasAbiertas - 1);
      if (ventanasAbiertas === 0) document.body.style.overflow = "";
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
      <div className="ventanaEmergente__contenido" ref={referenciaContenido}>
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
