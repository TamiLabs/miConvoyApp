"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faCalculator,
  faCar,
  faCarAlt,
  faCarBattery,
  faCarCrash,
  faCarOn,
  faCloudArrowUp,
  faFlagCheckered,
  faHouse,
  faLink,
  faLocationDot,
  faMinus,
  faPen,
  faPlus,
  faRoute,
  faShareNodes,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { adaptadorAlmacenamientoLocal } from "@/storage/almacenamiento";
import {
  anadirEntradaHistorial,
  eliminarUltimoViaje,
  guardarUltimoViaje,
  guardarViajeCreado,
  obtenerHistorialActivo,
  obtenerPasoCalculadora,
  guardarPasoCalculadora,
  obtenerPerfil,
  obtenerUltimoResultado,
  guardarUltimoResultado,
  eliminarUltimoResultado,
  obtenerUltimoViaje,
  obtenerViajesCreados,
  olvidarViajeCreado,
  type ViajeCreadoLocal,
} from "@/storage/datosLocales";
import { useEstadoServidor } from "@/hooks/useEstadoServidor";
import type {
  CocheDelViajeLocal,
  EntradaHistorial,
  GastoAdicionalLocal,
  PerfilLocal,
} from "@/storage/tiposModoGratis";
import { formatearDuracion, formatearEuros, formatearFecha, nombreCortoRuta } from "@/formato";
import { calcularConvoy, type ResultadoCalculo } from "@/calculadora";
import { interpretarNumero } from "@/components/formularioCoche";
import { CampoDireccion } from "@/components/campoDireccion";
import {
  buscarDirecciones,
  calcularRutaORS,
  estanCaidosLosMapas,
  type PuntoRuta,
} from "@/mapas/openRouteService";
import { faCaretSquareDown } from "@fortawesome/free-regular-svg-icons";

const MapaViaje = dynamic(
  () => import("@/components/mapaViaje").then((modulo) => modulo.MapaViaje),
  { ssr: false, loading: () => <p className="textoSuave">Cargando mapa…</p> },
);

interface CocheForm {
  clave: string;
  nombreConductor: string;
  idCoche: string;
  consumoTexto: string;
  precioTexto: string;
  pasajerosTexto: string;
  incluirConductor: boolean;
}

interface GastoForm {
  clave: string;
  nombre: string;
  importeTexto: string;
}

const TITULOS_PASOS = ["Viaje", "Coches", "Gastos", "Resultado"];
const MAXIMO_COCHES = 6;

function generarClave(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function crearCocheVacio(conductor = ""): CocheForm {
  return {
    clave: generarClave(),
    nombreConductor: conductor,
    idCoche: "",
    consumoTexto: "",
    precioTexto: "",
    pasajerosTexto: "1",
    incluirConductor: true,
  };
}

function estaEnPerfil(perfil: PerfilLocal | null, idCoche: string): boolean {
  return !!idCoche && !!perfil?.coches.some((coche) => coche.id === idCoche);
}

function nombreCocheElegido(perfil: PerfilLocal | null, idCoche: string): string | null {
  const elegido = perfil?.coches.find((coche) => coche.id === idCoche);
  return elegido ? `${elegido.marca} ${elegido.modelo}` : null;
}

export default function PaginaCalculadora() {
  const [cargando, setCargando] = useState(true);
  const [perfil, setPerfil] = useState<PerfilLocal | null>(null);
  const [paso, setPaso] = useState(0);
  const [parpadeando, setParpadeando] = useState(false);
  const [parpadeoExtra, setParpadeoExtra] = useState(false);
  const temporizadorParpadeo = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nota, setNota] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (temporizadorParpadeo.current) clearTimeout(temporizadorParpadeo.current);
    };
  }, []);

  // Hace parpadear 2s los campos que falten (escala sin mover la vista).
  // Con extra=true resalta también origen/destino aunque tengan texto
  // (p. ej. si no se pudieron resolver).
  const dispararParpadeo = (extra = false) => {
    setParpadeando(false);
    if (temporizadorParpadeo.current) clearTimeout(temporizadorParpadeo.current);
    requestAnimationFrame(() => {
      setParpadeando(true);
      setParpadeoExtra(extra);
      temporizadorParpadeo.current = setTimeout(() => {
        setParpadeando(false);
        setParpadeoExtra(false);
      }, 2000);
    });
  };

  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [origenPunto, setOrigenPunto] = useState<PuntoRuta | null>(null);
  const [destinoPunto, setDestinoPunto] = useState<PuntoRuta | null>(null);
  const [lineaRuta, setLineaRuta] = useState<[number, number][]>([]);
  const [calculandoRuta, setCalculandoRuta] = useState(false);
  const [infoRuta, setInfoRuta] = useState<string | null>(null);
  const [mapasCaidosUi, setMapasCaidosUi] = useState(false);
  const [distanciaTexto, setDistanciaTexto] = useState("");
  const [idaYVuelta, setIdaYVuelta] = useState(true);
  const [localizando, setLocalizando] = useState(false);

  const [esConvoy, setEsConvoy] = useState(false);
  const [coches, setCoches] = useState<CocheForm[]>([crearCocheVacio()]);
  const [gastos, setGastos] = useState<GastoForm[]>([]);

  const [resultado, setResultado] = useState<ResultadoCalculo[] | null>(null);
  const [desactualizado, setDesactualizado] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [sinRedondeo, setSinRedondeo] = useState(false);
  const [fechaCalculo, setFechaCalculo] = useState<string | null>(null);
  const [historialActivo, setHistorialActivo] = useState(true);
  const [publicado, setPublicado] = useState<ViajeCreadoLocal | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [copiadoEnlace, setCopiadoEnlace] = useState(false);
  const { disponible: servidorDisponible } = useEstadoServidor();

  useEffect(() => {
    (async () => {
      const [perfilGuardado, ultimoViaje, activo, pasoGuardado, ultimoResultado] =
        await Promise.all([
          obtenerPerfil(adaptadorAlmacenamientoLocal),
          obtenerUltimoViaje(adaptadorAlmacenamientoLocal),
          obtenerHistorialActivo(adaptadorAlmacenamientoLocal),
          obtenerPasoCalculadora(adaptadorAlmacenamientoLocal),
          obtenerUltimoResultado(adaptadorAlmacenamientoLocal),
        ]);
      setPerfil(perfilGuardado);
      setHistorialActivo(activo);
      setPaso(pasoGuardado);
      if (ultimoResultado) {
        setResultado(ultimoResultado.resultado);
        setFechaCalculo(ultimoResultado.fechaCalculo);
        setGuardado(ultimoResultado.guardado);
        setPublicado(ultimoResultado.publicado);
      }
      if (ultimoViaje) {
        setOrigen(ultimoViaje.origen);
        setDestino(ultimoViaje.destino);
        setDistanciaTexto(
          ultimoViaje.distanciaKm === null ? "" : String(ultimoViaje.distanciaKm).replace(".", ","),
        );
        setIdaYVuelta(ultimoViaje.idaYVuelta);
        setEsConvoy(ultimoViaje.esConvoy);
        setCoches(
          ultimoViaje.coches.map((coche) => {
            const precioGuardado = coche.precioPorLitro ?? 0;
            return {
              clave: generarClave(),
              nombreConductor: coche.nombreConductor,
              idCoche: coche.idCoche ?? "",
              consumoTexto: String(coche.consumo).replace(".", ","),
              precioTexto: precioGuardado > 0 ? String(precioGuardado).replace(".", ",") : "",
              pasajerosTexto: String(coche.numeroPasajeros + 1),
              incluirConductor: coche.incluirConductorEnReparto,
            };
          }),
        );
        setGastos(
          ultimoViaje.gastosAdicionales.map((gasto) => ({
            clave: generarClave(),
            nombre: gasto.nombre,
            importeTexto: String(gasto.importe).replace(".", ","),
          })),
        );
      } else if (perfilGuardado) {
        const primero = perfilGuardado.coches[0];
        setCoches([
          {
            ...crearCocheVacio(perfilGuardado.nombre),
            idCoche: primero?.id ?? "",
            consumoTexto: primero ? String(primero.consumo).replace(".", ",") : "",
            precioTexto:
              primero && primero.precioPorLitro > 0
                ? String(primero.precioPorLitro).replace(".", ",")
                : "",
          },
        ]);
      }
      setCargando(false);
    })();
  }, []);

  useEffect(() => {
    if (!cargando) void guardarPasoCalculadora(adaptadorAlmacenamientoLocal, paso);
  }, [paso, cargando]);

  const tocar = () => {
    if (resultado) setDesactualizado(true);

    setNota(null);
  };

  // Precio del coche: interno desde el perfil al elegir coche, o manual.
  const precioDeCoche = (coche: CocheForm): number | null => {
    const elegido = perfil?.coches.find((c) => c.id === coche.idCoche);
    if (elegido) return elegido.precioPorLitro > 0 ? elegido.precioPorLitro : null;
    return interpretarNumero(coche.precioTexto);
  };

  // Plazas del coche elegido (tope de ocupantes con conductor). En manual no hay tope.
  const plazasDeCoche = (coche: CocheForm): number | null => {
    const elegido = perfil?.coches.find((c) => c.id === coche.idCoche);
    return elegido?.plazas ?? null;
  };

  // El campo pide ocupantes totales (pasajeros + conductor). Con la casilla
  // marcada, el conductor paga su parte y se divide entre N; sin marcar, se
  // le invita y pagan solo los N-1 pasajeros no conductores.
  const aReparto = (
    coche: CocheForm,
  ): { numeroPasajeros: number; incluirConductorEnReparto: boolean } => ({
    numeroPasajeros: Number.parseInt(coche.pasajerosTexto, 10) - 1,
    incluirConductorEnReparto: coche.incluirConductor,
  });

  const alUsarPosicion = () => {
    if (!("geolocation" in navigator)) {
      setNota("Tu navegador no permite usar la geolocalización.");
      return;
    }
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const etiqueta = `Mi posición (${posicion.coords.latitude.toFixed(5)}, ${posicion.coords.longitude.toFixed(5)})`;
        setOrigen(etiqueta);
        setOrigenPunto({
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
          etiqueta,
        });
        setLineaRuta([]);
        setInfoRuta(null);
        setLocalizando(false);
        tocar();
      },
      () => {
        setNota("No se pudo obtener tu posición. Escríbela a mano.");
        setLocalizando(false);
      },
      { timeout: 10000 },
    );
  };

  const alCambiarOrigen = (texto: string) => {
    setOrigen(texto);
    setOrigenPunto(null);
    setLineaRuta([]);
    setInfoRuta(null);
    tocar();
  };

  const alCambiarDestino = (texto: string) => {
    setDestino(texto);
    setDestinoPunto(null);
    setLineaRuta([]);
    setInfoRuta(null);
    tocar();
  };

  const alElegirOrigen = (punto: PuntoRuta) => {
    setOrigen(punto.etiqueta);
    setOrigenPunto(punto);
    setLineaRuta([]);
    setInfoRuta(null);
    tocar();
  };

  const alElegirDestino = (punto: PuntoRuta) => {
    setDestino(punto.etiqueta);
    setDestinoPunto(punto);
    setLineaRuta([]);
    setInfoRuta(null);
    tocar();
  };

  const ultimoCalculoAuto = useRef("");
  const calculandoRef = useRef(false);

  const calcularDistancia = async (origen: PuntoRuta, destino: PuntoRuta) => {
    const clave = `${origen.latitud},${origen.longitud}|${destino.latitud},${destino.longitud}`;
    if (calculandoRef.current || ultimoCalculoAuto.current === clave) return;
    calculandoRef.current = true;
    ultimoCalculoAuto.current = clave;
    setCalculandoRuta(true);

    try {
      const ruta = await calcularRutaORS(origen, destino);
      setDistanciaTexto(String(Number(ruta.distanciaKm.toFixed(1))).replace(".", ","));
      setLineaRuta(ruta.linea);
      setInfoRuta(
        `Ruta: ${ruta.distanciaKm.toFixed(1).replace(".", ",")} km · ${formatearDuracion(ruta.duracionMin)}`,
      );
      tocar();
    } catch (e) {
      ultimoCalculoAuto.current = "";
      setNota(e instanceof Error ? e.message : "No se pudo calcular la distancia.");
      dispararParpadeo(true);
      if (estanCaidosLosMapas()) setMapasCaidosUi(true);
    }
    calculandoRef.current = false;
    setCalculandoRuta(false);
  };

  // Si solo hay texto, resuelve la primera sugerencia de cada uno.
  const resolverPunto = async (
    texto: string,
    punto: PuntoRuta | null,
    alFijar: (p: PuntoRuta, etiqueta: string) => void,
  ): Promise<PuntoRuta | null> => {
    if (punto) return punto;
    if (!texto.trim()) return null;
    const sugerencias = await buscarDirecciones(texto.trim());
    const primera = sugerencias[0];
    if (!primera) throw new Error(`Sin resultados para "${texto.trim()}".`);
    const resuelto: PuntoRuta = {
      latitud: primera.latitud,
      longitud: primera.longitud,
      etiqueta: primera.etiqueta,
    };
    alFijar(resuelto, primera.etiqueta);
    return resuelto;
  };

  const alCalcularDistancia = async () => {
    try {
      const o = await resolverPunto(origen, origenPunto, (p, etiqueta) => {
        setOrigen(etiqueta);
        setOrigenPunto(p);
      });
      const d = await resolverPunto(destino, destinoPunto, (p, etiqueta) => {
        setDestino(etiqueta);
        setDestinoPunto(p);
      });
      if (!o || !d) {
        setNota("Escribe origen y destino para calcular los km.");
        dispararParpadeo();
        return;
      }
      ultimoCalculoAuto.current = "";
      await calcularDistancia(o, d);
    } catch (e) {
      setNota(e instanceof Error ? e.message : "No se pudo calcular la distancia.");
      dispararParpadeo(true);
    }
  };

  // Autocálculo: en cuanto hay origen y destino exactos, sin pulsar nada.
  useEffect(() => {
    if (origenPunto && destinoPunto) void calcularDistancia(origenPunto, destinoPunto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origenPunto, destinoPunto]);

  const nuevoCocheVacio = (conductor = ""): CocheForm => {
    const primero = perfil?.coches[0];
    return {
      ...crearCocheVacio(conductor),
      idCoche: primero?.id ?? "",
      consumoTexto: primero ? String(primero.consumo).replace(".", ",") : "",
      precioTexto:
        primero && primero.precioPorLitro > 0
          ? String(primero.precioPorLitro).replace(".", ",")
          : "",
    };
  };

  const alElegirCoche = (clave: string, valor: string) => {
    setCoches((previos) =>
      previos.map((coche) => {
        if (coche.clave !== clave) return coche;
        if (valor === "manual") return { ...coche, idCoche: "" };
        const elegido = perfil?.coches.find((c) => c.id === valor);
        // Consumo y precio quedan internos: el usuario solo ve el coche.
        return {
          ...coche,
          idCoche: valor,
          consumoTexto: elegido ? String(elegido.consumo).replace(".", ",") : coche.consumoTexto,
          precioTexto:
            elegido && elegido.precioPorLitro > 0
              ? String(elegido.precioPorLitro).replace(".", ",")
              : coche.precioTexto,
        };
      }),
    );
    tocar();
  };

  const alCambiarNumeroCoches = (total: number) => {
    const objetivo = Math.min(Math.max(total || 1, 1), MAXIMO_COCHES);
    setCoches((previos) => {
      if (objetivo > previos.length) {
        return [
          ...previos,
          ...Array.from({ length: objetivo - previos.length }, () => nuevoCocheVacio()),
        ];
      }
      return previos.slice(0, objetivo);
    });
    tocar();
  };

  const alAnadirGasto = () => {
    setGastos((previos) => [...previos, { clave: generarClave(), nombre: "", importeTexto: "" }]);
    tocar();
  };

  // Fuente única de verdad para validar: cada campo devuelve su fallo o null.
  // Los booleanos de abajo derivan de aquí (parpadeo) y los validar* componen.
  const esTextoRelleno = (texto: string): boolean => texto.trim().length > 0;
  const esNumeroPositivo = (texto: string): boolean => {
    const numero = interpretarNumero(texto);
    return numero !== null && numero > 0;
  };
  const falloTextoRequerido = (texto: string, mensaje: string): string | null =>
    esTextoRelleno(texto) ? null : mensaje;
  const falloNumeroPositivo = (texto: string, mensaje: string): string | null =>
    esNumeroPositivo(texto) ? null : mensaje;
  const falloConsumo = (coche: CocheForm): string | null => {
    if (esNumeroPositivo(coche.consumoTexto)) return null;
    return estaEnPerfil(perfil, coche.idCoche)
      ? "El coche elegido no tiene un consumo válido. Revísalo en tu perfil."
      : "Revisa el consumo (L/100km).";
  };
  const falloPrecio = (coche: CocheForm): string | null => {
    if ((precioDeCoche(coche) ?? 0) > 0) return null;
    return estaEnPerfil(perfil, coche.idCoche)
      ? "El coche elegido no tiene precio: edítalo en tu perfil."
      : "Revisa el precio del combustible (€/L).";
  };
  const falloOcupantes = (coche: CocheForm): string | null => {
    const ocupantes = Number.parseInt(coche.pasajerosTexto, 10);
    if (!Number.isInteger(ocupantes) || ocupantes < 1)
      return "Escribe cuántas personas van en el coche (mínimo 1).";
    if (!coche.incluirConductor && ocupantes < 2)
      return "Si el conductor no paga, tiene que haber al menos 2 ocupantes.";
    const plazas = plazasDeCoche(coche);
    if (plazas !== null && ocupantes > plazas)
      return `Este coche tiene ${plazas} plazas como máximo (incluido el conductor).`;
    return null;
  };
  const falloGasto = (gasto: GastoForm): string | null => {
    if (!gasto.nombre.trim() && !gasto.importeTexto.trim()) return null;
    if (!gasto.nombre.trim()) return "Cada gasto necesita un nombre.";
    if (!esNumeroPositivo(gasto.importeTexto))
      return `Revisa el importe de "${gasto.nombre.trim()}".`;
    return null;
  };

  const validarViaje = (): string | null =>
    falloTextoRequerido(origen, "Escribe el origen del viaje.") ??
    falloTextoRequerido(destino, "Escribe el destino del viaje.") ??
    falloNumeroPositivo(distanciaTexto, "Escribe la distancia en km (vale con , o .).");

  const validarCoches = (): string | null => {
    for (let i = 0; i < coches.length; i++) {
      const coche = coches[i];
      const etiqueta = esConvoy ? `Coche ${i + 1}: ` : "";
      const fallo =
        falloTextoRequerido(coche.nombreConductor, "Falta el nombre del conductor.") ??
        falloConsumo(coche) ??
        falloPrecio(coche) ??
        falloOcupantes(coche);
      if (fallo) return `${etiqueta}${fallo}`;
    }
    return null;
  };

  const validarGastos = (): string | null => {
    for (const gasto of gastos) {
      const fallo = falloGasto(gasto);
      if (fallo) return fallo;
    }
    return null;
  };

  const validarPaso = (indice: number): string | null => {
    if (indice === 0) return validarViaje();
    if (indice === 1) return validarCoches();
    return validarGastos();
  };

  const esOcupantesValido = (coche: CocheForm): boolean => falloOcupantes(coche) === null;
  const estadoGasto = (gasto: GastoForm): "vacio" | "valido" | "invalido" => {
    if (!gasto.nombre.trim() && !gasto.importeTexto.trim()) return "vacio";
    return falloGasto(gasto) === null ? "valido" : "invalido";
  };
  // Parpadeo en los campos que falten (2s y para).
  const claseParpadeo = (invalido: boolean): string =>
    `formulario__entrada${parpadeando && invalido ? " formulario__entrada--parpadeo" : ""}`;

  const alSiguiente = () => {
    const fallo = validarPaso(paso);
    if (fallo) {
      setNota(fallo);
      dispararParpadeo();
      return;
    }

    setPaso((p) => Math.min(p + 1, 3));
  };

  // Saltar entre pasos: hacia atrás siempre se puede; hacia adelante solo si
  // todos los pasos intermedios están completos.
  const alIrAPaso = (indice: number) => {
    if (indice <= paso) {
      setPaso(indice);

      return;
    }
    for (let i = paso; i < indice; i++) {
      const fallo = validarPaso(i);
      if (fallo) {
        setNota(fallo);
        dispararParpadeo();
        return;
      }
    }

    setPaso(indice);
  };

  // Todo lo derivado del formulario en un solo sitio: lo usan alCalcular,
  // alFinalizar y el log. Sin esto habría tres copias divergentes.
  const construirDatosViaje = () => {
    const distanciaKm = interpretarNumero(distanciaTexto) ?? 0;
    const gastosLimpios: GastoAdicionalLocal[] = gastos
      .filter((g) => g.nombre.trim() || g.importeTexto.trim())
      .map((g) => ({ nombre: g.nombre.trim(), importe: interpretarNumero(g.importeTexto) ?? 0 }));
    const precios = coches.map((coche) => precioDeCoche(coche) ?? 0);
    const tipos = coches.map(
      (coche) => perfil?.coches.find((c) => c.id === coche.idCoche)?.tipoCombustible,
    );
    const entradasCalculo = coches.map((coche) => ({
      consumo: interpretarNumero(coche.consumoTexto) ?? 0,
      distanciaKm,
      precioPorLitro: precioDeCoche(coche) ?? 0,
      idaYVuelta,
      gastosAdicionales: gastosLimpios.map((g) => ({ ...g, importe: g.importe / coches.length })),
      ...aReparto(coche),
    }));
    const resultados = calcularConvoy(entradasCalculo);
    const total = resultados.reduce((suma, r) => suma + r.costeTotal, 0);
    const totalParticipantes = coches.reduce(
      (suma, c) => suma + Number.parseInt(c.pasajerosTexto, 10) - (c.incluirConductor ? 0 : 1),
      0,
    );
    const media = Math.ceil(total / Math.max(totalParticipantes, 1) / 0.5) * 0.5;
    return {
      distanciaKm,
      gastosLimpios,
      precios,
      tipos,
      entradasCalculo,
      resultados,
      total,
      media,
    };
  };

  const alCalcular = async () => {
    const fallo = validarViaje() ?? validarCoches() ?? validarGastos();
    if (fallo) {
      setNota(fallo);
      dispararParpadeo();
      return;
    }
    const datos = construirDatosViaje();
    console.log(
      [
        "[MiConvoy] Cálculo del viaje:",
        `Ruta: ${origen.trim() || "—"} → ${destino.trim() || "—"}`,
        `Distancia: ${datos.distanciaKm} km${idaYVuelta ? " x2 (ida y vuelta)" : ""}`,
        ...datos.resultados.map((r, i) => {
          const coche = coches[i];
          const entrada = datos.entradasCalculo[i];
          const ocupantes = Number.parseInt(coche.pasajerosTexto, 10);
          const pagan = entrada.incluirConductorEnReparto ? ocupantes : ocupantes - 1;
          const detalle = entrada.incluirConductorEnReparto
            ? `${ocupantes - 1} pasajeros + conductor`
            : `${pagan} pasajeros (conductor invitado)`;
          const bruto = r.costeTotal / pagan;
          return [
            `Coche ${i + 1} (${coche.nombreConductor.trim() || "—"}):`,
            `  consumo=${entrada.consumo} L/100km, precio=${entrada.precioPorLitro} €/L → combustible=${formatearEuros(r.costeCombustible)} + gastos=${formatearEuros(r.costeTotal - r.costeCombustible)} = total ${formatearEuros(r.costeTotal)}`,
            `  reparto entre ${pagan} (${detalle}) → bruto ${formatearEuros(bruto)} → redondeo ${formatearEuros(r.costePorPersona)} por persona`,
          ].join("\n");
        }),
      ].join("\n"),
    );
    setResultado(datos.resultados);
    setDesactualizado(false);
    setGuardado(false);
    setPublicado(null);
    const fechaAhora = new Date().toISOString();
    setFechaCalculo(fechaAhora);
    await guardarUltimoResultado(adaptadorAlmacenamientoLocal, {
      resultado: datos.resultados,
      fechaCalculo: fechaAhora,
      guardado: false,
      publicado: null,
    });

    setPaso(3);

    await guardarUltimoViaje(adaptadorAlmacenamientoLocal, {
      origen: origen.trim(),
      destino: destino.trim(),
      distanciaKm: datos.distanciaKm,
      idaYVuelta,
      esConvoy,
      coches: coches.map((coche, i) => ({
        nombreConductor: coche.nombreConductor.trim(),
        idCoche: coche.idCoche || undefined,
        consumo: interpretarNumero(coche.consumoTexto) ?? 0,
        precioPorLitro: datos.precios[i] ?? 0,
        tipoCombustible: datos.tipos[i],
        ...aReparto(coche),
      })),
      gastosAdicionales: datos.gastosLimpios,
    });
  };

  // El viaje solo entra al historial al pulsar "Finalizar viaje": hasta entonces
  // se puede navegar libremente entre pasos para cambiar datos.
  const alFinalizar = async () => {
    if (!resultado || desactualizado || guardado) return;
    const datos = construirDatosViaje();
    const entrada: EntradaHistorial = {
      id: generarClave(),
      fecha: new Date().toISOString(),
      esConvoy,
      idaYVuelta,
      origen: origen.trim() || undefined,
      destino: destino.trim() || undefined,
      distanciaKm: datos.distanciaKm,
      precioCombustible: esConvoy
        ? datos.precios.reduce((suma, p) => suma + p, 0) / Math.max(datos.precios.length, 1)
        : (datos.precios[0] ?? 0),
      coches: coches.map((coche, i): CocheDelViajeLocal => ({
        nombreConductor: coche.nombreConductor.trim(),
        idCoche: coche.idCoche || undefined,
        consumo: interpretarNumero(coche.consumoTexto) ?? 0,
        precioPorLitro: datos.precios[i] ?? 0,
        ...aReparto(coche),
      })),
      gastosAdicionales: datos.gastosLimpios,
      resultado: { costeTotal: datos.total, costePorPersona: datos.media },
      detallePorCoche: datos.resultados.map((r) => ({
        costeTotal: r.costeTotal,
        costePorPersona: r.costePorPersona,
      })),
    };
    await anadirEntradaHistorial(adaptadorAlmacenamientoLocal, entrada);
    setGuardado(true);
    const previo = await obtenerUltimoResultado(adaptadorAlmacenamientoLocal);
    if (previo) {
      await guardarUltimoResultado(adaptadorAlmacenamientoLocal, { ...previo, guardado: true });
    }
  };

  const pasajerosTotales = (): number =>
    coches.reduce((suma, coche) => suma + (Number.parseInt(coche.pasajerosTexto, 10) || 0), 0);

  // Km mostrados: en ida y vuelta, el doble de lo introducido (ida + vuelta).
  const distanciaMostrada = (): string => {
    const km = interpretarNumero(distanciaTexto) ?? 0;
    return String(Number(((idaYVuelta ? km * 2 : km) || 0).toFixed(2))).replace(".", ",");
  };

  // Importe visible: redondeado por defecto; bruto exacto si se quitó el redondeo.
  const importeCoche = (i: number, r: ResultadoCalculo): number => {
    if (!sinRedondeo) return r.costePorPersona;
    const ocupantes = Number.parseInt(coches[i]?.pasajerosTexto ?? "0", 10);
    const pagan = (coches[i]?.incluirConductor ? ocupantes : ocupantes - 1) || 1;
    return r.costeTotal / pagan;
  };

  const textoParaCompartir = (): string => {
    if (!resultado) return "";
    // Mismo contenido que el ticket visible: ruta, fecha, ida/vuelta, km,
    // personas y, por coche, conductor, coche, importe y "por persona".
    const fecha = fechaCalculo
      ? formatearFecha(fechaCalculo)
      : formatearFecha(new Date().toISOString());
    const cabecera = `${fecha} · ${idaYVuelta ? "Ida y vuelta" : "Solo ida"} · ${distanciaMostrada()} km · ${pasajerosTotales()} persona${pasajerosTotales() === 1 ? "" : "s"}`;
    const ruta = nombreCortoRuta(origen, destino);
    const bloques = resultado.map((r, i) => {
      const lineasBloque: string[] = [];
      if (esConvoy) {
        lineasBloque.push((coches[i]?.nombreConductor || `Coche ${i + 1}`).trim());
      } else if (coches[0]) {
        lineasBloque.push(`Conduce ${(coches[0].nombreConductor || "—").trim()}`);
      }
      const nombreCoche = nombreCocheElegido(perfil, coches[i]?.idCoche ?? "");
      if (nombreCoche) lineasBloque.push(nombreCoche);
      lineasBloque.push(formatearEuros(importeCoche(i, r)), "por persona");
      return lineasBloque.join("\n");
    });
    return [ruta, cabecera, ...bloques, "MiConvoy"].join("\n");
  };

  const alCopiar = async () => {
    const texto = textoParaCompartir();
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const area = document.createElement("textarea");
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
  };

  const alCompartir = async () => {
    const texto = textoParaCompartir();
    if ("share" in navigator) {
      try {
        await navigator.share({ title: "MiConvoy", text: texto });
      } catch {
        // El usuario canceló el diálogo: no hacemos nada.
      }
    } else {
      await alCopiar();
      setNota("Tu navegador no permite compartir directamente: el texto se ha copiado.");
    }
  };

  // Vacía todo y vuelve al inicio para empezar un viaje de cero.
  const alVolverAlInicio = async () => {
    await eliminarUltimoViaje(adaptadorAlmacenamientoLocal);
    await eliminarUltimoResultado(adaptadorAlmacenamientoLocal);
    setOrigen("");
    setDestino("");
    setOrigenPunto(null);
    setDestinoPunto(null);
    setLineaRuta([]);
    setInfoRuta(null);
    setDistanciaTexto("");
    setIdaYVuelta(true);
    setEsConvoy(false);
    setCoches([crearCocheVacio()]);
    setGastos([]);
    setResultado(null);
    setDesactualizado(false);
    setGuardado(false);
    setSinRedondeo(false);
    setFechaCalculo(null);
    setPublicado(null);

    setPaso(0);
  };

  // Publica el viaje calculado para apuntarse por enlace (requiere perfil).
  const alPublicar = async () => {
    if (!resultado || desactualizado || !perfil || !servidorDisponible) return;
    const datos = construirDatosViaje();
    setPublicando(true);
    setNota(null);
    try {
      const respuesta = await fetch("/api/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: perfil.correo,
          nombre: perfil.nombre,
          origen: origen.trim(),
          destino: destino.trim(),
          distanciaKm: datos.distanciaKm,
          idaYVuelta,
          incluirConductor: coches.every((c) => c.incluirConductor),
          gastos: datos.gastosLimpios,
          coches: coches.map((coche) => {
            const elegido = perfil.coches.find((c) => c.id === coche.idCoche);
            const ocupantes = Number.parseInt(coche.pasajerosTexto, 10) || 1;
            return {
              marca: elegido?.marca,
              modelo: elegido?.modelo,
              matricula: elegido?.matricula,
              consumo: interpretarNumero(coche.consumoTexto) ?? 0,
              precio: precioDeCoche(coche) ?? 0,
              plazas: Math.min(9, Math.max(1, elegido?.plazas ?? ocupantes)),
              conductorNombre: coche.nombreConductor.trim(),
              incluirConductorEnReparto: coche.incluirConductor,
            };
          }),
        }),
      });
      const respuestaDatos = await respuesta.json();
      if (!respuesta.ok || !respuestaDatos.ok)
        throw new Error(respuestaDatos.error ?? "No se pudo publicar.");
      const ref = { id: respuestaDatos.id, tokenEdicion: respuestaDatos.tokenEdicion };
      // Solo un viaje activo cada vez: se olvidan los anteriores.
      const previos = await obtenerViajesCreados(adaptadorAlmacenamientoLocal);
      for (const viejo of previos) {
        if (viejo.id !== ref.id) await olvidarViajeCreado(adaptadorAlmacenamientoLocal, viejo.id);
      }
      await guardarViajeCreado(adaptadorAlmacenamientoLocal, ref);
      setPublicado(ref);
      const previo = await obtenerUltimoResultado(adaptadorAlmacenamientoLocal);
      if (previo) {
        await guardarUltimoResultado(adaptadorAlmacenamientoLocal, { ...previo, publicado: ref });
      }
    } catch (e) {
      setNota(e instanceof Error ? e.message : "No se pudo publicar.");
    }
    setPublicando(false);
  };

  const alCopiarEnlaceOnline = async () => {
    if (!publicado) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/online/${publicado.id}`);
      setCopiadoEnlace(true);
      setTimeout(() => setCopiadoEnlace(false), 2000);
    } catch {
      // Portapapeles no disponible.
    }
  };

  if (cargando) return <p className="paginaCalculadora textoSuave">Cargando calculadora…</p>;

  // En el paso 4 con resultado los pasos se bloquean (sin --hecho): para
  // corregir se usa Editar; el paso 4 solo es clicable si ya hay resultado.
  const pasosBloqueados = paso === 3 && resultado !== null;
  const pasoClicable = (i: number) => !pasosBloqueados && (i < 3 || resultado !== null);

  return (
    <section className="paginaCalculadora">
      <ol className="calculadora__pasos" aria-label="Progreso">
        {TITULOS_PASOS.map((titulo, i) => (
          <li
            key={titulo}
            className={
              i === paso
                ? "calculadora__paso calculadora__paso--activo"
                : !pasosBloqueados && i < paso
                  ? "calculadora__paso calculadora__paso--hecho"
                  : "calculadora__paso"
            }
          >
            {pasoClicable(i) ? (
              <button
                type="button"
                className="calculadora__pasoBoton"
                onClick={() => alIrAPaso(i)}
                aria-current={i === paso ? "step" : undefined}
                aria-label={`Ir al paso ${i + 1}: ${titulo}`}
              >
                <span className="calculadora__pasoNumero">{i + 1}</span> {titulo}
              </button>
            ) : (
              <span
                className="calculadora__pasoBoton calculadora__pasoBoton--fijo"
                aria-current={i === paso ? "step" : undefined}
              >
                <span className="calculadora__pasoNumero">{i + 1}</span> {titulo}
              </span>
            )}
          </li>
        ))}
      </ol>
      {nota ? <p className="textoSuave">{nota}</p> : null}

      {paso === 0 && (
        <div className="formulario">
          <CampoDireccion
            id="origen-viaje"
            etiqueta="Origen"
            valor={origen}
            placeholder="¿Desde dónde salís?"
            alCambiar={alCambiarOrigen}
            alElegir={alElegirOrigen}
            resaltar={parpadeando && (!esTextoRelleno(origen) || parpadeoExtra)}
            botonExtra={
              <button
                type="button"
                className="botonSecundario"
                onClick={alUsarPosicion}
                disabled={localizando}
                aria-label="Usar mi posición actual"
              >
                <FontAwesomeIcon icon={faLocationDot} />
              </button>
            }
          />
          <CampoDireccion
            id="destino-viaje"
            etiqueta="Destino"
            valor={destino}
            placeholder="¿A dónde vais?"
            alCambiar={alCambiarDestino}
            alElegir={alElegirDestino}
            resaltar={parpadeando && (!esTextoRelleno(destino) || parpadeoExtra)}
          />
          <MapaViaje origen={origenPunto} destino={destinoPunto} linea={lineaRuta} />
          <div className="calculadora__distanciaFila">
            {!mapasCaidosUi && (
              <button
                type="button"
                className="botonSecundario"
                onClick={alCalcularDistancia}
                disabled={calculandoRuta || !origen.trim() || !destino.trim()}
                aria-label="Calcular distancia automáticamente"
                title="Calcular distancia automáticamente"
              >
                <FontAwesomeIcon icon={faRoute} spin={calculandoRuta} />
              </button>
            )}
            <input
              className={claseParpadeo(!esNumeroPositivo(distanciaTexto))}
              value={infoRuta ?? distanciaTexto}
              onChange={(e) => {
                setDistanciaTexto(e.target.value);
                tocar();
              }}
              placeholder="0 km"
              aria-label="Distancia en kilómetros"
              inputMode="decimal"
              readOnly={infoRuta !== null}
            />
          </div>
          <p className="textoSuave">
            {mapasCaidosUi
              ? "Mapas no disponibles de momento: escribe los km a mano."
              : "Elige origen y destino de las sugerencias para calcular los km, o escríbelos a mano."}
          </p>
          <label className="calculadora__interruptor">
            <input
              type="checkbox"
              checked={idaYVuelta}
              onChange={(e) => {
                setIdaYVuelta(e.target.checked);
                tocar();
              }}
            />
            <span>¿Trayecto de ida y vuelta?</span>
          </label>
        </div>
      )}

      {paso === 1 && (
        <div className="formulario">
          <label className="calculadora__interruptor">
            <input
              type="checkbox"
              checked={esConvoy}
              onChange={(e) => {
                setEsConvoy(e.target.checked);
                if (!e.target.checked) setCoches((previos) => previos.slice(0, 1));
                else if (coches.length < 2) setCoches((previos) => [...previos, nuevoCocheVacio()]);
                tocar();
              }}
            />
            <span>¿Es convoy? (varios coches)</span>
          </label>
          {esConvoy && (
            <div className="formulario__campo">
              <span className="formulario__etiqueta">Nº de coches</span>
              <div className="calculadora__pasoCoches">
                <button
                  type="button"
                  className="calculadora__pasoCochesBoton calculadora__pasoCochesBoton--menos"
                  onClick={() => alCambiarNumeroCoches(coches.length - 1)}
                  disabled={coches.length <= 1}
                  aria-label="Quitar un coche"
                >
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <output className="calculadora__pasoCochesValor" aria-live="polite">
                  {coches.length}
                </output>
                <button
                  type="button"
                  className="calculadora__pasoCochesBoton calculadora__pasoCochesBoton--mas"
                  onClick={() => alCambiarNumeroCoches(coches.length + 1)}
                  disabled={coches.length >= MAXIMO_COCHES}
                  aria-label="Añadir un coche"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>
          )}
          {coches.map((coche, i) => (
            <article key={coche.clave} className="calculadora__tarjetaCoche">
              {esConvoy && <h3 className="tituloSeccion">Coche {i + 1}</h3>}
              <label className="formulario__campo">
                <span className="formulario__etiqueta">Nombre del conductor</span>
                <input
                  className={claseParpadeo(!esTextoRelleno(coche.nombreConductor))}
                  value={coche.nombreConductor}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setCoches((previos) =>
                      previos.map((c) =>
                        c.clave === coche.clave ? { ...c, nombreConductor: valor } : c,
                      ),
                    );
                    tocar();
                  }}
                  placeholder="¿Quién conduce?"
                />
              </label>
              {perfil && perfil.coches.length > 0 && (
                <label className="formulario__campo">
                  <span className="formulario__etiqueta">¿Qué coche vas a usar?</span>
                  <select
                    className="formulario__entrada"
                    value={estaEnPerfil(perfil, coche.idCoche) ? coche.idCoche : "manual"}
                    onChange={(e) => alElegirCoche(coche.clave, e.target.value)}
                  >
                    {perfil.coches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.marca} {c.modelo} ({c.matricula})
                      </option>
                    ))}
                    <option value="manual">Otro coche (consumo manual)</option>
                  </select>
                </label>
              )}
              {!estaEnPerfil(perfil, coche.idCoche) && (
                <div className="calculadora__fila">
                  <label className="formulario__campo">
                    <span className="formulario__etiqueta">Precio combustible (€/L)</span>
                    <input
                      className={claseParpadeo(!((precioDeCoche(coche) ?? 0) > 0))}
                      value={coche.precioTexto}
                      onChange={(e) => {
                        const valor = e.target.value;
                        setCoches((previos) =>
                          previos.map((c) =>
                            c.clave === coche.clave ? { ...c, precioTexto: valor } : c,
                          ),
                        );
                        tocar();
                      }}
                      placeholder="p. ej. 1,65"
                      inputMode="decimal"
                    />
                  </label>
                  <label className="formulario__campo">
                    <span className="formulario__etiqueta">Consumo (L/100km)</span>
                    <input
                      className={claseParpadeo(!esNumeroPositivo(coche.consumoTexto))}
                      value={coche.consumoTexto}
                      onChange={(e) => {
                        const valor = e.target.value;
                        setCoches((previos) =>
                          previos.map((c) =>
                            c.clave === coche.clave ? { ...c, consumoTexto: valor } : c,
                          ),
                        );
                        tocar();
                      }}
                      placeholder="6,5"
                      inputMode="decimal"
                    />
                  </label>
                </div>
              )}
              <label className="formulario__campo">
                <span className="formulario__etiqueta">Nº ocupantes (incluido el conductor)</span>
                <input
                  className={claseParpadeo(!esOcupantesValido(coche))}
                  value={coche.pasajerosTexto}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setCoches((previos) =>
                      previos.map((c) =>
                        c.clave === coche.clave ? { ...c, pasajerosTexto: valor } : c,
                      ),
                    );
                    tocar();
                  }}
                  placeholder="4"
                  inputMode="numeric"
                  max={plazasDeCoche(coche) ?? undefined}
                />
                {Number.parseInt(coche.pasajerosTexto, 10) >= 1 && (
                  <span className="textoSuave">
                    {coche.incluirConductor
                      ? `Se divide entre ${coche.pasajerosTexto} (todos pagan)`
                      : `Se divide entre ${Number.parseInt(coche.pasajerosTexto, 10) - 1} (el conductor va invitado)`}
                    {plazasDeCoche(coche) !== null ? ` · máx. ${plazasDeCoche(coche)}` : ""}
                  </span>
                )}
              </label>
              <label className="calculadora__interruptor">
                <input
                  type="checkbox"
                  checked={coche.incluirConductor}
                  onChange={(e) => {
                    const valor = e.target.checked;
                    setCoches((previos) =>
                      previos.map((c) =>
                        c.clave === coche.clave ? { ...c, incluirConductor: valor } : c,
                      ),
                    );
                    tocar();
                  }}
                />
                <span>El conductor paga su parte</span>
              </label>
            </article>
          ))}
          {(!perfil || perfil.coches.length === 0) && (
            <p className="textoSuave">
              Sin coches en tu perfil: escribe el consumo a mano. Puedes dar de alta tus coches en
              la pestaña Perfil.
            </p>
          )}
        </div>
      )}

      {paso === 2 && (
        <div className="formulario">
          <p className="textoSuave">
            Peajes, aparcamiento… En convoy se reparten a partes iguales entre los coches.
          </p>
          {gastos.map((gasto) => (
            <div key={gasto.clave} className="calculadora__gasto">
              <input
                className={
                  !gasto.nombre.trim() && !gasto.importeTexto.trim()
                    ? "formulario__entrada"
                    : claseParpadeo(estadoGasto(gasto) === "invalido")
                }
                value={gasto.nombre}
                onChange={(e) => {
                  const valor = e.target.value;
                  setGastos((previos) =>
                    previos.map((g) => (g.clave === gasto.clave ? { ...g, nombre: valor } : g)),
                  );
                  tocar();
                }}
                placeholder="Nombre (peaje…)"
                aria-label="Nombre del gasto"
              />
              <input
                className={
                  !gasto.nombre.trim() && !gasto.importeTexto.trim()
                    ? "formulario__entrada calculadora__gastoImporte"
                    : `${claseParpadeo(estadoGasto(gasto) === "invalido")} calculadora__gastoImporte`
                }
                value={gasto.importeTexto}
                onChange={(e) => {
                  const valor = e.target.value;
                  setGastos((previos) =>
                    previos.map((g) =>
                      g.clave === gasto.clave ? { ...g, importeTexto: valor } : g,
                    ),
                  );
                  tocar();
                }}
                placeholder="€"
                inputMode="decimal"
                aria-label="Importe del gasto"
              />
              <button
                type="button"
                className="botonSecundario"
                onClick={() => {
                  setGastos((previos) => previos.filter((g) => g.clave !== gasto.clave));
                  tocar();
                }}
                aria-label={`Quitar gasto ${gasto.nombre || ""}`}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}
          <button type="button" className="botonSecundario" onClick={alAnadirGasto}>
            <FontAwesomeIcon icon={faPlus} /> Añadir gasto
          </button>
        </div>
      )}

      {paso === 3 && (
        <div className="formulario">
          {!resultado ? (
            <>
              <p className="textoSuave">Revisa los pasos y pulsa «Calcular viaje».</p>
              <button type="button" className="botonPrincipal" onClick={alCalcular}>
                <FontAwesomeIcon icon={faCalculator} /> Calcular viaje
              </button>
            </>
          ) : (
            <>
              {desactualizado && (
                <p className="aviso">
                  Has cambiado algún dato: pulsa «Recalcular» para actualizar el resultado.
                </p>
              )}
              <article className="calculadora__recibo">
                <p className="calculadora__reciboRuta">{nombreCortoRuta(origen, destino)}</p>
                <p className="textoSuave">
                  {fechaCalculo ? `${formatearFecha(fechaCalculo)} · ` : ""}
                  {idaYVuelta ? "Ida y vuelta" : "Solo ida"} · {distanciaMostrada()} km ·{" "}
                  {pasajerosTotales()} persona{pasajerosTotales() === 1 ? "" : "s"}
                </p>
                {resultado.map((r, i) => (
                  <div key={coches[i]?.clave ?? i} className="calculadora__reciboCoche">
                    {esConvoy && (
                      <p className="calculadora__reciboConductor">
                        <FontAwesomeIcon icon={faCar} />{" "}
                        {(coches[i]?.nombreConductor || `Coche ${i + 1}`).trim()}
                      </p>
                    )}
                    {!esConvoy && coches[0] && (
                      <p className="calculadora__reciboConductor">
                        <FontAwesomeIcon icon={faCar} /> {(coches[0].nombreConductor || "—").trim()}
                      </p>
                    )}
                    {nombreCocheElegido(perfil, coches[i]?.idCoche ?? "") && (
                      <p className="textoSuave">
                        {nombreCocheElegido(perfil, coches[i]?.idCoche ?? "")}
                      </p>
                    )}
                    <p className="calculadora__reciboImporte">
                      {formatearEuros(importeCoche(i, r))}
                    </p>
                    <p className="textoSuave">por persona</p>
                  </div>
                ))}
                <p className="calculadora__reciboLogo">MiConvoy</p>
                <button
                  type="button"
                  className="calculadora__reciboCompartir"
                  onClick={alCompartir}
                  aria-label="Compartir resultado"
                  title="Compartir resultado"
                >
                  <FontAwesomeIcon icon={faShareNodes} />
                </button>
              </article>

              <div className="calculadora__accionesResultado">
                {desactualizado && (
                  <button type="button" className="botonPrincipal" onClick={alCalcular}>
                    <FontAwesomeIcon icon={faCalculator} /> Recalcular
                  </button>
                )}
                {/* <button type="button" className="botonSecundario" onClick={alCopiar}>
                  <FontAwesomeIcon icon={faCopy} /> {copiado ? "¡Copiado!" : "Copiar como texto"}
                </button> */}
              </div>

              <p
                className="calculadora__toggleRedondeo"
                onClick={() => setSinRedondeo((valor) => !valor)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSinRedondeo((valor) => !valor);
                  }
                }}
              >
                {sinRedondeo ? "Añadir propina" : "Quitar propina"}
              </p>

              {!guardado && !desactualizado && !historialActivo && (
                <p className="textoSuave">
                  Historial desactivado: este viaje no se guardará. Actívalo en tu perfil si lo
                  quieres conservar.
                </p>
              )}
              {guardado && !desactualizado && (
                <>
                  <p className="aviso">Viaje finalizado y guardado en tu historial.</p>
                  <button type="button" className="botonSecundario" onClick={alVolverAlInicio}>
                    <FontAwesomeIcon icon={faHouse} /> Volver al inicio
                  </button>
                </>
              )}
              {servidorDisponible && resultado && !desactualizado && (
                <div className="calculadora__online">
                  <hr />
                  <h3 className="tituloSeccion">Viaje online</h3>
                  {!perfil ? (
                    <p className="textoSuave">
                      Crea tu perfil para publicar este viaje y compartirlo por enlace.{" "}
                      <Link href="/perfil">Ir al perfil</Link>
                    </p>
                  ) : publicado ? (
                    <div className="grupoAcciones">
                      <button
                        type="button"
                        className="botonSecundario"
                        onClick={() => void alCopiarEnlaceOnline()}
                      >
                        <FontAwesomeIcon icon={faLink} />{" "}
                        {copiadoEnlace ? "¡Copiado!" : "Copiar enlace"}
                      </button>
                      <Link className="botonPrincipal" href={`/online/${publicado.id}`}>
                        <FontAwesomeIcon icon={faCloudArrowUp} /> Ver viaje online
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="botonSecundario"
                      onClick={() => void alPublicar()}
                      disabled={publicando}
                    >
                      <FontAwesomeIcon icon={faCloudArrowUp} />{" "}
                      {publicando ? "Publicando…" : "Publicar viaje online"}
                    </button>
                  )}
                  <hr />
                </div>
              )}
            </>
          )}
        </div>
      )}

      <nav className="calculadora__navegacion">
        {paso > 0 && !(paso === 3 && resultado) && (
          <button
            type="button"
            className="botonSecundario"
            onClick={() => {
              setPaso((p) => p - 1);
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Atrás
          </button>
        )}
        {paso < 2 && (
          <button type="button" className="botonPrincipal" onClick={alSiguiente}>
            Siguiente <FontAwesomeIcon icon={faArrowRight} />
          </button>
        )}
        {paso === 2 && (
          <button type="button" className="botonPrincipal" onClick={alCalcular}>
            <FontAwesomeIcon icon={faCalculator} /> Calcular viaje
          </button>
        )}
        {paso === 3 && resultado && !guardado && (
          <button
            type="button"
            className="botonSecundario"
            onClick={() => {
              setPaso(0);
            }}
          >
            <FontAwesomeIcon icon={faPen} /> Editar
          </button>
        )}
        {paso === 3 && resultado && !guardado && !desactualizado && historialActivo && (
          <button type="button" className="botonPrincipal" onClick={alFinalizar}>
            <FontAwesomeIcon icon={faFlagCheckered} /> Finalizar viaje
          </button>
        )}
      </nav>
    </section>
  );
}
