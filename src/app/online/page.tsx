import { SERVIDOR_ACTIVADO } from "@/configuracion";

export default function PaginaEnLinea() {
  if (!SERVIDOR_ACTIVADO) {
    return <p className="paginaEnLinea aviso">Modo Online no disponible por ahora.</p>;
  }
  return <p className="paginaEnLinea">Modo Online — aquí irá la gestión de convoyes.</p>;
}
