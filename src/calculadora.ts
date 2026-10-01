// src/calculadora.ts — lógica pura de cálculo del viaje.
//
// No depende de Next.js, tRPC, Prisma, localStorage ni del DOM: solo recibe
// datos y devuelve datos. Por eso se puede importar igual desde el cliente
// (Modo Gratis) que desde un router de tRPC en el servidor (Modo Online), y
// es directamente testeable sin levantar nada.

export interface DatosCalculoCoche {
  consumo: number; // L/100km — viene del perfil del coche (CocheLocal.consumo / Coche.consumo)
  distanciaKm: number; // compartida por todo el viaje
  precioPorLitro: number; // precio del combustible, reutilizado de la última vez introducido
  idaYVuelta: boolean;
  gastosAdicionales: { nombre: string; importe: number }[];
  numeroPasajeros: number; // recuento (Modo Gratis) o pasajeros.length (Modo Online)
  incluirConductorEnReparto: boolean;
}

export interface ResultadoCalculo {
  costeCombustible: number;
  costeTotal: number;
  costePorPersona: number; // ya redondeado (grupos de 0,50 €)
}

export function calcularCoche(datos: DatosCalculoCoche): ResultadoCalculo {
  const gastos = datos.gastosAdicionales.reduce((suma, gasto) => suma + gasto.importe, 0);

  // Coste por kilómetro = consumo (L/100km) convertido a L/km, por el precio del litro.
  const costePorKm = (datos.consumo / 100) * datos.precioPorLitro;

  let costeCombustible = datos.distanciaKm * costePorKm;
  if (datos.idaYVuelta) costeCombustible *= 2;

  const costeTotal = costeCombustible + gastos;

  const numeroParticipantes = datos.incluirConductorEnReparto
    ? datos.numeroPasajeros + 1
    : datos.numeroPasajeros;

  const costeBruto = costeTotal / numeroParticipantes;
  const costePorPersona = Math.ceil(costeBruto / 0.5) * 0.5; // redondeo al alza en grupos de 0,50 €

  return { costeCombustible, costeTotal, costePorPersona };
}

// Un convoy no es más que varias llamadas a calcularCoche, una por cada
// coche del viaje — cada uno con su propio consumo y sus propios pasajeros.
export function calcularConvoy(coches: DatosCalculoCoche[]): ResultadoCalculo[] {
  return coches.map(calcularCoche);
}
