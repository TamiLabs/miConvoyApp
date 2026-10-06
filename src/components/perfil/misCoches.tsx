"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  ETIQUETAS_COMBUSTIBLE,
  type CocheLocal,
  type PerfilLocal,
} from "@/storage/tiposModoGratis";
import { formatearEuros } from "@/formato";

interface PropiedadesMisCoches {
  perfil: PerfilLocal;
  alAbrirAlta: () => void;
  alAbrirEdicion: (coche: CocheLocal) => void;
  alEliminarCoche: (idCoche: string) => void;
  alCambiarTieneCoche: (valor: boolean) => void;
}

export function MisCoches({
  perfil,
  alAbrirAlta,
  alAbrirEdicion,
  alEliminarCoche,
  alCambiarTieneCoche,
}: PropiedadesMisCoches) {
  const tieneCoche = perfil.tieneCoche ?? true;
  const cochesIncompletos = perfil.coches.some((coche) => (coche.precioPorLitro ?? 0) <= 0);

  return (
    <section aria-label="Mis coches" className="paginaPerfil__apartado">
      <label className="interruptor">
        <input
          type="checkbox"
          checked={tieneCoche}
          onChange={(e) => alCambiarTieneCoche(e.target.checked)}
        />
        <span>Tengo coche</span>
      </label>

      {tieneCoche ? (
        <>
          <div className="cabeceraSeccion">
            <h3 className="tituloSeccion">Mis coches ({perfil.coches.length})</h3>
            <button
              type="button"
              className="botonAnadir"
              onClick={alAbrirAlta}
              aria-label="Añadir coche"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>

          {cochesIncompletos && (
            <p className="aviso">
              Alguno de tus coches no tiene precio de combustible: edítalo para poder calcular
              viajes con él.
            </p>
          )}

          {perfil.coches.length === 0 ? (
            <p className="textoSuave">
              Todavía no tienes coches. Pulsa el botón de añadir para dar de alta el primero.
            </p>
          ) : (
            <div className="listaTarjetas">
              {perfil.coches.map((coche) => (
                <article key={coche.id} className="tarjeta">
                  <h4 className="tarjeta__titulo">
                    {coche.marca} {coche.modelo}
                  </h4>
                  <p className="textoSuave">{coche.matricula}</p>
                  <p>Consumo: {coche.consumo} L/100km</p>
                  <p>{coche.plazas ?? 5} plazas</p>
                  <p>
                    {(coche.precioPorLitro ?? 0) > 0
                      ? `${formatearEuros(coche.precioPorLitro)} · ${ETIQUETAS_COMBUSTIBLE[coche.tipoCombustible] ?? coche.tipoCombustible}`
                      : "Sin precio: edita el coche para añadirlo"}
                  </p>
                  <div className="grupoAcciones">
                    <button
                      type="button"
                      className="botonSecundario"
                      onClick={() => alAbrirEdicion(coche)}
                      aria-label={`Editar ${coche.marca} ${coche.modelo}`}
                    >
                      <FontAwesomeIcon icon={faPen} /> Editar
                    </button>
                    <button
                      type="button"
                      className="botonSutil"
                      onClick={() => alEliminarCoche(coche.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} /> Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="textoSuave">
          Has indicado que no tienes coche: en la calculadora podrás introducir consumo y precio a
          mano en cada viaje.
        </p>
      )}
    </section>
  );
}
