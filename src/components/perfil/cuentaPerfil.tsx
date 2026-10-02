"use client";

import { SERVIDOR_ACTIVADO } from "@/configuracion";

interface PropiedadesCuentaPerfil {
  ultimoCorreo: string;
  mensajeServidor: string | null;
  alPulsarServidor: () => void;
  alOlvidar: () => void;
}

export function CuentaPerfil({
  ultimoCorreo,
  mensajeServidor,
  alPulsarServidor,
  alOlvidar,
}: PropiedadesCuentaPerfil) {
  return (
    <section aria-label="Cuenta" className="paginaPerfil__apartado">
      <h3 className="paginaPerfil__subtitulo">Cuenta</h3>
      {SERVIDOR_ACTIVADO ? (
        <>
          <p className="aviso">
            Crea una contraseña para proteger tu historial si otra persona entra con tu mismo correo
            en otro dispositivo.
          </p>
          <div className="paginaPerfil__accionesCoche">
            <button
              type="button"
              className="formulario__botonSecundario"
              onClick={alPulsarServidor}
            >
              Crear contraseña
            </button>
            <button type="button" className="formulario__botonPrincipal" onClick={alPulsarServidor}>
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
      <div>
        <button type="button" className="paginaPerfil__botonEliminar" onClick={alOlvidar}>
          Olvidar en este dispositivo
        </button>
        <p className="textoSuave paginaPerfil__nota">
          Borra tu perfil de este dispositivo (el historial se conserva). Al volver a iniciar sesión
          se te recordará el correo {ultimoCorreo || "usado"}.
        </p>
      </div>
      <div className="paginaPerfil__legal">
        <h4 className="paginaPerfil__subtitulo">Librerías</h4>
        <p className="textoSuave paginaPerfil__nota">
          Esta app usa las siguientes librerías y servicios, con sus licencias:
        </p>
        <ul className="paginaPerfil__legalLista">
          <li>
            <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> — datos del mapa
            (ODbL).
          </li>
          <li>
            <a href="https://leafletjs.com/">Leaflet</a> — mapa interactivo (BSD-2-Clause).
          </li>
          <li>
            <a href="https://openrouteservice.org/">OpenRouteService</a> — cálculo de rutas.
          </li>
          <li>
            <a href="https://fontawesome.com/license/free">Font Awesome Free</a> — iconos (CC BY
            4.0).
          </li>
        </ul>
      </div>
    </section>
  );
}
