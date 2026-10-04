"use client";

import { useEstadoServidor } from "@/hooks/useEstadoServidor";

export default function PaginaEnLinea() {
  const { cargando, disponible, motivo } = useEstadoServidor();

  if (cargando) {
    return <p className="paginaEnLinea textoSuave">Comprobando servidor…</p>;
  }
  if (!disponible) {
    return (
      <p className="paginaEnLinea aviso">
        Modo Online no disponible por ahora.{motivo ? ` ${motivo}` : ""}
      </p>
    );
  }
  return (
    <section className="paginaEnLinea">
      <h2 className="paginaPerfil__subtitulo">Convoyes online</h2>
      <p className="textoSuave">
        Servidor conectado. Crear viajes con enlace de invitación llegará en los siguientes pasos.
      </p>
    </section>
  );
}
