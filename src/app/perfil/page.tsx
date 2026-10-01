"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { adaptadorAlmacenamientoLocal } from "@/storage/almacenamiento";
import { eliminarPerfil, guardarPerfil, obtenerPerfil } from "@/storage/datosLocales";
import type { CocheLocal, PerfilLocal } from "@/storage/tiposModoGratis";
import { SERVIDOR_ACTIVADO } from "@/configuracion";
import { VentanaEmergente } from "@/components/ventanaEmergente";
import {
  FormularioCoche,
  crearCocheConId,
  type DatosFormularioCoche,
} from "@/components/formularioCoche";
import { CrearPerfil, type DatosPerfilNuevo } from "@/components/crearPerfil";

export default function PaginaPerfil() {
  const [cargando, setCargando] = useState(true);
  const [perfil, setPerfil] = useState<PerfilLocal | null>(null);
  const [ventanaAbierta, setVentanaAbierta] = useState(false);
  const [cocheEnEdicion, setCocheEnEdicion] = useState<CocheLocal | null>(null);
  const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);

  useEffect(() => {
    obtenerPerfil(adaptadorAlmacenamientoLocal)
      .then((guardado) => {
        if (guardado && guardado.tieneCoche === undefined) {
          setPerfil({ ...guardado, tieneCoche: true });
        } else {
          setPerfil(guardado);
        }
      })
      .finally(() => setCargando(false));
  }, []);

  const persistir = useCallback(async (actualizado: PerfilLocal) => {
    await guardarPerfil(adaptadorAlmacenamientoLocal, actualizado);
    setPerfil(actualizado);
  }, []);

  const alCrearPerfil = useCallback(
    async (datos: DatosPerfilNuevo) => {
      const nuevo: PerfilLocal = {
        correo: datos.correo,
        nombre: datos.nombre,
        foto: datos.foto,
        tieneCoche: true,
        coches: [],
      };
      await persistir(nuevo);
    },
    [persistir],
  );

  const abrirAlta = useCallback(() => {
    setCocheEnEdicion(null);
    setVentanaAbierta(true);
  }, []);

  const abrirEdicion = useCallback((coche: CocheLocal) => {
    setCocheEnEdicion(coche);
    setVentanaAbierta(true);
  }, []);

  const alGuardarCoche = useCallback(
    async (datos: DatosFormularioCoche) => {
      if (!perfil) return;
      const actualizado: PerfilLocal = cocheEnEdicion
        ? {
            ...perfil,
            coches: perfil.coches.map((coche) =>
              coche.id === cocheEnEdicion.id ? { ...coche, ...datos } : coche,
            ),
          }
        : { ...perfil, coches: [...perfil.coches, crearCocheConId(datos)] };
      await persistir(actualizado);
      setVentanaAbierta(false);
      setCocheEnEdicion(null);
    },
    [perfil, cocheEnEdicion, persistir],
  );

  const alEliminarCoche = useCallback(
    async (idCoche: string) => {
      if (!perfil) return;
      if (!window.confirm("¿Eliminar este coche del perfil?")) return;
      await persistir({ ...perfil, coches: perfil.coches.filter((c) => c.id !== idCoche) });
    },
    [perfil, persistir],
  );

  const alCambiarTieneCoche = useCallback(
    async (valor: boolean) => {
      if (!perfil) return;
      await persistir({ ...perfil, tieneCoche: valor });
    },
    [perfil, persistir],
  );

  const alBorrarPerfil = useCallback(async () => {
    if (!window.confirm("¿Borrar tu perfil de este dispositivo? El historial se conserva.")) return;
    await eliminarPerfil(adaptadorAlmacenamientoLocal);
    setPerfil(null);
  }, []);

  const alPulsarServidor = useCallback(() => {
    setMensajeServidor("Disponible cuando se conecte el backend (ver issues 1.7 y 1.8).");
  }, []);

  if (cargando) return <p className="paginaPerfil textoSuave">Cargando perfil…</p>;
  if (!perfil) {
    return (
      <section className="paginaPerfil">
        <CrearPerfil alCrear={alCrearPerfil} />
        <p className="textoSuave paginaPerfil__nota">
          Tus datos se guardan solo en este dispositivo. Si borras la caché o los datos de
          navegación, se perderán.
        </p>
      </section>
    );
  }

  const tieneCoche = perfil.tieneCoche ?? true;

  return (
    <section className="paginaPerfil">
      <header className="paginaPerfil__cabecera">
        {perfil.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={perfil.foto} alt="" className="paginaPerfil__foto" />
        ) : null}
        <div>
          <h2 className="paginaPerfil__nombre">{perfil.nombre}</h2>
          <p className="textoSuave">{perfil.correo}</p>
        </div>
      </header>

      <label className="paginaPerfil__interruptor">
        <input
          type="checkbox"
          checked={tieneCoche}
          onChange={(e) => alCambiarTieneCoche(e.target.checked)}
        />
        <span>Tengo coche</span>
      </label>

      {tieneCoche ? (
        <>
          <div className="paginaPerfil__cochesCabecera">
            <h3 className="paginaPerfil__subtitulo">Mis coches ({perfil.coches.length})</h3>
            <button
              type="button"
              className="paginaPerfil__botonAnadir"
              onClick={abrirAlta}
              aria-label="Añadir coche"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>

          {perfil.coches.length === 0 ? (
            <p className="textoSuave">
              Todavía no tienes coches. Pulsa el botón de añadir para dar de alta el primero.
            </p>
          ) : (
            <div className="paginaPerfil__coches">
              {perfil.coches.map((coche) => (
                <article key={coche.id} className="paginaPerfil__tarjetaCoche">
                  <h4 className="paginaPerfil__cocheTitulo">
                    {coche.marca} {coche.modelo}
                  </h4>
                  <p className="textoSuave">{coche.matricula}</p>
                  <p>Consumo: {coche.consumo} L/100km</p>
                  <div className="paginaPerfil__accionesCoche">
                    <button
                      type="button"
                      className="paginaPerfil__botonSecundario"
                      onClick={() => abrirEdicion(coche)}
                      aria-label={`Editar ${coche.marca} ${coche.modelo}`}
                    >
                      <FontAwesomeIcon icon={faPen} /> Editar
                    </button>
                    <button
                      type="button"
                      className="paginaPerfil__botonEliminar"
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
          Has indicado que no tienes coche: en la calculadora podrás introducir el consumo a mano en
          cada viaje.
        </p>
      )}

      <div className="paginaPerfil__zonaServidor">
        <h3 className="paginaPerfil__subtitulo">Sincronización</h3>
        {SERVIDOR_ACTIVADO ? (
          <>
            <p className="aviso">
              Crea una contraseña para proteger tu historial si otra persona entra con tu mismo
              correo en otro dispositivo.
            </p>
            <div className="paginaPerfil__accionesCoche">
              <button
                type="button"
                className="formulario__botonSecundario"
                onClick={alPulsarServidor}
              >
                Crear contraseña
              </button>
              <button
                type="button"
                className="formulario__botonPrincipal"
                onClick={alPulsarServidor}
              >
                Subir perfil e historial
              </button>
            </div>
            {mensajeServidor ? <p className="textoSuave">{mensajeServidor}</p> : null}
          </>
        ) : (
          <p className="textoSuave">
            Servidor no activo: aquí aparecerá la sincronización cuando se despliegue el backend.
          </p>
        )}
      </div>

      <div className="paginaPerfil__zonaPeligro">
        <button type="button" className="paginaPerfil__botonEliminar" onClick={alBorrarPerfil}>
          Borrar mi perfil de este dispositivo
        </button>
        <p className="textoSuave paginaPerfil__nota">
          Si borras la caché o los datos de navegación, el perfil y el historial se perderán.
        </p>
      </div>

      <VentanaEmergente
        abierto={ventanaAbierta}
        alCerrar={() => {
          setVentanaAbierta(false);
          setCocheEnEdicion(null);
        }}
        titulo={cocheEnEdicion ? "Editar coche" : "Dar de alta un coche"}
      >
        <FormularioCoche
          key={cocheEnEdicion?.id ?? "nuevo"}
          valoresIniciales={
            cocheEnEdicion
              ? {
                  marca: cocheEnEdicion.marca,
                  modelo: cocheEnEdicion.modelo,
                  matricula: cocheEnEdicion.matricula,
                  consumo: cocheEnEdicion.consumo,
                }
              : undefined
          }
          textoBoton={cocheEnEdicion ? "Guardar cambios" : "Guardar coche"}
          alGuardar={alGuardarCoche}
          alCancelar={() => {
            setVentanaAbierta(false);
            setCocheEnEdicion(null);
          }}
        />
      </VentanaEmergente>
    </section>
  );
}
