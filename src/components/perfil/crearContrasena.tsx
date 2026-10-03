"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faEye, faEyeSlash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { VentanaEmergente } from "@/components/ventanaEmergente";

const ETIQUETAS_FUERZA = ["", "Muy débil", "Débil", "Media", "Fuerte", "Muy fuerte"];
const COLORES_FUERZA = ["", "#dc2626", "#ea580c", "#ca8a04", "#65a30d", "#15803d"];

// 0-5 puntos: +1 por 8 caracteres, +1 por 12, +1 mayús+minús, +1 dígito, +1 símbolo.
export function fuerzaContrasena(clave: string): { puntos: number; etiqueta: string } {
  if (!clave) return { puntos: 0, etiqueta: "" };
  let puntos = 0;
  if (clave.length >= 8) puntos++;
  if (clave.length >= 12) puntos++;
  if (/[a-z]/.test(clave) && /[A-Z]/.test(clave)) puntos++;
  if (/\d/.test(clave)) puntos++;
  if (/[^a-zA-Z0-9]/.test(clave)) puntos++;
  return { puntos, etiqueta: ETIQUETAS_FUERZA[Math.min(puntos, 5)] };
}

export async function hashContrasena(clave: string): Promise<string> {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`miconvoy:${clave}`),
  );
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface PropiedadesCrearContrasena {
  abierto: boolean;
  existePrevia: boolean;
  alCerrar: () => void;
  alGuardar: (hash: string) => void;
}

export function CrearContrasena({
  abierto,
  existePrevia,
  alCerrar,
  alGuardar,
}: PropiedadesCrearContrasena) {
  const [clave, setClave] = useState("");
  const [repetir, setRepetir] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [mostrarRepetir, setMostrarRepetir] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // La barra reacciona a lo escrito en "repetir contraseña".
  const fuerza = fuerzaContrasena(repetir);
  const coinciden = clave.length > 0 && clave === repetir;
  const valida = clave.length >= 8 && coinciden;

  const alEnviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (clave.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!coinciden) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      alGuardar(await hashContrasena(clave));
      setClave("");
      setRepetir("");
    } finally {
      setGuardando(false);
    }
  };

  const alCerrarVentana = () => {
    setClave("");
    setRepetir("");
    setError(null);
    alCerrar();
  };

  return (
    <VentanaEmergente
      abierto={abierto}
      alCerrar={alCerrarVentana}
      titulo={existePrevia ? "Cambiar contraseña" : "Crear contraseña"}
    >
      <form className="formulario" onSubmit={alEnviar}>
        <label className="formulario__campo">
          <span className="formulario__etiqueta">Contraseña (mín. 8 caracteres)</span>
          <div className="contrasena__conOjo">
            <input
              className="formulario__entrada"
              type={mostrarClave ? "text" : "password"}
              value={clave}
              onChange={(e) => {
                setClave(e.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="contrasena__ojo"
              onClick={() => setMostrarClave((v) => !v)}
              aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={mostrarClave}
            >
              <FontAwesomeIcon icon={mostrarClave ? faEyeSlash : faEye} />
            </button>
          </div>
        </label>
        <label className="formulario__campo">
          <span className="formulario__etiqueta">Repetir contraseña</span>
          <div className="contrasena__conOjo">
            <input
              className="formulario__entrada"
              type={mostrarRepetir ? "text" : "password"}
              value={repetir}
              onChange={(e) => {
                setRepetir(e.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="contrasena__ojo"
              onClick={() => setMostrarRepetir((v) => !v)}
              aria-label={mostrarRepetir ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={mostrarRepetir}
            >
              <FontAwesomeIcon icon={mostrarRepetir ? faEyeSlash : faEye} />
            </button>
          </div>
        </label>
        {fuerza.puntos > 0 && (
          <div>
            <div className="contrasena__fuerza" aria-label={`Fuerza: ${fuerza.etiqueta}`}>
              {[1, 2, 3, 4, 5].map((nivel) => (
                <span
                  key={nivel}
                  className="contrasena__segmento"
                  style={{
                    backgroundColor:
                      nivel <= fuerza.puntos ? COLORES_FUERZA[fuerza.puntos] : undefined,
                  }}
                />
              ))}
            </div>
            <p className="textoSuave">{fuerza.etiqueta}</p>
          </div>
        )}
        {repetir.length > 0 &&
          (coinciden ? (
            <p className="textoSuave">Las contraseñas coinciden.</p>
          ) : (
            <p className="formulario__error">Las contraseñas no coinciden.</p>
          ))}
        {error ? <p className="formulario__error">{error}</p> : null}
        <p className="textoSuave paginaPerfil__nota">
          Se guarda solo en este dispositivo hasta que exista el registro con servidor.
        </p>
        <div className="formulario__acciones">
          <button type="button" className="formulario__botonSecundario" onClick={alCerrarVentana}>
            <FontAwesomeIcon icon={faXmark} /> Cancelar
          </button>
          <button
            type="submit"
            className="formulario__botonPrincipal"
            disabled={!valida || guardando}
          >
            <FontAwesomeIcon icon={faCheck} /> {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </VentanaEmergente>
  );
}
