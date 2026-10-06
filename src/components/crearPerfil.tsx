"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

export interface DatosPerfilNuevo {
  correo: string;
  nombre: string;
  foto?: string;
}

interface PropiedadesCrearPerfil {
  alCrear: (datos: DatosPerfilNuevo) => void;
  correoInicial?: string;
}

function decodificarJwt(credencial: string): { email?: string; name?: string; picture?: string } {
  const parte = credencial.split(".")[1] ?? "";
  let base64 = parte.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binario = atob(base64);
  const bytes = Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0));
  return JSON.parse(new TextDecoder("utf-8").decode(bytes));
}

function BotonesGoogle({
  alCrear,
  alFallar,
}: {
  alCrear: (datos: DatosPerfilNuevo) => void;
  alFallar: (mensaje: string) => void;
}) {
  return (
    <div className="paginaPerfil__google">
      <GoogleLogin
        text="signin_with"
        onSuccess={(respuesta) => {
          try {
            if (!respuesta.credential) throw new Error("sin credencial");
            const datos = decodificarJwt(respuesta.credential);
            if (!datos.email) throw new Error("sin correo");
            alCrear({
              correo: datos.email,
              nombre: datos.name ?? datos.email,
              foto: datos.picture,
            });
          } catch {
            alFallar("No se pudo leer la cuenta de Google. Usa el formulario manual.");
          }
        }}
        onError={() => alFallar("No se pudo iniciar sesión con Google.")}
      />
      <p className="paginaPerfil__divisor">o</p>
    </div>
  );
}

export function CrearPerfil({ alCrear, correoInicial = "" }: PropiedadesCrearPerfil) {
  const idClienteGoogle = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const [correo, setCorreo] = useState(correoInicial);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);

  const alEnviarManual = (evento: React.FormEvent) => {
    evento.preventDefault();
    const correoLimpio = correo.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      setError("Escribe un correo válido.");
      return;
    }
    if (!nombre.trim()) {
      setError("Escribe tu nombre.");
      return;
    }
    setError(null);
    alCrear({ correo: correoLimpio, nombre: nombre.trim() });
  };

  return (
    <div className="paginaPerfil__crear">
      <h2 className="tituloSeccion">Inicia sesión</h2>
      <p className="textoSuave">Sin perfil no se puede guardar ningún coche.</p>
      {idClienteGoogle ? (
        <GoogleOAuthProvider clientId={idClienteGoogle}>
          <BotonesGoogle alCrear={alCrear} alFallar={setError} />
        </GoogleOAuthProvider>
      ) : (
        <p className="textoSuave">O continúa con tu correo y nombre.</p>
      )}
      <form className="formulario" onSubmit={alEnviarManual}>
        <label className="formulario__campo">
          <span className="formulario__etiqueta">Gmail</span>
          <input
            className="formulario__entrada"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="tucorreo@gmail.com"
            required
          />
        </label>
        <label className="formulario__campo">
          <span className="formulario__etiqueta">Nombre</span>
          <input
            className="formulario__entrada"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            required
          />
        </label>
        {error ? <p className="formulario__error">{error}</p> : null}
        <button type="submit" className="botonPrincipal">
          <FontAwesomeIcon icon={faUserPlus} /> Crear perfil
        </button>
      </form>
    </div>
  );
}
