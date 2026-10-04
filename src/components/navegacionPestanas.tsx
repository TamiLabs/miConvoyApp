"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PESTANAS = [
  { ruta: "/calculadora", etiqueta: "Calculadora" },
  { ruta: "/online", etiqueta: "Online" },
  { ruta: "/perfil", etiqueta: "Perfil" },
];

export function NavegacionPestanas() {
  const rutaActual = usePathname();

  return (
    <nav className="navegacionPestanas">
      <div className="navegacionPestanas__contenido">
        {PESTANAS.map((pestana) => (
          <Link
            key={pestana.ruta}
            href={pestana.ruta}
            className={
              rutaActual === pestana.ruta
                ? "navegacionPestanas__enlace navegacionPestanas__enlace--activo"
                : "navegacionPestanas__enlace"
            }
          >
            {pestana.etiqueta}
          </Link>
        ))}
      </div>
    </nav>
  );
}
