// Punto único que decide si el Modo Online se muestra como disponible.
// Más adelante se puede combinar con una comprobación de salud del backend
// en tiempo real; por ahora es solo esta variable de entorno.
export const SERVIDOR_ACTIVADO = process.env.NEXT_PUBLIC_SERVER_ENABLED === "true";
