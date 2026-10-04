"use client";

import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import "leaflet/dist/leaflet.css";
import type { PuntoRuta } from "@/mapas/openRouteService";

interface PropiedadesMapaViaje {
  origen: PuntoRuta | null;
  destino: PuntoRuta | null;
  linea: [number, number][];
}

function AjustarVista({ puntos }: { puntos: PuntoRuta[] }) {
  const mapa = useMap();
  const clave = puntos.map((p) => `${p.latitud},${p.longitud}`).join("|");
  useEffect(() => {
    if (puntos.length === 0) return;
    if (puntos.length === 1) {
      mapa.setView([puntos[0].latitud, puntos[0].longitud], 13);
    } else {
      mapa.fitBounds(
        puntos.map((p) => [p.latitud, p.longitud] as [number, number]),
        { padding: [30, 30] },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa, clave]);
  return null;
}

// Zoom propio con clases nuestras (en vez del .leaflet-control-zoom nativo)
// para poder darle nuestros estilos.
function BotonesZoom() {
  const mapa = useMap();
  useEffect(() => {
    // Por si Fast Refresh conserva una instancia con el control nativo.
    mapa.zoomControl?.remove();
  }, [mapa]);
  return (
    <div className="mapaViaje__zoom">
      <button
        type="button"
        className="mapaViaje__zoomBoton mapaViaje__zoomBoton--mas"
        onClick={() => mapa.zoomIn()}
        aria-label="Acercar mapa"
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
      <button
        type="button"
        className="mapaViaje__zoomBoton mapaViaje__zoomBoton--menos"
        onClick={() => mapa.zoomOut()}
        aria-label="Alejar mapa"
      >
        <FontAwesomeIcon icon={faMinus} />
      </button>
    </div>
  );
}

export function MapaViaje({ origen, destino, linea }: PropiedadesMapaViaje) {
  const puntos = useMemo(
    () => [origen, destino].filter((p): p is PuntoRuta => p !== null),
    [origen, destino],
  );

  return (
    <MapContainer
      center={[40.4168, -3.7038]}
      zoom={6}
      className="mapaViaje"
      scrollWheelZoom={false}
      attributionControl={false}
      zoomControl={false}
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {/* Colores a juego con _constantes.scss (Leaflet no lee SCSS): primario #ff6b4a, secundario #1e3a5f. */}
      {origen && (
        <CircleMarker
          center={[origen.latitud, origen.longitud]}
          radius={9}
          pathOptions={{ color: "#ff6b4a", fillColor: "#ff6b4a", fillOpacity: 1 }}
        />
      )}
      {destino && (
        <CircleMarker
          center={[destino.latitud, destino.longitud]}
          radius={9}
          pathOptions={{ color: "#1e3a5f", fillColor: "#1e3a5f", fillOpacity: 1 }}
        />
      )}
      {linea.length > 1 && (
        <Polyline positions={linea} pathOptions={{ color: "#ff6b4a", weight: 4 }} />
      )}
      <AjustarVista puntos={puntos} />
      <BotonesZoom />
    </MapContainer>
  );
}
