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

export function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString("es-ES");
}

// 207 → "3h 27min"; 45 → "45min"; 120 → "2h".
export function formatearDuracion(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = Math.round(minutos % 60);
  if (horas === 0) return `${resto}min`;
  if (resto === 0) return `${horas}h`;
  return `${horas}h ${resto}min`;
}

// "Mi posición (38.97, -3.89)" → "Mi posición". El resto se deja igual.
export function nombreCortoLugar(texto: string): string {
  const limpio = texto.trim();
  return /^mi posición\b/i.test(limpio) ? "Mi posición" : limpio;
}

export function nombreCortoRuta(origen?: string, destino?: string): string {
  return (
    [origen, destino]
      .map((punto) => (punto ? nombreCortoLugar(punto) : ""))
      .filter(Boolean)
      .join(" → ") || "Viaje"
  );
}
