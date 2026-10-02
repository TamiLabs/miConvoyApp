"use client";

import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
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
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {origen && (
        <CircleMarker
          center={[origen.latitud, origen.longitud]}
          radius={9}
          pathOptions={{ color: "#0f766e", fillColor: "#0f766e", fillOpacity: 1 }}
        />
      )}
      {destino && (
        <CircleMarker
          center={[destino.latitud, destino.longitud]}
          radius={9}
          pathOptions={{ color: "#b91c1c", fillColor: "#b91c1c", fillOpacity: 1 }}
        />
      )}
      {linea.length > 1 && (
        <Polyline positions={linea} pathOptions={{ color: "#0f766e", weight: 4 }} />
      )}
      <AjustarVista puntos={puntos} />
    </MapContainer>
  );
}
