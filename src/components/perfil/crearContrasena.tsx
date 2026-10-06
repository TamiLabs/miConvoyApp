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

function CampoConOjo({
  etiqueta,
  valor,
  alCambiar,
}: {
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="formulario__campo">
      <span className="formulario__etiqueta">{etiqueta}</span>
      <div className="contrasena__conOjo">
        <input
          className="formulario__entrada"
          type={visible ? "text" : "password"}
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          autoComplete="new-password"
          required
        />
        <button
          type="button"
          className="contrasena__ojo"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
        >
          <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} />
        </button>
      </div>
    </label>
  );
}

export function CrearContrasena({
  abierto,
  existePrevia,
  alCerrar,
  alGuardar,
}: PropiedadesCrearContrasena) {
  const [clave, setClave] = useState("");
  const [repetir, setRepetir] = useState("");
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
        <CampoConOjo
          etiqueta="Contraseña (mín. 8 caracteres)"
          valor={clave}
          alCambiar={(valor) => {
            setClave(valor);
            setError(null);
          }}
        />
        <CampoConOjo
          etiqueta="Repetir contraseña"
          valor={repetir}
          alCambiar={(valor) => {
            setRepetir(valor);
            setError(null);
          }}
        />
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
        <p className="textoSuave textoNota">
          Se guarda solo en este dispositivo hasta que exista el registro con servidor.
        </p>
        <div className="formulario__acciones">
          <button type="button" className="botonSecundario" onClick={alCerrarVentana}>
            <FontAwesomeIcon icon={faXmark} /> Cancelar
          </button>
          <button type="submit" className="botonPrincipal" disabled={!valida || guardando}>
            <FontAwesomeIcon icon={faCheck} /> {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </VentanaEmergente>
  );
}
