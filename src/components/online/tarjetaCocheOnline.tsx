"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faUserMinus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { formatearEuros } from "@/formato";
import type { CocheVista } from "@/hooks/useViaje";

interface PropiedadesTarjetaCocheOnline {
  viajeId: string;
  coche: CocheVista;
  esConvoy: boolean;
  organizador: boolean;
  tokenEdicion?: string;
  alCambiar: () => void;
}

export function TarjetaCocheOnline({
  viajeId,
  coche,
  esConvoy,
  organizador,
  tokenEdicion,
  alCambiar,
}: PropiedadesTarjetaCocheOnline) {
  const [plazaElegida, setPlazaElegida] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const ocupanteDe = (plaza: number) => coche.ocupantes.find((o) => o.plaza === plaza);
  const libres = coche.plazas - coche.ocupantes.length;

  const llamar = async (ruta: string, cuerpo: object): Promise<boolean> => {
    setOcupado(true);
    setMensaje(null);
    try {
      const respuesta = await fetch(ruta, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.ok) throw new Error(datos.error ?? "No se pudo completar.");
      setPlazaElegida(null);
      setNombre("");
      alCambiar();
      return true;
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudo completar.");
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const alReservar = () =>
    plazaElegida !== null &&
    nombre.trim() &&
    llamar(`/api/viajes/${viajeId}/reservar`, {
      cocheDelViajeId: coche.id,
      plaza: plazaElegida,
      nombre: nombre.trim(),
    });

  const alLiberar = (ocupanteId: string) =>
    nombre.trim() &&
    llamar(`/api/viajes/${viajeId}/liberar`, { ocupanteId, nombre: nombre.trim() });

  const alExpulsar = (ocupanteId: string) =>
    tokenEdicion && llamar(`/api/viajes/${viajeId}/expulsar`, { ocupanteId, tokenEdicion });

  return (
    <article className="paginaPerfil__tarjetaCoche">
      {esConvoy && (
        <h4 className="paginaPerfil__cocheTitulo">
          {coche.marca ? `${coche.marca} ${coche.modelo ?? ""}`.trim() : "Coche"} ·{" "}
          {coche.conductorNombre}
        </h4>
      )}
      {!esConvoy && <h4 className="paginaPerfil__cocheTitulo">Conduce {coche.conductorNombre}</h4>}
      <p className="textoSuave">
        {coche.total} de {coche.plazas} plazas · {formatearEuros(coche.costePorPersona)} por persona
      </p>
      <div className="plazas">
        {Array.from({ length: coche.plazas }, (_, k) => k + 1).map((plaza) => {
          const ocupante = ocupanteDe(plaza);
          const esConductor = plaza === 1;
          return (
            <button
              key={plaza}
              type="button"
              disabled={!!ocupante || ocupado}
              onClick={() => setPlazaElegida(plazaElegida === plaza ? null : plaza)}
              className={
                ocupante
                  ? esConductor
                    ? "plaza plaza--conductor"
                    : "plaza plaza--ocupada"
                  : plazaElegida === plaza
                    ? "plaza plaza--elegida"
                    : "plaza plaza--libre"
              }
              aria-label={
                ocupante ? `Plaza ${plaza}: ${ocupante.nombre}` : `Plaza ${plaza} libre, elegir`
              }
            >
              <span className="plaza__numero">{plaza}</span>
              <span className="plaza__nombre">{ocupante?.nombre ?? ""}</span>
            </button>
          );
        })}
      </div>
      {plazaElegida !== null && !ocupanteDe(plazaElegida) && (
        <div className="formulario">
          <label className="formulario__campo">
            <span className="formulario__etiqueta">Tu nombre para la plaza {plazaElegida}</span>
            <input
              className="formulario__entrada"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
            />
          </label>
          <button
            type="button"
            className="formulario__botonPrincipal"
            onClick={alReservar}
            disabled={ocupado || !nombre.trim()}
          >
            <FontAwesomeIcon icon={faCheck} /> Reservar plaza
          </button>
        </div>
      )}
      {plazaElegida !== null &&
        ocupanteDe(plazaElegida) &&
        ocupanteDe(plazaElegida)?.plaza !== 1 && (
          <div className="formulario">
            <p className="textoSuave">
              Plaza de {ocupanteDe(plazaElegida)?.nombre}. Escribe su nombre para liberarla
              {organizador ? " (o expúlsala como organizador)" : ""}.
            </p>
            <label className="formulario__campo">
              <span className="formulario__etiqueta">Nombre</span>
              <input
                className="formulario__entrada"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="El nombre de la plaza"
              />
            </label>
            <div className="formulario__acciones">
              <button
                type="button"
                className="formulario__botonSecundario"
                onClick={() => {
                  const ocupante = ocupanteDe(plazaElegida);
                  if (ocupante) void alLiberar(ocupante.id);
                }}
                disabled={ocupado || !nombre.trim()}
              >
                <FontAwesomeIcon icon={faXmark} /> Liberar
              </button>
              {organizador && (
                <button
                  type="button"
                  className="paginaPerfil__botonEliminar"
                  onClick={() => {
                    const ocupante = ocupanteDe(plazaElegida);
                    if (ocupante) void alExpulsar(ocupante.id);
                  }}
                  disabled={ocupado}
                >
                  <FontAwesomeIcon icon={faUserMinus} /> Expulsar
                </button>
              )}
            </div>
          </div>
        )}
      {mensaje ? <p className="formulario__error">{mensaje}</p> : null}
      {libres === 0 && <p className="textoSuave">Coche completo.</p>}
    </article>
  );
}
