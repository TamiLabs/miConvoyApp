"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { adaptadorAlmacenamientoLocal } from "@/storage/almacenamiento";
import { guardarPerfil, obtenerPerfil } from "@/storage/datosLocales";
import type { CocheLocal, PerfilLocal } from "@/storage/tiposModoGratis";
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

  useEffect(() => {
    obtenerPerfil(adaptadorAlmacenamientoLocal)
      .then(setPerfil)
      .finally(() => setCargando(false));
  }, []);

  const alCrearPerfil = useCallback(async (datos: DatosPerfilNuevo) => {
    const nuevo: PerfilLocal = {
      correo: datos.correo,
      nombre: datos.nombre,
      foto: datos.foto,
      coches: [],
    };
    await guardarPerfil(adaptadorAlmacenamientoLocal, nuevo);
    setPerfil(nuevo);
  }, []);

  const alGuardarCoche = useCallback(
    async (datos: DatosFormularioCoche) => {
      if (!perfil) return;
      const coche: CocheLocal = crearCocheConId(datos);
      const actualizado: PerfilLocal = { ...perfil, coches: [...perfil.coches, coche] };
      await guardarPerfil(adaptadorAlmacenamientoLocal, actualizado);
      setPerfil(actualizado);
      setVentanaAbierta(false);
    },
    [perfil],
  );

  const alEliminarCoche = useCallback(
    async (idCoche: string) => {
      if (!perfil) return;
      const actualizado: PerfilLocal = {
        ...perfil,
        coches: perfil.coches.filter((coche) => coche.id !== idCoche),
      };
      await guardarPerfil(adaptadorAlmacenamientoLocal, actualizado);
      setPerfil(actualizado);
    },
    [perfil],
  );

  if (cargando) return <p className="paginaPerfil textoSuave">Cargando perfil…</p>;
  if (!perfil) {
    return (
      <section className="paginaPerfil">
        <CrearPerfil alCrear={alCrearPerfil} />
      </section>
    );
  }

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

      <div className="paginaPerfil__cochesCabecera">
        <h3 className="paginaPerfil__subtitulo">Mis coches ({perfil.coches.length})</h3>
        <button
          type="button"
          className="paginaPerfil__botonAnadir"
          onClick={() => setVentanaAbierta(true)}
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
              <button
                type="button"
                className="paginaPerfil__botonEliminar"
                onClick={() => alEliminarCoche(coche.id)}
              >
                Eliminar
              </button>
            </article>
          ))}
        </div>
      )}

      <VentanaEmergente
        abierto={ventanaAbierta}
        alCerrar={() => setVentanaAbierta(false)}
        titulo="Dar de alta un coche"
      >
        <FormularioCoche alGuardar={alGuardarCoche} alCancelar={() => setVentanaAbierta(false)} />
      </VentanaEmergente>
    </section>
  );
}
