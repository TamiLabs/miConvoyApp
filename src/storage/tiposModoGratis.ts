// Tipos usados en Modo Gratis (sin servidor). No hay base de datos: estos
// objetos se guardan en localStorage a través del adaptador de almacenamiento
// (ver src/calculadora.ts). Están pensados para mapear 1:1 con las
// entidades de schema.prisma, de forma que sincronizar con el servidor
// sea un mapeo directo y no una reescritura.

export interface PerfilLocal {
  correo: string; // viene del token de Google Identity Services, no se escribe a mano
  nombre: string;
  foto?: string;
  coches: CocheLocal[];
}

export interface CocheLocal {
  id: string; // uuid generado en el cliente
  marca: string;
  modelo: string;
  matricula: string;
  consumo: number; // l/100km
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
  distanciaKm: number;
  precioCombustible: number;
  coches: CocheDelViajeLocal[];
  gastosAdicionales: GastoAdicionalLocal[];
  // Foto inmutable — no se recalcula si cambia la fórmula en el futuro.
  resultado: ResultadoCalculo;
}

// --- Mapeo al sincronizar con el servidor -----------------------------------
// EntradaHistorial          → Viaje (origenModo: "gratis")
// CocheDelViajeLocal        → CocheDelViaje (con numeroPasajerosLibre relleno;
//                              sin Pasajero individuales, porque en Modo Gratis
//                              los pasajeros no están identificados uno a uno)
// GastoAdicionalLocal       → GastoAdicional
// PerfilLocal.coches[]      → Coche (idPropietario = User.id resuelto por correo)
