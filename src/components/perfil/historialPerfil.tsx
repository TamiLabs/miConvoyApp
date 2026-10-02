"use client";

import type { EntradaHistorial } from "@/storage/tiposModoGratis";
import { formatearEuros, formatearFechaHora } from "@/formato";

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
      <h3 className="paginaPerfil__subtitulo">Historial</h3>
      <label className="paginaPerfil__interruptor">
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
          <div className="paginaPerfil__cochesCabecera">
            <p className="textoSuave">Viajes guardados ({historial.length}/10)</p>
            <button type="button" className="paginaPerfil__botonEliminar" onClick={alVaciar}>
              Vaciar
            </button>
          </div>
          <div className="paginaPerfil__coches">
            {historial.map((entrada) => (
              <article key={entrada.id} className="paginaPerfil__tarjetaCoche">
                <p className="paginaPerfil__cocheTitulo">
                  {[entrada.origen, entrada.destino].filter(Boolean).join(" → ") || "Viaje"}
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
      <p className="textoSuave paginaPerfil__nota">
        Se guarda solo en este dispositivo: si borras la caché, se pierde.
      </p>
    </section>
  );
}
