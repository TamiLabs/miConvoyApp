"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faCheck,
  faClockRotateLeft,
  faCircleUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { adaptadorAlmacenamientoLocal } from "@/storage/almacenamiento";
import {
  eliminarPerfil,
  guardarHistorialActivo,
  guardarPerfil,
  guardarUltimoCorreo,
  guardarVersionPerfil,
  limpiarHistorial,
  migrarPerfilLocal,
  obtenerHistorial,
  obtenerHistorialActivo,
  obtenerPerfil,
  obtenerUltimoCorreo,
  obtenerVersionPerfil,
  VERSION_PERFIL,
} from "@/storage/datosLocales";
import type { CocheLocal, EntradaHistorial, PerfilLocal } from "@/storage/tiposModoGratis";
import { VentanaEmergente } from "@/components/ventanaEmergente";
import {
  FormularioCoche,
  crearCocheConId,
  type DatosFormularioCoche,
} from "@/components/formularioCoche";
import { CrearPerfil, type DatosPerfilNuevo } from "@/components/crearPerfil";
import { MisCoches } from "@/components/perfil/misCoches";
import { HistorialPerfil } from "@/components/perfil/historialPerfil";
import { CuentaPerfil } from "@/components/perfil/cuentaPerfil";
import { SincronizacionPerfil } from "@/components/perfil/sincronizacionPerfil";
import { LibreriasPerfil } from "@/components/perfil/libreriasPerfil";

type ApartadoPerfil = "coches" | "historial" | "cuenta";

const APARTADOS: { id: ApartadoPerfil; etiqueta: string; icono: typeof faCar }[] = [
  { id: "coches", etiqueta: "Coches", icono: faCar },
  { id: "historial", etiqueta: "Historial", icono: faClockRotateLeft },
  { id: "cuenta", etiqueta: "Cuenta", icono: faCircleUser },
];

export default function PaginaPerfil() {
  const [cargando, setCargando] = useState(true);
  const [perfil, setPerfil] = useState<PerfilLocal | null>(null);
  const [apartado, setApartado] = useState<ApartadoPerfil>("coches");
  const [ventanaAbierta, setVentanaAbierta] = useState(false);
  const [cocheEnEdicion, setCocheEnEdicion] = useState<CocheLocal | null>(null);
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const [historialActivo, setHistorialActivo] = useState(true);
  const [ultimoCorreo, setUltimoCorreo] = useState("");
  const [fotoRota, setFotoRota] = useState(false);

  useEffect(() => {
    (async () => {
      const [guardado, historialGuardado, activo, correo] = await Promise.all([
        obtenerPerfil(adaptadorAlmacenamientoLocal),
        obtenerHistorial(adaptadorAlmacenamientoLocal),
        obtenerHistorialActivo(adaptadorAlmacenamientoLocal),
        obtenerUltimoCorreo(adaptadorAlmacenamientoLocal),
      ]);
      if (guardado) {
        // Migra perfiles antiguos una sola vez (bandera de versión).
        const version = await obtenerVersionPerfil(adaptadorAlmacenamientoLocal);
        if (version < VERSION_PERFIL) {
          const migrado = migrarPerfilLocal(guardado);
          await guardarPerfil(adaptadorAlmacenamientoLocal, migrado);
          await guardarVersionPerfil(adaptadorAlmacenamientoLocal);
          setPerfil(migrado);
        } else {
          setPerfil(guardado);
        }
      } else {
        setPerfil(guardado);
      }
      setHistorial(historialGuardado);
      setHistorialActivo(activo);
      setUltimoCorreo(correo ?? "");
      setCargando(false);
    })();
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
      await guardarUltimoCorreo(adaptadorAlmacenamientoLocal, datos.correo);
      await guardarVersionPerfil(adaptadorAlmacenamientoLocal);
      setUltimoCorreo(datos.correo);
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

  const alOlvidarDispositivo = useCallback(async () => {
    await eliminarPerfil(adaptadorAlmacenamientoLocal);
    setPerfil(null);
  }, []);

  const alCambiarHistorialActivo = useCallback(async (valor: boolean) => {
    await guardarHistorialActivo(adaptadorAlmacenamientoLocal, valor);
    setHistorialActivo(valor);
  }, []);

  const alVaciarHistorial = useCallback(async () => {
    await limpiarHistorial(adaptadorAlmacenamientoLocal);
    setHistorial([]);
  }, []);

  const [confirmacion, setConfirmacion] = useState<{
    titulo: string;
    mensaje: string;
    textoConfirmar: string;
    alConfirmar: () => void;
  } | null>(null);

  const pedirConfirmacion = useCallback(
    (titulo: string, mensaje: string, textoConfirmar: string, alConfirmar: () => void) => {
      setConfirmacion({ titulo, mensaje, textoConfirmar, alConfirmar });
    },
    [],
  );

  if (cargando) return <p className="paginaPerfil textoSuave">Cargando perfil…</p>;
  if (!perfil) {
    return (
      <section className="paginaPerfil">
        <CrearPerfil alCrear={alCrearPerfil} correoInicial={ultimoCorreo} />
        <p className="textoSuave paginaPerfil__nota">
          Tus datos se guardan solo en este dispositivo. Si borras la caché o los datos de
          navegación, se perderán.
        </p>
      </section>
    );
  }

  return (
    <section className="paginaPerfil">
      <header className="paginaPerfil__cabecera">
        {perfil.foto && !fotoRota ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={perfil.foto}
            alt=""
            className="paginaPerfil__foto"
            referrerPolicy="no-referrer"
            onError={() => setFotoRota(true)}
          />
        ) : (
          <span className="paginaPerfil__fotoInicial" aria-hidden="true">
            {(perfil.nombre.trim()[0] ?? "?").toUpperCase()}
          </span>
        )}
        <div>
          <h2 className="paginaPerfil__nombre">{perfil.nombre}</h2>
          <p className="textoSuave">{perfil.correo}</p>
        </div>
      </header>

      <nav className="paginaPerfil__nav" aria-label="Apartados del perfil">
        {APARTADOS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              apartado === item.id
                ? "paginaPerfil__navBoton paginaPerfil__navBoton--activo"
                : "paginaPerfil__navBoton"
            }
            onClick={() => setApartado(item.id)}
            aria-current={apartado === item.id ? "page" : undefined}
          >
            <FontAwesomeIcon icon={item.icono} />
            <span>{item.etiqueta}</span>
          </button>
        ))}
      </nav>

      {apartado === "coches" && (
        <MisCoches
          perfil={perfil}
          alAbrirAlta={abrirAlta}
          alAbrirEdicion={abrirEdicion}
          alEliminarCoche={(idCoche) =>
            pedirConfirmacion(
              "Eliminar coche",
              "¿Eliminar este coche del perfil?",
              "Eliminar",
              () => alEliminarCoche(idCoche),
            )
          }
          alCambiarTieneCoche={alCambiarTieneCoche}
        />
      )}
      {apartado === "historial" && (
        <HistorialPerfil
          historial={historial}
          activo={historialActivo}
          alCambiarActivo={alCambiarHistorialActivo}
          alVaciar={() =>
            pedirConfirmacion(
              "Vaciar historial",
              "¿Vaciar todo el historial de este dispositivo?",
              "Vaciar",
              () => alVaciarHistorial(),
            )
          }
        />
      )}
      {apartado === "cuenta" && (
        <>
          <CuentaPerfil
            ultimoCorreo={ultimoCorreo}
            alOlvidar={() =>
              pedirConfirmacion(
                "Olvidar dispositivo",
                "¿Olvidar este dispositivo? Se borrará tu perfil, pero no el historial.",
                "Olvidar",
                () => alOlvidarDispositivo(),
              )
            }
          />
          <hr className="paginaPerfil__separador" />
          <SincronizacionPerfil
            perfil={perfil}
            historial={historial}
            historialActivo={historialActivo}
          />
          <hr className="paginaPerfil__separador" />
          <LibreriasPerfil />
        </>
      )}

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
                  precioPorLitro: cocheEnEdicion.precioPorLitro ?? 0,
                  tipoCombustible: cocheEnEdicion.tipoCombustible ?? "gasolina",
                  plazas: cocheEnEdicion.plazas ?? 5,
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

      <VentanaEmergente
        abierto={confirmacion !== null}
        alCerrar={() => setConfirmacion(null)}
        titulo={confirmacion?.titulo ?? "Confirmar"}
      >
        <p>{confirmacion?.mensaje}</p>
        <div className="formulario__acciones">
          <button
            type="button"
            className="formulario__botonSecundario"
            onClick={() => setConfirmacion(null)}
          >
            <FontAwesomeIcon icon={faXmark} /> Cancelar
          </button>
          <button
            type="button"
            className="formulario__botonPrincipal"
            onClick={() => {
              const accion = confirmacion?.alConfirmar;
              setConfirmacion(null);
              accion?.();
            }}
          >
            <FontAwesomeIcon icon={faCheck} /> {confirmacion?.textoConfirmar ?? "Confirmar"}
          </button>
        </div>
      </VentanaEmergente>
    </section>
  );
}
