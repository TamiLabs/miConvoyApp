"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { adaptadorAlmacenamientoLocal } from "@/storage/almacenamiento";
import { guardarHashContrasena, obtenerHashContrasena } from "@/storage/datosLocales";
import { CrearContrasena } from "@/components/perfil/crearContrasena";

interface PropiedadesCuentaPerfil {
  ultimoCorreo: string;
  alOlvidar: () => void;
}

export function CuentaPerfil({ ultimoCorreo, alOlvidar }: PropiedadesCuentaPerfil) {
  const [popupContrasena, setPopupContrasena] = useState(false);
  const [hayContrasena, setHayContrasena] = useState(false);
  const [mensajeContrasena, setMensajeContrasena] = useState<string | null>(null);

  useEffect(() => {
    obtenerHashContrasena(adaptadorAlmacenamientoLocal).then((hash) => setHayContrasena(!!hash));
  }, []);

  const alGuardarContrasena = async (hash: string) => {
    await guardarHashContrasena(adaptadorAlmacenamientoLocal, hash);
    setHayContrasena(true);
    setPopupContrasena(false);
    setMensajeContrasena("Contraseña guardada en este dispositivo.");
  };

  return (
    <section aria-label="Cuenta" className="paginaPerfil__apartado">
      <h3 className="tituloSeccion">Cuenta</h3>
      <div className="grupoAcciones">
        <button
          type="button"
          className="botonSecundario"
          onClick={() => {
            setMensajeContrasena(null);
            setPopupContrasena(true);
          }}
        >
          <FontAwesomeIcon icon={faKey} />{" "}
          {hayContrasena ? "Cambiar contraseña" : "Crear contraseña"}
        </button>
        <button type="button" className="botonSutil" onClick={alOlvidar}>
          <FontAwesomeIcon icon={faRightFromBracket} /> Cerrar sesión
        </button>
      </div>
      {mensajeContrasena ? <p className="textoSuave">{mensajeContrasena}</p> : null}

      <CrearContrasena
        abierto={popupContrasena}
        existePrevia={hayContrasena}
        alCerrar={() => setPopupContrasena(false)}
        alGuardar={alGuardarContrasena}
      />
    </section>
  );
}
