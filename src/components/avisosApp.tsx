"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp, faPlugCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { adaptadorAlmacenamientoLocal } from "@/storage/almacenamiento";
import { obtenerHistorial, obtenerHistorialActivo, obtenerPerfil } from "@/storage/datosLocales";
import { useEstadoServidor } from "@/hooks/useEstadoServidor";
import { Notificacion } from "@/components/notificacion";
import {
  comprobarDiferencias,
  hayCambiosSync,
  EVENTO_DATOS_CAMBIADOS,
  type DiferenciasSync,
} from "@/estadoSincronizacion";

const CLAVE_SESION_SIN_SERVIDOR = "miconvoy_aviso_sin_servidor";
const CLAVE_SESION_SYNC = "miconvoy_aviso_sincronizar";

function yaVisto(clave: string): boolean {
  try {
    return sessionStorage.getItem(clave) !== null;
  } catch {
    return false;
  }
}

function marcarVisto(clave: string): void {
  try {
    sessionStorage.setItem(clave, "1");
  } catch {
    // Sin almacenamiento de sesión: se mostrará de nuevo al recargar.
  }
}

function olvidarVisto(clave: string): void {
  try {
    sessionStorage.removeItem(clave);
  } catch {
    // Nada que hacer.
  }
}

// Avisos globales (una vez por sesión): sin servidor y cambios para sincronizar.
// Si algo cambia (se cae el servidor o hay cambios nuevos), vuelven a salir.
export function AvisosApp() {
  const router = useRouter();
  const { cargando, disponible } = useEstadoServidor();
  const [avisoServidor, setAvisoServidor] = useState(false);
  const [avisoSync, setAvisoSync] = useState(false);
  const [diferencias, setDiferencias] = useState<DiferenciasSync | null>(null);
  const previoDisponible = useRef<boolean | null>(null);
  const previoCambios = useRef<boolean | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const comprobarSync = useCallback(async () => {
    const [perfil, historial, activo] = await Promise.all([
      obtenerPerfil(adaptadorAlmacenamientoLocal),
      obtenerHistorial(adaptadorAlmacenamientoLocal),
      obtenerHistorialActivo(adaptadorAlmacenamientoLocal),
    ]);
    if (!perfil) {
      setDiferencias(null);
      return;
    }
    setDiferencias(await comprobarDiferencias(perfil, historial, activo));
  }, []);

  useEffect(() => {
    if (disponible) void comprobarSync();
    else setDiferencias(null);
  }, [disponible, comprobarSync]);

  useEffect(() => {
    const alCambiar = () => {
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => void comprobarSync(), 800);
    };
    window.addEventListener(EVENTO_DATOS_CAMBIADOS, alCambiar);
    return () => {
      window.removeEventListener(EVENTO_DATOS_CAMBIADOS, alCambiar);
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [comprobarSync]);

  // Sin servidor: sale una vez; si se cae tras estar bien, sale de nuevo.
  useEffect(() => {
    if (cargando) return;
    const antes = previoDisponible.current;
    previoDisponible.current = disponible;
    if (disponible === false) {
      if (antes === true) olvidarVisto(CLAVE_SESION_SIN_SERVIDOR);
      if (!yaVisto(CLAVE_SESION_SIN_SERVIDOR)) setAvisoServidor(true);
    } else {
      setAvisoServidor(false);
    }
  }, [cargando, disponible]);

  // Cambios para sincronizar: sale una vez; con cambios nuevos, de nuevo.
  const hayCambios = hayCambiosSync(diferencias);
  useEffect(() => {
    const antes = previoCambios.current;
    previoCambios.current = hayCambios;
    if (hayCambios && antes !== true) olvidarVisto(CLAVE_SESION_SYNC);
    if (hayCambios && !yaVisto(CLAVE_SESION_SYNC)) setAvisoSync(true);
    if (!hayCambios) setAvisoSync(false);
  }, [hayCambios]);

  const cerrarServidor = () => {
    marcarVisto(CLAVE_SESION_SIN_SERVIDOR);
    setAvisoServidor(false);
  };

  const cerrarSync = () => {
    marcarVisto(CLAVE_SESION_SYNC);
    setAvisoSync(false);
  };

  const irASincronizar = () => {
    marcarVisto(CLAVE_SESION_SYNC);
    setAvisoSync(false);
    router.push("/perfil#cuenta");
  };

  if (!avisoServidor && !avisoSync) return null;

  return (
    <div className="avisosApp" aria-live="polite">
      {avisoServidor && (
        <Notificacion
          icono={<FontAwesomeIcon icon={faPlugCircleXmark} />}
          titulo="Sin conexión al servidor"
          mensaje="Modo online desactivado. Todo sigue funcionando sin esas funciones."
          alCerrar={cerrarServidor}
        />
      )}
      {avisoSync && (
        <Notificacion
          icono={<FontAwesomeIcon icon={faCloudArrowUp} />}
          titulo="Puedes sincronizar"
          mensaje="Hay cambios en tu perfil para subir al servidor."
          alCerrar={cerrarSync}
          alPulsar={irASincronizar}
        />
      )}
    </div>
  );
}
