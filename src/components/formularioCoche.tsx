"use client";

import { useState } from "react";
import {
  ETIQUETAS_COMBUSTIBLE,
  type CocheLocal,
  type TipoCombustible,
} from "@/storage/tiposModoGratis";

export interface DatosFormularioCoche {
  marca: string;
  modelo: string;
  matricula: string;
  consumo: number;
  precioPorLitro: number;
  tipoCombustible: TipoCombustible;
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
  const [precioTexto, setPrecioTexto] = useState(
    valoresIniciales && valoresIniciales.precioPorLitro > 0
      ? String(valoresIniciales.precioPorLitro).replace(".", ",")
      : "",
  );
  const [tipoCombustible, setTipoCombustible] = useState<TipoCombustible>(
    valoresIniciales?.tipoCombustible ?? "gasolina",
  );
  const [error, setError] = useState<string | null>(null);

  const alEnviar = (evento: React.FormEvent) => {
    evento.preventDefault();
    const consumo = interpretarNumero(consumoTexto);
    const precioPorLitro = interpretarNumero(precioTexto);
    if (!marca.trim() || !modelo.trim() || !matricula.trim()) {
      setError("Rellena marca, modelo y matrícula.");
      return;
    }
    if (consumo === null || consumo <= 0) {
      setError("El consumo debe ser un número mayor que 0 (vale con , o .).");
      return;
    }
    if (precioPorLitro === null || precioPorLitro <= 0) {
      setError("El precio del combustible debe ser mayor que 0 (vale con , o .).");
      return;
    }
    setError(null);
    alGuardar({
      marca: marca.trim(),
      modelo: modelo.trim(),
      matricula: matricula.trim().toUpperCase(),
      consumo,
      precioPorLitro,
      tipoCombustible,
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
      <label className="formulario__campo">
        <span className="formulario__etiqueta">Precio combustible (€/L)</span>
        <input
          className="formulario__entrada"
          value={precioTexto}
          onChange={(e) => setPrecioTexto(e.target.value)}
          placeholder="p. ej. 1,65 o 1.60"
          inputMode="decimal"
          required
        />
      </label>
      <label className="formulario__campo">
        <span className="formulario__etiqueta">Tipo de combustible</span>
        <select
          className="formulario__entrada"
          value={tipoCombustible}
          onChange={(e) => setTipoCombustible(e.target.value as TipoCombustible)}
        >
          {(Object.keys(ETIQUETAS_COMBUSTIBLE) as TipoCombustible[]).map((tipo) => (
            <option key={tipo} value={tipo}>
              {ETIQUETAS_COMBUSTIBLE[tipo]}
            </option>
          ))}
        </select>
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
