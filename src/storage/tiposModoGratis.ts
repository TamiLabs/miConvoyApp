// Tipos usados en Modo Gratis (sin servidor). No hay base de datos: estos
// objetos se guardan en localStorage a través del adaptador de almacenamiento
// (ver src/calculadora.ts). Están pensados para mapear 1:1 con las
// entidades de schema.prisma, de forma que sincronizar con el servidor
// sea un mapeo directo y no una reescritura.

export interface PerfilLocal {
  correo: string; // viene del token de Google Identity Services, no se escribe a mano
  nombre: string;
  foto?: string;
  tieneCoche: boolean;
  coches: CocheLocal[];
}

export type TipoCombustible = "diesel" | "gasolina" | "electrico";

export const ETIQUETAS_COMBUSTIBLE: Record<TipoCombustible, string> = {
  diesel: "Diésel",
  gasolina: "Gasolina",
  electrico: "Eléctrico",
};

export interface CocheLocal {
  id: string; // uuid generado en el cliente
  marca: string;
  modelo: string;
  matricula: string;
  consumo: number; // l/100km
  precioPorLitro: number; // €/L — se rellena solo al dar de alta el coche
  tipoCombustible: TipoCombustible;
}

export interface GastoAdicionalLocal {
  nombre: string;
  importe: number;
}

export interface CocheDelViajeLocal {
  nombreConductor: string;
  idCoche?: string; // referencia a un CocheLocal del perfil, si existe
  numeroPasajeros: number;
  incluirConductorEnReparto: boolean;
  // Foto del momento del cálculo (el perfil puede cambiar después).
  consumo?: number; // l/100km
  precioPorLitro?: number; // €/L
}

export interface ResultadoCalculo {
  costeTotal: number;
  costePorPersona: number; // ya redondeado (grupos de 0,50 €)
}

export interface EntradaHistorial {
  id: string;
  fecha: string; // fecha ISO
  esConvoy: boolean;
  idaYVuelta: boolean;
  origen?: string;
  destino?: string;
  distanciaKm: number;
  precioCombustible: number;
  coches: CocheDelViajeLocal[];
  gastosAdicionales: GastoAdicionalLocal[];
  // Foto inmutable — no se recalcula si cambia la fórmula en el futuro.
  resultado: ResultadoCalculo;
  // Desglose por coche del mismo cálculo (para convoys).
  detallePorCoche?: ResultadoCalculo[];
}

// Formulario de la calculadora: como CocheDelViajeLocal pero con el consumo
// y el precio a mano (vienen del perfil al elegir coche, o se escriben libres).
export interface CocheFormularioLocal {
  nombreConductor: string;
  idCoche?: string; // referencia a un CocheLocal del perfil, si existe
  consumo: number; // l/100km
  precioPorLitro: number; // €/L
  tipoCombustible?: TipoCombustible;
  numeroPasajeros: number;
  incluirConductorEnReparto: boolean;
}

// Últimos datos del formulario, para reutilizarlos al abrir la calculadora.
export interface UltimoViajeLocal {
  origen: string;
  destino: string;
  distanciaKm: number | null;
  precioPorLitro: number | null; // compat: precio del primer coche (ahora va por coche)
  idaYVuelta: boolean;
  esConvoy: boolean;
  coches: CocheFormularioLocal[];
  gastosAdicionales: GastoAdicionalLocal[];
}

// --- Mapeo al sincronizar con el servidor -----------------------------------
// EntradaHistorial          → Viaje (origenModo: "gratis"; origen/destino van
//                              a Viaje.origen/Viaje.destino, detallePorCoche
//                              dentro de Viaje.resultado)
// CocheDelViajeLocal        → CocheDelViaje (con numeroPasajerosLibre relleno;
//                              sin Pasajero individuales, porque en Modo Gratis
//                              los pasajeros no están identificados uno a uno)
// GastoAdicionalLocal       → GastoAdicional
// PerfilLocal.coches[]      → Coche (idPropietario = User.id resuelto por correo)
