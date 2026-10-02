"use client";

import { useEffect, useRef, useState } from "react";
import {
  buscarDirecciones,
  leerClaveORS,
  type PuntoRuta,
  type SugerenciaDireccion,
} from "@/mapas/openRouteService";

interface PropiedadesCampoDireccion {
  etiqueta: string;
  valor: string;
  placeholder?: string;
  alCambiar: (texto: string) => void;
  alElegir: (punto: PuntoRuta) => void;
  botonExtra?: React.ReactNode;
}

export function CampoDireccion({
  etiqueta,
  valor,
  placeholder,
  alCambiar,
  alElegir,
  botonExtra,
}: PropiedadesCampoDireccion) {
  const [sugerencias, setSugerencias] = useState<SugerenciaDireccion[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [abierta, setAbierta] = useState(false);
  const ultimoElegido = useRef("");
  const hayClave = leerClaveORS() !== "";

  useEffect(() => {
    if (!hayClave || !valor.trim() || valor === ultimoElegido.current) {
      setSugerencias([]);
      return;
    }
    const controlador = new AbortController();
    const temporizador = setTimeout(async () => {
      setBuscando(true);
      try {
        const encontradas = await buscarDirecciones(valor.trim(), controlador.signal);
        setSugerencias(encontradas);
        setAbierta(true);
      } catch {
        // Abortado o sin conexión: el campo manual sigue valiendo.
        setSugerencias([]);
      }
      setBuscando(false);
    }, 450);
    return () => {
      controlador.abort();
      clearTimeout(temporizador);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  const alElegirSugerencia = (sugerencia: SugerenciaDireccion) => {
    ultimoElegido.current = sugerencia.etiqueta;
    setSugerencias([]);
    setAbierta(false);
    alElegir({
      latitud: sugerencia.latitud,
      longitud: sugerencia.longitud,
      etiqueta: sugerencia.etiqueta,
    });
  };

  return (
    <div className="campoDireccion">
      <span className="formulario__etiqueta">{etiqueta}</span>
      <div className="calculadora__conBoton">
        <input
          className="formulario__entrada"
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          onFocus={() => {
            if (sugerencias.length > 0) setAbierta(true);
          }}
          onBlur={() => setTimeout(() => setAbierta(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {botonExtra}
      </div>
      {buscando && <p className="textoSuave">Buscando direcciones…</p>}
      {abierta && sugerencias.length > 0 && (
        <ul className="campoDireccion__lista">
          {sugerencias.map((sugerencia) => (
            <li key={sugerencia.id}>
              <button
                type="button"
                className="campoDireccion__opcion"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => alElegirSugerencia(sugerencia)}
              >
                {sugerencia.etiqueta}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
