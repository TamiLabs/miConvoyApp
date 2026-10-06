"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import type { EntradaHistorial } from "@/storage/tiposModoGratis";
import { formatearEuros, formatearFechaHora, nombreCortoRuta } from "@/formato";

interface PropiedadesHistorialPerfil {
  historial: EntradaHistorial[];
  activo: boolean;
  alCambiarActivo: (valor: boolean) => void;
  alVaciar: () => void;
}

export function HistorialPerfil({
  historial,
  activo,
  alCambiarActivo,
  alVaciar,
}: PropiedadesHistorialPerfil) {
  return (
    <section aria-label="Historial" className="paginaPerfil__apartado">
      <h3 className="tituloSeccion">Historial</h3>
      <label className="interruptor">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => alCambiarActivo(e.target.checked)}
        />
        <span>Guardar historial de viajes</span>
      </label>

      {!activo ? (
        <p className="textoSuave">
          Historial desactivado: al finalizar un viaje no se guardará nada.
        </p>
      ) : historial.length === 0 ? (
        <p className="textoSuave">Aún no hay viajes guardados en este dispositivo.</p>
      ) : (
        <>
          <div className="cabeceraSeccion">
            <p className="textoSuave">Viajes guardados ({historial.length}/10)</p>
            <button type="button" className="botonSutil" onClick={alVaciar}>
              <FontAwesomeIcon icon={faTrash} /> Vaciar
            </button>
          </div>
          <div className="listaTarjetas">
            {historial.map((entrada) => (
              <article key={entrada.id} className="tarjeta">
                <p className="tarjeta__titulo">
                  {nombreCortoRuta(entrada.origen, entrada.destino)}
                </p>
                <p className="textoSuave">
                  {formatearFechaHora(entrada.fecha)}
                  {entrada.esConvoy ? " · convoy" : ""} ·{" "}
                  {entrada.idaYVuelta ? "ida y vuelta" : "solo ida"}
                </p>
                <p>Total: {formatearEuros(entrada.resultado.costeTotal)}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
