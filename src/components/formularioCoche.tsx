"use client";

import { useState } from "react";
import type { CocheLocal } from "@/storage/tiposModoGratis";

export interface DatosFormularioCoche {
  marca: string;
  modelo: string;
  matricula: string;
  consumo: number;
}

interface PropiedadesFormularioCoche {
  alGuardar: (datos: DatosFormularioCoche) => void;
  alCancelar: () => void;
  valoresIniciales?: DatosFormularioCoche;
  textoBoton?: string;
}

// Acepta "6,5", "6.5", "1.234,56" o "1,234.56": el último separador es el
// decimal, los anteriores (y los espacios) son miles y se ignoran.
export function interpretarNumero(texto: string): number | null {
  const limpio = texto.trim().replace(/\s/g, "");
  if (!limpio) return null;
  const ultimoPunto = limpio.lastIndexOf(".");
  const ultimaComa = limpio.lastIndexOf(",");
  let normalizado: string;
  if (ultimoPunto !== -1 && ultimaComa !== -1) {
    const decimal = ultimoPunto > ultimaComa ? "." : ",";
    const miles = decimal === "." ? "," : ".";
    const sinMiles = limpio.split(miles).join("");
    normalizado = sinMiles.replace(decimal, ".");
  } else if (ultimaComa !== -1) {
    const partes = limpio.split(",");
    const decimales = partes.pop() ?? "";
    normalizado = `${partes.join("")}.${decimales}`;
  } else {
    const partes = limpio.split(".");
    if (partes.length > 2) {
      const decimales = partes.pop() ?? "";
      normalizado = `${partes.join("")}.${decimales}`;
    } else {
      normalizado = limpio;
    }
  }
  if (!/^\d*\.?\d+$/.test(normalizado)) return null;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

export function FormularioCoche({
  alGuardar,
  alCancelar,
  valoresIniciales,
  textoBoton = "Guardar coche",
}: PropiedadesFormularioCoche) {
  const [marca, setMarca] = useState(valoresIniciales?.marca ?? "");
  const [modelo, setModelo] = useState(valoresIniciales?.modelo ?? "");
  const [matricula, setMatricula] = useState(valoresIniciales?.matricula ?? "");
  const [consumoTexto, setConsumoTexto] = useState(
    valoresIniciales ? String(valoresIniciales.consumo).replace(".", ",") : "",
  );
  const [error, setError] = useState<string | null>(null);

  const alEnviar = (evento: React.FormEvent) => {
    evento.preventDefault();
    const consumo = interpretarNumero(consumoTexto);
    if (!marca.trim() || !modelo.trim() || !matricula.trim()) {
      setError("Rellena marca, modelo y matrícula.");
      return;
    }
    if (consumo === null || consumo <= 0) {
      setError("El consumo debe ser un número mayor que 0 (vale con , o .).");
      return;
    }
    setError(null);
    alGuardar({
      marca: marca.trim(),
      modelo: modelo.trim(),
      matricula: matricula.trim().toUpperCase(),
      consumo,
    });
  };

  return (
    <form className="formulario" onSubmit={alEnviar}>
      <label className="formulario__campo">
        <span className="formulario__etiqueta">Marca</span>
        <input
          className="formulario__entrada"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          placeholder="p. ej. Toyota"
          required
        />
      </label>
      <label className="formulario__campo">
        <span className="formulario__etiqueta">Modelo</span>
        <input
          className="formulario__entrada"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          placeholder="p. ej. Corolla"
          required
        />
      </label>
      <label className="formulario__campo">
        <span className="formulario__etiqueta">Matrícula</span>
        <input
          className="formulario__entrada"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
          placeholder="p. ej. 1234ABC"
          required
        />
      </label>
      <label className="formulario__campo">
        <span className="formulario__etiqueta">Consumo (L/100km)</span>
        <input
          className="formulario__entrada"
          value={consumoTexto}
          onChange={(e) => setConsumoTexto(e.target.value)}
          placeholder="p. ej. 6,5 o 6.5"
          inputMode="decimal"
          required
        />
      </label>
      {error ? <p className="formulario__error">{error}</p> : null}
      <div className="formulario__acciones">
        <button type="button" className="formulario__botonSecundario" onClick={alCancelar}>
          Cancelar
        </button>
        <button type="submit" className="formulario__botonPrincipal">
          {textoBoton}
        </button>
      </div>
    </form>
  );
}

export function crearCocheConId(datos: DatosFormularioCoche): CocheLocal {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return { id, ...datos };
}
