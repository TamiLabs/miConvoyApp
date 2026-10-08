"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCircleDot,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
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

  // Como un coche real: primera fila de 2, resto en filas de 3. La plaza 1
  // (delantera izquierda) es la del conductor, con su volante.
  const asientos = Array.from({ length: coche.plazas }, (_, k) => k + 1);
  const filasAsientos: number[][] = [asientos.slice(0, 2)];
  for (let i = 2; i < asientos.length; i += 3) filasAsientos.push(asientos.slice(i, i + 3));

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
    tokenEdicion &&
    llamar(`/api/viajes/${viajeId}/liberar`, { ocupanteId, tokenEdicion });

  return (
    <article className="tarjeta">
      {esConvoy && (
        <h4 className="tarjeta__titulo">
          {coche.marca ? `${coche.marca} ${coche.modelo ?? ""}`.trim() : "Coche"} ·{" "}
          {coche.conductorNombre}
        </h4>
      )}
      {!esConvoy && <h4 className="tarjeta__titulo">Conduce {coche.conductorNombre}</h4>}
      <p className="textoSuave">
        {coche.total} de {coche.plazas} plazas · {formatearEuros(coche.costePorPersona)} por persona
      </p>
      <div
        className="cocheSimulado"
        role="group"
        aria-label={`Asientos del coche de ${coche.conductorNombre}`}
      >
        <div className="cocheSimulado__luna" aria-hidden="true" />
        {filasAsientos.map((fila, fi) => (
          <div key={fi} className="cocheSimulado__fila">
            {fila.map((plaza) => {
              const ocupante = ocupanteDe(plaza);
              const esConductor = plaza === 1;
              const puedeGestionar = organizador && !!ocupante && !esConductor;
              return (
                <button
                  key={plaza}
                  type="button"
                  disabled={ocupado || (!!ocupante && !puedeGestionar)}
                  onClick={() => setPlazaElegida(plazaElegida === plaza ? null : plaza)}
                  aria-pressed={plazaElegida === plaza}
                  className={
                    ocupante
                      ? esConductor
                        ? "plaza plaza--conductor"
                        : plazaElegida === plaza && puedeGestionar
                          ? "plaza plaza--elegida"
                          : "plaza plaza--ocupada"
                      : plazaElegida === plaza
                        ? "plaza plaza--elegida"
                        : "plaza plaza--libre"
                  }
                  aria-label={
                    ocupante
                      ? `Plaza ${plaza}: ${ocupante.nombre}${puedeGestionar ? ", gestionar plaza" : ""}`
                      : `Plaza ${plaza} libre, elegir`
                  }
                >
                  <span className="plaza__numero">
                    {esConductor && (
                      <FontAwesomeIcon icon={faCircleDot} className="plaza__volante" />
                    )}{" "}
                    {plaza}
                  </span>

                  <span className="plaza__nombre">{ocupante?.nombre ?? ""}</span>
                </button>
              );
            })}
          </div>
        ))}
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
            className="botonPrincipal"
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
              Plaza de {ocupanteDe(plazaElegida)?.nombre}. Solo el organizador puede liberar esta
              plaza.
            </p>
            {organizador && tokenEdicion && (
              <button
                type="button"
                className="botonSecundario"
                onClick={() => {
                  const ocupante = ocupanteDe(plazaElegida);
                  if (ocupante) void alLiberar(ocupante.id);
                }}
                disabled={ocupado}
              >
                <FontAwesomeIcon icon={faXmark} /> Liberar plaza
              </button>
            )}
          </div>
        )}
      {mensaje ? <p className="formulario__error">{mensaje}</p> : null}
      {libres === 0 && <p className="textoSuave">Coche completo.</p>}
    </article>
  );
}
