"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faClockRotateLeft, faCircleUser } from "@fortawesome/free-solid-svg-icons";
import { adaptadorAlmacenamientoLocal } from "@/storage/almacenamiento";
import {
  eliminarPerfil,
  guardarHistorialActivo,
  guardarPerfil,
  guardarUltimoCorreo,
  limpiarHistorial,
  obtenerHistorial,
  obtenerHistorialActivo,
  obtenerPerfil,
  obtenerUltimoCorreo,
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
  const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);
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
      if (guardado && guardado.tieneCoche === undefined) {
        setPerfil({ ...guardado, tieneCoche: true });
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

  const alOlvidarDispositivo = useCallback(async () => {
    if (!window.confirm("¿Olvidar este dispositivo? Se borrará tu perfil, pero no el historial."))
      return;
    await eliminarPerfil(adaptadorAlmacenamientoLocal);
    setPerfil(null);
  }, []);

  const alCambiarHistorialActivo = useCallback(async (valor: boolean) => {
    await guardarHistorialActivo(adaptadorAlmacenamientoLocal, valor);
    setHistorialActivo(valor);
  }, []);

  const alVaciarHistorial = useCallback(async () => {
    if (!window.confirm("¿Vaciar todo el historial de este dispositivo?")) return;
    await limpiarHistorial(adaptadorAlmacenamientoLocal);
    setHistorial([]);
  }, []);

  const alPulsarServidor = useCallback(() => {
    setMensajeServidor("Disponible cuando se conecte el backend (ver issues 1.7 y 1.8).");
  }, []);

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
          alEliminarCoche={alEliminarCoche}
          alCambiarTieneCoche={alCambiarTieneCoche}
        />
      )}
      {apartado === "historial" && (
        <HistorialPerfil
          historial={historial}
          activo={historialActivo}
          alCambiarActivo={alCambiarHistorialActivo}
          alVaciar={alVaciarHistorial}
        />
      )}
      {apartado === "cuenta" && (
        <CuentaPerfil
          ultimoCorreo={ultimoCorreo}
          mensajeServidor={mensajeServidor}
          alPulsarServidor={alPulsarServidor}
          alOlvidar={alOlvidarDispositivo}
        />
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
