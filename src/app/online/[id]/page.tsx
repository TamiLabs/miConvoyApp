"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import { adaptadorAlmacenamientoLocal } from "@/storage/almacenamiento";
import { obtenerViajesCreados } from "@/storage/datosLocales";
import { formatearEuros } from "@/formato";
import { useViaje } from "@/hooks/useViaje";
import { TarjetaCocheOnline } from "@/components/online/tarjetaCocheOnline";

export default function PaginaVerViaje({ params }: { params: { id: string } }) {
  const { viaje, cargando, error, recargar } = useViaje(params.id);
  const [copiado, setCopiado] = useState(false);
  const [tokenEdicion, setTokenEdicion] = useState<string | null>(null);

  // Si este dispositivo creó el viaje, es su organizador (expulsar + enlaces).
  useEffect(() => {
    obtenerViajesCreados(adaptadorAlmacenamientoLocal).then((creados) => {
      setTokenEdicion(creados.find((v) => v.id === params.id)?.tokenEdicion ?? null);
    });
  }, [params.id]);

  const alCopiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Portapapeles no disponible.
    }
  };

  if (cargando) return <p className="paginaEnLinea textoSuave">Cargando viaje…</p>;
  if (error || !viaje) {
    return (
      <section className="paginaEnLinea">
        <p className="aviso">{error ?? "Viaje no encontrado."}</p>
        <button type="button" className="botonSecundario" onClick={() => void recargar()}>
          Reintentar
        </button>
      </section>
    );
  }

  const esConvoy = viaje.coches.length > 1;
  const organizador = tokenEdicion !== null;

  return (
    <section className="paginaEnLinea">
      <h2 className="tituloSeccion">
        {viaje.origen} → {viaje.destino}
      </h2>
      <p className="textoSuave">
        {viaje.fecha ? `${new Date(viaje.fecha).toLocaleDateString("es-ES")} · ` : ""}
        {viaje.idaYVuelta ? "Ida y vuelta" : "Solo ida"} · {viaje.distanciaKm} km
      </p>
      <button type="button" className="botonSecundario" onClick={alCopiarEnlace}>
        <FontAwesomeIcon icon={faLink} /> {copiado ? "¡Copiado!" : "Copiar enlace"}
      </button>
      <div className="listaTarjetas">
        {viaje.coches.map((coche) => (
          <TarjetaCocheOnline
            key={coche.id}
            viajeId={viaje.id}
            coche={coche}
            esConvoy={esConvoy}
            organizador={organizador}
            tokenEdicion={tokenEdicion ?? undefined}
            alCambiar={() => void recargar()}
          />
        ))}
      </div>
      {viaje.gastos.length > 0 && (
        <>
          <h3 className="tituloSeccion">Gastos compartidos</h3>
          {viaje.gastos.map((gasto, i) => (
            <p key={i} className="textoSuave">
              {gasto.nombre}: {formatearEuros(gasto.importe)}
            </p>
          ))}
        </>
      )}
    </section>
  );
}
