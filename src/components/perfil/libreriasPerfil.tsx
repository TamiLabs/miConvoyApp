"use client";

export function LibreriasPerfil() {
  return (
    <section aria-label="Librerías" className="paginaPerfil__apartado">
      <h3 className="paginaPerfil__subtitulo">Librerías</h3>
      <p className="textoSuave paginaPerfil__nota">
        Esta app usa las siguientes librerías y servicios, con sus licencias:
      </p>
      <ul className="paginaPerfil__legalLista">
        <li>
          <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> — datos del mapa
          (ODbL).
        </li>
        <li>
          <a href="https://leafletjs.com/">Leaflet</a> — mapa interactivo (BSD-2-Clause).
        </li>
        <li>
          <a href="https://openrouteservice.org/">OpenRouteService</a> — cálculo de rutas.
        </li>
        <li>
          <a href="https://fontawesome.com/license/free">Font Awesome Free</a> — iconos (CC BY 4.0).
        </li>
      </ul>
    </section>
  );
}
