"use client";

import { useEffect, useRef, useState } from "react";
import {
  buscarDirecciones,
  estanCaidosLosMapas,
  type PuntoRuta,
  type SugerenciaDireccion,
} from "@/mapas/openRouteService";

interface PropiedadesCampoDireccion {
  id: string;
  etiqueta: string;
  valor: string;
  placeholder?: string;
  alCambiar: (texto: string) => void;
  alElegir: (punto: PuntoRuta) => void;
  botonExtra?: React.ReactNode;
  resaltar?: boolean;
}

export function CampoDireccion({
  id,
  etiqueta,
  valor,
  placeholder,
  alCambiar,
  alElegir,
  botonExtra,
  resaltar = false,
}: PropiedadesCampoDireccion) {
  const [sugerencias, setSugerencias] = useState<SugerenciaDireccion[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [abierta, setAbierta] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const ultimoElegido = useRef("");

  useEffect(() => {
    if (estanCaidosLosMapas() || valor.trim().length < 3 || valor === ultimoElegido.current) {
      setSugerencias([]);
      return;
    }
    const controlador = new AbortController();
    const temporizador = setTimeout(async () => {
      setBuscando(true);
      setErrorBusqueda(null);
      try {
        const encontradas = await buscarDirecciones(valor.trim(), controlador.signal);
        setSugerencias(encontradas);
        setAbierta(true);
      } catch (error) {
        setSugerencias([]);
        if (!controlador.signal.aborted) {
          setErrorBusqueda(
            error instanceof Error ? error.message : "No se pudieron buscar sugerencias.",
          );
        }
      }
      if (!controlador.signal.aborted) setBuscando(false);
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
    setErrorBusqueda(null);
    alElegir({
      latitud: sugerencia.latitud,
      longitud: sugerencia.longitud,
      etiqueta: sugerencia.etiqueta,
    });
  };

  return (
    <div className="campoDireccion">
      <label className="formulario__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <div className="calculadora__conBoton">
        <input
          id={id}
          className={`formulario__entrada${resaltar ? " formulario__entrada--parpadeo" : ""}`}
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
      {buscando && (
        <p className="textoSuave" role="status" aria-live="polite">
          Buscando direcciones…
        </p>
      )}
      {errorBusqueda && <p className="textoSuave" role="status">{errorBusqueda}</p>}
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
