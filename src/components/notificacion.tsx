"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

interface PropiedadesNotificacion {
  icono: React.ReactNode;
  titulo: string;
  mensaje: string;
  alCerrar: () => void;
  alPulsar?: () => void;
}

// Estructura única: icono | título + mensaje | X. Si es clickable, toda la
// tarjeta responde (salvo la X, que solo cierra).
export function Notificacion({
  icono,
  titulo,
  mensaje,
  alCerrar,
  alPulsar,
}: PropiedadesNotificacion) {
  return (
    <div
      className={alPulsar ? "notificacion notificacion--clicable" : "notificacion"}
      role={alPulsar ? "button" : "status"}
      tabIndex={alPulsar ? 0 : undefined}
      onClick={alPulsar}
      onKeyDown={
        alPulsar
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                alPulsar();
              }
            }
          : undefined
      }
    >
      <span className="notificacion__icono" aria-hidden="true">
        {icono ?? <FontAwesomeIcon icon={faXmark} />}
      </span>
      <span className="notificacion__texto">
        <strong className="notificacion__titulo">{titulo}</strong>
        <span className="textoSuave">{mensaje}</span>
      </span>
      <button
        type="button"
        className="notificacion__cerrar"
        onClick={(e) => {
          e.stopPropagation();
          alCerrar();
        }}
        aria-label="Cerrar aviso"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}
