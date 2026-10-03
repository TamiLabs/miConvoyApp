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
      <h3 className="paginaPerfil__subtitulo">Cuenta</h3>
      <div className="paginaPerfil__accionesCoche">
        <button
          type="button"
          className="formulario__botonSecundario"
          onClick={() => {
            setMensajeContrasena(null);
            setPopupContrasena(true);
          }}
        >
          <FontAwesomeIcon icon={faKey} />{" "}
          {hayContrasena ? "Cambiar contraseña" : "Crear contraseña"}
        </button>
        <button type="button" className="paginaPerfil__botonEliminar" onClick={alOlvidar}>
          <FontAwesomeIcon icon={faRightFromBracket} /> Cerrar sesión
        </button>
      </div>
      {mensajeContrasena ? <p className="textoSuave">{mensajeContrasena}</p> : null}
      <p className="textoSuave paginaPerfil__nota">
        La contraseña es provisional y solo vale en este dispositivo hasta que exista el registro
        con servidor. Al volver a iniciar sesión se te recordará el correo {ultimoCorreo || "usado"}
        .
      </p>
      <CrearContrasena
        abierto={popupContrasena}
        existePrevia={hayContrasena}
        alCerrar={() => setPopupContrasena(false)}
        alGuardar={alGuardarContrasena}
      />
    </section>
  );
}
