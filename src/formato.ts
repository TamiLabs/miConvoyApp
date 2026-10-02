// src/formato.ts — pequeños formateadores compartidos (es-ES).

export function formatearEuros(valor: number): string {
  return `${valor.toFixed(2).replace(".", ",")} €`;
}

export function formatearFechaHora(fechaIso: string): string {
  return new Date(fechaIso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
