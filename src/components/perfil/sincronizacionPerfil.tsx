"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCircleNotch, faCloudArrowUp, faXmark } from "@fortawesome/free-solid-svg-icons";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { adaptadorAlmacenamientoLocal } from "@/storage/almacenamiento";
import {
  guardarIdsHistorialSubidos,
  obtenerIdsHistorialSubidos,
} from "@/storage/datosLocales";
import type { EntradaHistorial, PerfilLocal } from "@/storage/tiposModoGratis";
import { useEstadoServidor } from "@/hooks/useEstadoServidor";
import { VentanaEmergente } from "@/components/ventanaEmergente";
import {
  comprobarDiferencias,
  hayCambiosSync,
  avisarDatosCambiados,
  type DiferenciasSync,
} from "@/estadoSincronizacion";

interface PropiedadesSincronizacion {
  perfil: PerfilLocal;
  historial: EntradaHistorial[];
  historialActivo: boolean;
}

type VistaSubida =
  | { tipo: "confirmar"; mensaje: string }
  | { tipo: "reintentar"; mensaje: string }
  | { tipo: "resultado"; ok: boolean; mensaje: string };

export function SincronizacionPerfil({
  perfil,
  historial,
  historialActivo,
}: PropiedadesSincronizacion) {
  const { cargando, disponible, motivo, servidorOn, recomprobar } = useEstadoServidor();
  const [comprobando, setComprobando] = useState(false);
  const [diferencias, setDiferencias] = useState<DiferenciasSync | null>(null);
  const [vistaSubida, setVistaSubida] = useState<VistaSubida | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorGoogle, setErrorGoogle] = useState<string | null>(null);
  const idClienteGoogle = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  const comprobar = useCallback(async () => {
    setComprobando(true);
    setDiferencias(await comprobarDiferencias(perfil, historial, historialActivo));
    setComprobando(false);
  }, [perfil, historial, historialActivo]);

  useEffect(() => {
    if (disponible) void comprobar();
    else setDiferencias(null);
  }, [disponible, comprobar]);

  const hayCambios = hayCambiosSync(diferencias);

  const autenticarGoogle = async (credencial: string) => {
    setErrorGoogle(null);
    try {
      const respuesta = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credencial }),
      });
      const datos = await respuesta.json();
      const correo = datos.identidad?.correo as string | undefined;
      if (!respuesta.ok || !datos.ok || !correo) {
        throw new Error(datos.error ?? "No se pudo verificar la cuenta de Google.");
      }
      if (correo.toLowerCase() !== perfil.correo.trim().toLowerCase()) {
        await fetch("/api/auth/google", { method: "DELETE" });
        throw new Error("Elige la misma cuenta de Google que usas en este perfil.");
      }
      await comprobar();
    } catch (e) {
      setErrorGoogle(e instanceof Error ? e.message : "No se pudo iniciar sesión con Google.");
    }
  };

  const subir = async (entradas: EntradaHistorial[], soloPerfil: boolean) => {
    setSubiendo(true);
    try {
      // Confirmación extra: el servidor puede estar caído aunque el modo
      // online esté activado. Se avisa antes de intentarlo en serio.
      const salud = await fetch("/api/salud", { cache: "no-store" }).then((r) => r.json());
      if (!salud.disponible) {
        setVistaSubida({
          tipo: "reintentar",
          mensaje: "Sin conexión al servidor. Comprueba tu conexión e inténtalo de nuevo.",
        });
        setSubiendo(false);
        return;
      }
      const respuesta = await fetch("/api/sincronizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil, historial: entradas }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.ok) {
        if (respuesta.status === 401) setDiferencias(null);
        throw new Error(datos.error ?? "Error al subir.");
      }
      const subidos = await obtenerIdsHistorialSubidos(adaptadorAlmacenamientoLocal);
      await guardarIdsHistorialSubidos(adaptadorAlmacenamientoLocal, [
        ...subidos,
        ...entradas.map((e) => e.id),
      ]);
      const partes = ["Perfil subido correctamente"];
      if (entradas.length > 0) {
        partes.push(
          `${datos.viajesSubidos} viaje${datos.viajesSubidos === 1 ? "" : "s"} subido${datos.viajesSubidos === 1 ? "" : "s"}`,
        );
        if (datos.viajesOmitidos > 0) partes.push(`${datos.viajesOmitidos} ya estaban`);
      } else {
        partes.push("sin viajes (historial vacío o desactivado)");
      }
      if (datos.cochesBorrados > 0) {
        partes.push(
          `${datos.cochesBorrados} coche${datos.cochesBorrados === 1 ? "" : "s"} eliminado${datos.cochesBorrados === 1 ? "" : "s"} del servidor`,
        );
      }
      setVistaSubida({ tipo: "resultado", ok: true, mensaje: `${partes.join(". ")}.` });
      await comprobar();
      // Que los avisos globales relean: si no, la notificación se queda puesta.
      avisarDatosCambiados();
    } catch (e) {
      setVistaSubida({
        tipo: "resultado",
        ok: false,
        mensaje: e instanceof Error ? e.message : "No se pudo subir. Inténtalo de nuevo.",
      });
    }
    setSubiendo(false);
  };

  const alPulsarSubir = async () => {
    if (!historialActivo || !diferencias || diferencias.viajesPendientes === 0) {
      const motivoTexto = !historialActivo
        ? "Tienes el historial desactivado. ¿Quieres subir únicamente el perfil, sin viajes?"
        : "Tu historial está vacío o ya está subido. Se subirá únicamente el perfil.";
      setVistaSubida({ tipo: "confirmar", mensaje: motivoTexto });
      return;
    }
    const subidos = await obtenerIdsHistorialSubidos(adaptadorAlmacenamientoLocal);
    await subir(
      historial.filter((e) => !subidos.includes(e.id)),
      false,
    );
  };

  const alConfirmarSoloPerfil = async () => {
    setVistaSubida(null);
    await subir([], true);
  };

  return (
    <section aria-label="Sincronización" className="paginaPerfil__apartado">
      <h3 className="tituloSeccion">Sincronización</h3>
      {cargando || comprobando ? (
        <p className="textoSuave">
          {" "}
          <FontAwesomeIcon icon={faCircleNotch} spin /> Comprobando diferencias con el servidor…
        </p>
      ) : !disponible ? (
        <>
          <p className="textoSuave">{motivo ? ` ${motivo}` : ""}</p>
          {servidorOn && (
            <>
              <p className="aviso">
                Problemas para conectar con el servidor. Comprueba tu conexión y reintenta.
              </p>
              <div className="grupoAcciones">
                <button
                  type="button"
                  className="botonSecundario"
                  onClick={() => {
                    recomprobar();
                    void comprobar();
                  }}
                >
                  Reintentar comprobación
                </button>
              </div>
            </>
          )}
        </>
      ) : !diferencias ? (
        <>
          <p className="textoSuave">
            Confirma tu cuenta de Google para comparar y sincronizar los datos de este perfil.
          </p>
          {errorGoogle && <p className="formulario__error">{errorGoogle}</p>}
          {idClienteGoogle ? (
            <GoogleOAuthProvider clientId={idClienteGoogle}>
              <GoogleLogin
                text="signin_with"
                onSuccess={(respuesta) => {
                  if (respuesta.credential) void autenticarGoogle(respuesta.credential);
                  else setErrorGoogle("Google no devolvió una credencial válida.");
                }}
                onError={() => setErrorGoogle("No se pudo iniciar sesión con Google.")}
              />
            </GoogleOAuthProvider>
          ) : (
            <p className="formulario__error">
              Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID para habilitar la sincronización.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="grupoAcciones">
            <button
              type="button"
              className={hayCambios ? "botonPrincipal" : "botonSecundario"}
              onClick={alPulsarSubir}
              disabled={!hayCambios || subiendo}
              title={hayCambios ? undefined : "Sin diferencias con el servidor"}
            >
              {subiendo ? (
                <>
                  <FontAwesomeIcon icon={faCircleNotch} spin /> Subiendo…
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCloudArrowUp} /> Sincronizar perfil
                </>
              )}
            </button>
          </div>
          {!hayCambios && <p className="textoSuave">Todo sincronizado.</p>}
        </>
      )}

      <VentanaEmergente
        abierto={vistaSubida?.tipo === "confirmar"}
        alCerrar={() => setVistaSubida(null)}
        titulo="Subir datos"
      >
        <p>{vistaSubida?.tipo === "confirmar" ? vistaSubida.mensaje : ""}</p>
        <div className="formulario__acciones">
          <button type="button" className="botonSecundario" onClick={() => setVistaSubida(null)}>
            <FontAwesomeIcon icon={faXmark} /> Cancelar
          </button>
          <button
            type="button"
            className="botonPrincipal"
            onClick={alConfirmarSoloPerfil}
            disabled={subiendo}
          >
            {subiendo ? (
              <>
                <FontAwesomeIcon icon={faCircleNotch} spin /> Subiendo…
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCloudArrowUp} /> Subir solo el perfil
              </>
            )}
          </button>
        </div>
      </VentanaEmergente>

      <VentanaEmergente
        abierto={vistaSubida?.tipo === "reintentar"}
        alCerrar={() => setVistaSubida(null)}
        titulo="Servidor no disponible"
      >
        <p>{vistaSubida?.tipo === "reintentar" ? vistaSubida.mensaje : ""}</p>
        <div className="formulario__acciones">
          <button type="button" className="botonSecundario" onClick={() => setVistaSubida(null)}>
            <FontAwesomeIcon icon={faXmark} /> Cancelar
          </button>
          <button
            type="button"
            className="botonPrincipal"
            onClick={() => {
              setVistaSubida(null);
              recomprobar();
              void comprobar();
            }}
          >
            <FontAwesomeIcon icon={faCloudArrowUp} /> Reintentar
          </button>
        </div>
      </VentanaEmergente>

      <VentanaEmergente
        abierto={vistaSubida?.tipo === "resultado"}
        alCerrar={() => setVistaSubida(null)}
        titulo={vistaSubida?.tipo === "resultado" && vistaSubida.ok ? "Subida correcta" : "Error"}
      >
        <p
          className={
            vistaSubida?.tipo === "resultado" && !vistaSubida.ok ? "formulario__error" : undefined
          }
        >
          {vistaSubida?.tipo === "resultado" ? vistaSubida.mensaje : ""}
        </p>
        <div className="formulario__acciones">
          <button type="button" className="botonPrincipal" onClick={() => setVistaSubida(null)}>
            <FontAwesomeIcon icon={faCheck} /> Cerrar
          </button>
        </div>
      </VentanaEmergente>
    </section>
  );
}
