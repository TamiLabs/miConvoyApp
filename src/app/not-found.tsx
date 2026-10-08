import Link from "next/link";

export default function NotFound() {
  return (
    <section className="paginaNoEncontrada" aria-labelledby="titulo-no-encontrado">
      <div className="paginaNoEncontrada__escena" aria-hidden="true">
        <div className="paginaNoEncontrada__cielo">
          <span className="paginaNoEncontrada__nube paginaNoEncontrada__nube--una" />
          <span className="paginaNoEncontrada__nube paginaNoEncontrada__nube--dos" />
          <span className="paginaNoEncontrada__sol" />
        </div>
        <div className="paginaNoEncontrada__numero">404</div>
        <div className="paginaNoEncontrada__carretera">
          <span className="paginaNoEncontrada__linea" />
          <span className="paginaNoEncontrada__coche">
            <span className="paginaNoEncontrada__cocheTecho" />
            <span className="paginaNoEncontrada__rueda paginaNoEncontrada__rueda--una" />
            <span className="paginaNoEncontrada__rueda paginaNoEncontrada__rueda--dos" />
          </span>
        </div>
      </div>

      <div className="paginaNoEncontrada__contenido">
        <p className="paginaNoEncontrada__etiqueta">Te has salido de la ruta</p>
        <h1 id="titulo-no-encontrado">Esta página no está en el mapa</h1>
        <p className="paginaNoEncontrada__descripcion">
          Puede que el enlace haya cambiado o que esta ruta ya no exista. Volvamos a poner el viaje en marcha.
        </p>
        <div className="paginaNoEncontrada__acciones">
          <Link className="botonPrincipal" href="/calculadora">
            Volver a la calculadora
          </Link>
          <Link className="paginaNoEncontrada__enlace" href="/perfil">
            Ir a mi perfil
          </Link>
        </div>
      </div>
    </section>
  );
}
