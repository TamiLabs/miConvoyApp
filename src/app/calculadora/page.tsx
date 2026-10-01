"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faCalculator,
  faCopy,
  faLocationDot,
  faMinus,
  faPlus,
  faShareNodes,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { adaptadorAlmacenamientoLocal } from "@/storage/almacenamiento";
import {
  anadirEntradaHistorial,
  guardarUltimoViaje,
  limpiarHistorial,
  obtenerHistorial,
  obtenerPerfil,
  obtenerUltimoViaje,
} from "@/storage/datosLocales";
import type {
  CocheDelViajeLocal,
  EntradaHistorial,
  GastoAdicionalLocal,
  PerfilLocal,
} from "@/storage/tiposModoGratis";
import { calcularConvoy, type ResultadoCalculo } from "@/calculadora";
import { interpretarNumero } from "@/components/formularioCoche";

interface CocheForm {
  clave: string;
  nombreConductor: string;
  idCoche: string;
  consumoTexto: string;
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

function formatearEuros(valor: number): string {
  return `${valor.toFixed(2).replace(".", ",")} €`;
}

function crearCocheVacio(conductor = ""): CocheForm {
  return {
    clave: generarClave(),
    nombreConductor: conductor,
    idCoche: "",
    consumoTexto: "",
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
  const [error, setError] = useState<string | null>(null);

  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [distanciaTexto, setDistanciaTexto] = useState("");
  const [precioTexto, setPrecioTexto] = useState("");
  const [idaYVuelta, setIdaYVuelta] = useState(true);
  const [localizando, setLocalizando] = useState(false);

  const [esConvoy, setEsConvoy] = useState(false);
  const [coches, setCoches] = useState<CocheForm[]>([crearCocheVacio()]);
  const [gastos, setGastos] = useState<GastoForm[]>([]);

  const [resultado, setResultado] = useState<ResultadoCalculo[] | null>(null);
  const [desactualizado, setDesactualizado] = useState(false);
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    (async () => {
      const [perfilGuardado, ultimoViaje, historialGuardado] = await Promise.all([
        obtenerPerfil(adaptadorAlmacenamientoLocal),
        obtenerUltimoViaje(adaptadorAlmacenamientoLocal),
        obtenerHistorial(adaptadorAlmacenamientoLocal),
      ]);
      setPerfil(perfilGuardado);
      setHistorial(historialGuardado);
      if (ultimoViaje) {
        setOrigen(ultimoViaje.origen);
        setDestino(ultimoViaje.destino);
        setDistanciaTexto(
          ultimoViaje.distanciaKm === null ? "" : String(ultimoViaje.distanciaKm).replace(".", ","),
        );
        setPrecioTexto(
          ultimoViaje.precioPorLitro === null
            ? ""
            : String(ultimoViaje.precioPorLitro).replace(".", ","),
        );
        setIdaYVuelta(ultimoViaje.idaYVuelta);
        setEsConvoy(ultimoViaje.esConvoy);
        setCoches(
          ultimoViaje.coches.map((coche) => ({
            clave: generarClave(),
            nombreConductor: coche.nombreConductor,
            idCoche: coche.idCoche ?? "",
            consumoTexto: String(coche.consumo).replace(".", ","),
            pasajerosTexto: String(coche.numeroPasajeros + 1),
            incluirConductor: coche.incluirConductorEnReparto,
          })),
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
          },
        ]);
      }
      setCargando(false);
    })();
  }, []);

  const tocar = () => {
    if (resultado) setDesactualizado(true);
    setError(null);
    setCopiado(false);
  };

  const alUsarPosicion = () => {
    if (!("geolocation" in navigator)) {
      setError("Tu navegador no permite usar la geolocalización.");
      return;
    }
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setOrigen(
          `Mi posición (${posicion.coords.latitude.toFixed(5)}, ${posicion.coords.longitude.toFixed(5)})`,
        );
        setLocalizando(false);
        tocar();
      },
      () => {
        setError("No se pudo obtener tu posición. Escríbela a mano.");
        setLocalizando(false);
      },
      { timeout: 10000 },
    );
  };

  const nuevoCocheVacio = (conductor = ""): CocheForm => {
    const primero = perfil?.coches[0];
    return {
      ...crearCocheVacio(conductor),
      idCoche: primero?.id ?? "",
      consumoTexto: primero ? String(primero.consumo).replace(".", ",") : "",
    };
  };

  const alElegirCoche = (clave: string, valor: string) => {
    setCoches((previos) =>
      previos.map((coche) => {
        if (coche.clave !== clave) return coche;
        if (valor === "manual") return { ...coche, idCoche: "" };
        const elegido = perfil?.coches.find((c) => c.id === valor);
        // El consumo queda interno: el usuario solo ve el nombre del coche.
        return {
          ...coche,
          idCoche: valor,
          consumoTexto: elegido ? String(elegido.consumo).replace(".", ",") : coche.consumoTexto,
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

  const validarViaje = (): string | null => {
    if (interpretarNumero(distanciaTexto) === null || (interpretarNumero(distanciaTexto) ?? 0) <= 0)
      return "Escribe la distancia en km (vale con , o .).";
    if (interpretarNumero(precioTexto) === null || (interpretarNumero(precioTexto) ?? 0) <= 0)
      return "Escribe el precio del combustible en €/L.";
    return null;
  };

  const validarCoches = (): string | null => {
    for (let i = 0; i < coches.length; i++) {
      const coche = coches[i];
      const etiqueta = esConvoy ? `Coche ${i + 1}: ` : "";
      if (!coche.nombreConductor.trim()) return `${etiqueta}Falta el nombre del conductor.`;
      const consumo = interpretarNumero(coche.consumoTexto);
      if (consumo === null || consumo <= 0)
        return estaEnPerfil(perfil, coche.idCoche)
          ? `${etiqueta}El coche elegido no tiene un consumo válido. Revísalo en tu perfil.`
          : `${etiqueta}Revisa el consumo (L/100km).`;
      const ocupantes = Number.parseInt(coche.pasajerosTexto, 10);
      if (!Number.isInteger(ocupantes) || ocupantes < 1)
        return `${etiqueta}Escribe cuántas personas van en el coche (mínimo 1).`;
      if (!coche.incluirConductor && ocupantes < 2)
        return `${etiqueta}Si el conductor no paga, tiene que haber al menos 2 ocupantes.`;
    }
    return null;
  };

  const validarGastos = (): string | null => {
    for (const gasto of gastos) {
      const relleno = gasto.nombre.trim() || gasto.importeTexto.trim();
      if (!relleno) continue;
      if (!gasto.nombre.trim()) return "Cada gasto necesita un nombre.";
      const importe = interpretarNumero(gasto.importeTexto);
      if (importe === null || importe <= 0) return `Revisa el importe de "${gasto.nombre.trim()}".`;
    }
    return null;
  };

  const alSiguiente = () => {
    const fallo = paso === 0 ? validarViaje() : paso === 1 ? validarCoches() : validarGastos();
    if (fallo) {
      setError(fallo);
      return;
    }
    setError(null);
    setPaso((p) => Math.min(p + 1, 3));
  };

  const alCalcular = async () => {
    const fallo = validarViaje() ?? validarCoches() ?? validarGastos();
    if (fallo) {
      setError(fallo);
      return;
    }
    const distanciaKm = interpretarNumero(distanciaTexto) ?? 0;
    const precioPorLitro = interpretarNumero(precioTexto) ?? 0;
    const gastosLimpios: GastoAdicionalLocal[] = gastos
      .filter((g) => g.nombre.trim() || g.importeTexto.trim())
      .map((g) => ({ nombre: g.nombre.trim(), importe: interpretarNumero(g.importeTexto) ?? 0 }));

    // El campo pide ocupantes totales (pasajeros + conductor). Con la casilla
    // marcada, el conductor paga su parte y se divide entre N; sin marcar, se
    // le invita y pagan solo los N-1 pasajeros no conductores.
    const aReparto = (
      coche: CocheForm,
    ): { numeroPasajeros: number; incluirConductorEnReparto: boolean } => ({
      numeroPasajeros: Number.parseInt(coche.pasajerosTexto, 10) - 1,
      incluirConductorEnReparto: coche.incluirConductor,
    });

    const entradasCalculo = coches.map((coche) => ({
      consumo: interpretarNumero(coche.consumoTexto) ?? 0,
      distanciaKm,
      precioPorLitro,
      idaYVuelta,
      gastosAdicionales: gastosLimpios.map((g) => ({ ...g, importe: g.importe / coches.length })),
      ...aReparto(coche),
    }));
    const resultados = calcularConvoy(entradasCalculo);
    console.log(
      [
        "[MiConvoy] Cálculo del viaje:",
        `Ruta: ${origen.trim() || "—"} → ${destino.trim() || "—"}`,
        `Distancia: ${distanciaKm} km${idaYVuelta ? " x2 (ida y vuelta)" : ""} · Precio: ${precioPorLitro} €/L`,
        ...resultados.map((r, i) => {
          const coche = coches[i];
          const entrada = entradasCalculo[i];
          const ocupantes = Number.parseInt(coche.pasajerosTexto, 10);
          const pagan = entrada.incluirConductorEnReparto ? ocupantes : ocupantes - 1;
          const detalle = entrada.incluirConductorEnReparto
            ? `${ocupantes - 1} pasajeros + conductor (reparto entre ${ocupantes})`
            : `${pagan} pasajeros pagan todo (conductor invitado)`;
          const bruto = r.costeTotal / pagan;
          return [
            `Coche ${i + 1} (${coche.nombreConductor.trim() || "—"}):`,
            `  consumo=${entrada.consumo} L/100km → combustible=${formatearEuros(r.costeCombustible)} + gastos=${formatearEuros(r.costeTotal - r.costeCombustible)} = total ${formatearEuros(r.costeTotal)}`,
            `  reparto entre ${ocupantes} (${detalle}) → bruto ${formatearEuros(bruto)} → redondeo ${formatearEuros(r.costePorPersona)} por persona`,
          ].join("\n");
        }),
      ].join("\n"),
    );
    setResultado(resultados);
    setDesactualizado(false);
    setError(null);
    setPaso(3);

    await guardarUltimoViaje(adaptadorAlmacenamientoLocal, {
      origen: origen.trim(),
      destino: destino.trim(),
      distanciaKm,
      precioPorLitro,
      idaYVuelta,
      esConvoy,
      coches: coches.map((coche) => ({
        nombreConductor: coche.nombreConductor.trim(),
        idCoche: coche.idCoche || undefined,
        consumo: interpretarNumero(coche.consumoTexto) ?? 0,
        ...aReparto(coche),
      })),
      gastosAdicionales: gastosLimpios,
    });

    const total = resultados.reduce((suma, r) => suma + r.costeTotal, 0);
    const totalParticipantes = coches.reduce(
      (suma, c) => suma + Number.parseInt(c.pasajerosTexto, 10) - (c.incluirConductor ? 0 : 1),
      0,
    );
    const media = Math.ceil(total / Math.max(totalParticipantes, 1) / 0.5) * 0.5;
    const entrada: EntradaHistorial = {
      id: generarClave(),
      fecha: new Date().toISOString(),
      esConvoy,
      idaYVuelta,
      origen: origen.trim() || undefined,
      destino: destino.trim() || undefined,
      distanciaKm,
      precioCombustible: precioPorLitro,
      coches: coches.map((coche): CocheDelViajeLocal => ({
        nombreConductor: coche.nombreConductor.trim(),
        idCoche: coche.idCoche || undefined,
        ...aReparto(coche),
      })),
      gastosAdicionales: gastosLimpios,
      resultado: { costeTotal: total, costePorPersona: media },
      detallePorCoche: resultados.map((r) => ({
        costeTotal: r.costeTotal,
        costePorPersona: r.costePorPersona,
      })),
    };
    await anadirEntradaHistorial(adaptadorAlmacenamientoLocal, entrada);
    setHistorial(await obtenerHistorial(adaptadorAlmacenamientoLocal));
  };

  const textoParaCompartir = (): string => {
    if (!resultado) return "";
    const ruta = [origen.trim(), destino.trim()].filter(Boolean).join(" → ") || "Viaje";
    const lineas = [
      `MiConvoy: ${ruta}`,
      `${idaYVuelta ? "Ida y vuelta" : "Solo ida"} · ${distanciaTexto} km`,
      ...resultado.map((r, i) => {
        const coche = coches[i];
        const ocupantes = Number.parseInt(coche.pasajerosTexto, 10);
        const detalle = coche.incluirConductor
          ? `${ocupantes - 1} pasajeros + conductor`
          : `${ocupantes - 1} pasajeros (conductor invitado)`;
        return `${esConvoy ? `Coche ${i + 1} (${coche.nombreConductor.trim()}): ` : ""}cada uno paga ${formatearEuros(r.costePorPersona)} (${detalle}, total ${formatearEuros(r.costeTotal)})`;
      }),
    ];
    return lineas.join("\n");
  };

  const alCopiar = async () => {
    const texto = textoParaCompartir();
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      const area = document.createElement("textarea");
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
      setCopiado(true);
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
      setError("Tu navegador no permite compartir directamente: el texto se ha copiado.");
    }
  };

  const alVaciarHistorial = async () => {
    if (!window.confirm("¿Vaciar todo el historial de este dispositivo?")) return;
    await limpiarHistorial(adaptadorAlmacenamientoLocal);
    setHistorial([]);
  };

  if (cargando) return <p className="paginaCalculadora textoSuave">Cargando calculadora…</p>;

  const totalResultado = resultado?.reduce((suma, r) => suma + r.costeTotal, 0) ?? 0;

  return (
    <section className="paginaCalculadora">
      <ol className="calculadora__pasos" aria-label="Progreso">
        {TITULOS_PASOS.map((titulo, i) => (
          <li
            key={titulo}
            className={
              i === paso
                ? "calculadora__paso calculadora__paso--activo"
                : i < paso
                  ? "calculadora__paso calculadora__paso--hecho"
                  : "calculadora__paso"
            }
          >
            <span className="calculadora__pasoNumero">{i + 1}</span> {titulo}
          </li>
        ))}
      </ol>

      {error ? <p className="formulario__error">{error}</p> : null}

      {paso === 0 && (
        <div className="formulario">
          <label className="formulario__campo">
            <span className="formulario__etiqueta">Origen</span>
            <div className="calculadora__conBoton">
              <input
                className="formulario__entrada"
                value={origen}
                onChange={(e) => {
                  setOrigen(e.target.value);
                  tocar();
                }}
                placeholder="¿Desde dónde salís?"
              />
              <button
                type="button"
                className="formulario__botonSecundario"
                onClick={alUsarPosicion}
                disabled={localizando}
                aria-label="Usar mi posición actual"
              >
                <FontAwesomeIcon icon={faLocationDot} />
              </button>
            </div>
          </label>
          <label className="formulario__campo">
            <span className="formulario__etiqueta">Destino</span>
            <input
              className="formulario__entrada"
              value={destino}
              onChange={(e) => {
                setDestino(e.target.value);
                tocar();
              }}
              placeholder="¿A dónde vais?"
            />
          </label>
          <label className="formulario__campo">
            <span className="formulario__etiqueta">Distancia (km)</span>
            <input
              className="formulario__entrada"
              value={distanciaTexto}
              onChange={(e) => {
                setDistanciaTexto(e.target.value);
                tocar();
              }}
              placeholder="p. ej. 120 o 120,5"
              inputMode="decimal"
            />
          </label>
          <p className="textoSuave">
            De momento la distancia se escribe a mano. El cálculo automático con OpenRouteService
            está pendiente.
          </p>
          <label className="formulario__campo">
            <span className="formulario__etiqueta">Precio combustible (€/L)</span>
            <input
              className="formulario__entrada"
              value={precioTexto}
              onChange={(e) => {
                setPrecioTexto(e.target.value);
                tocar();
              }}
              placeholder="p. ej. 1,65"
              inputMode="decimal"
            />
          </label>
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
                  className="formulario__botonSecundario"
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
                  className="formulario__botonSecundario"
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
              {esConvoy && <h3 className="paginaPerfil__subtitulo">Coche {i + 1}</h3>}
              <label className="formulario__campo">
                <span className="formulario__etiqueta">Nombre del conductor</span>
                <input
                  className="formulario__entrada"
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
              <div className="calculadora__fila">
                {!estaEnPerfil(perfil, coche.idCoche) && (
                  <label className="formulario__campo">
                    <span className="formulario__etiqueta">Consumo (L/100km)</span>
                    <input
                      className="formulario__entrada"
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
                )}
                <label
                  className="formulario__campo"
                  style={estaEnPerfil(perfil, coche.idCoche) ? { gridColumn: "1 / -1" } : undefined}
                >
                  <span className="formulario__etiqueta">Nº ocupantes (incluido el conductor)</span>
                  <input
                    className="formulario__entrada"
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
                  />
                  {Number.parseInt(coche.pasajerosTexto, 10) >= 1 && (
                    <span className="textoSuave">
                      {coche.incluirConductor
                        ? `Se divide entre ${coche.pasajerosTexto} (todos pagan)`
                        : `Se divide entre ${Number.parseInt(coche.pasajerosTexto, 10) - 1} (el conductor va invitado)`}
                    </span>
                  )}
                </label>
              </div>
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
                className="formulario__entrada"
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
                className="formulario__entrada calculadora__gastoImporte"
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
                className="formulario__botonSecundario"
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
          <button type="button" className="formulario__botonSecundario" onClick={alAnadirGasto}>
            <FontAwesomeIcon icon={faPlus} /> Añadir gasto
          </button>
        </div>
      )}

      {paso === 3 && (
        <div className="formulario">
          {!resultado ? (
            <>
              <p className="textoSuave">Revisa los pasos y pulsa «Calcular viaje».</p>
              <button type="button" className="formulario__botonPrincipal" onClick={alCalcular}>
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
                <p className="calculadora__reciboRuta">
                  {[origen.trim(), destino.trim()].filter(Boolean).join(" → ") || "Viaje"}
                </p>
                <p className="textoSuave">
                  {new Date().toLocaleDateString("es-ES")} ·{" "}
                  {idaYVuelta ? "Ida y vuelta" : "Solo ida"} · {distanciaTexto} km
                </p>
                {resultado.map((r, i) => (
                  <div key={coches[i]?.clave ?? i} className="calculadora__reciboCoche">
                    {esConvoy && (
                      <p className="calculadora__reciboConductor">
                        {(coches[i]?.nombreConductor || `Coche ${i + 1}`).trim()}
                      </p>
                    )}
                    {!esConvoy && coches[0] && (
                      <p className="calculadora__reciboConductor">
                        Conduce {(coches[0].nombreConductor || "—").trim()}
                      </p>
                    )}
                    {nombreCocheElegido(perfil, coches[i]?.idCoche ?? "") && (
                      <p className="textoSuave">
                        {nombreCocheElegido(perfil, coches[i]?.idCoche ?? "")}
                      </p>
                    )}
                    <p className="calculadora__reciboImporte">
                      {formatearEuros(r.costePorPersona)}
                    </p>
                    <p className="textoSuave">por persona</p>
                    {/* <p className="calculadora__reciboTotal textoSuave">
                      {coches[i]?.incluirConductor
                        ? `Reparto entre ${coches[i]?.pasajerosTexto}`
                        : `Reparto entre ${Number.parseInt(coches[i]?.pasajerosTexto ?? "0", 10) - 1} (conductor invitado)`}
                    </p> */}
                  </div>
                ))}
                <p className="calculadora__reciboLogo">MiConvoy</p>
              </article>
              <div className="calculadora__accionesResultado">
                {desactualizado && (
                  <button type="button" className="formulario__botonPrincipal" onClick={alCalcular}>
                    <FontAwesomeIcon icon={faCalculator} /> Recalcular
                  </button>
                )}
                <button type="button" className="formulario__botonSecundario" onClick={alCopiar}>
                  <FontAwesomeIcon icon={faCopy} /> {copiado ? "¡Copiado!" : "Copiar como texto"}
                </button>
                <button type="button" className="formulario__botonSecundario" onClick={alCompartir}>
                  <FontAwesomeIcon icon={faShareNodes} /> Compartir
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <nav className="calculadora__navegacion">
        {paso > 0 && (
          <button
            type="button"
            className="formulario__botonSecundario"
            onClick={() => {
              setPaso((p) => p - 1);
              setError(null);
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Atrás
          </button>
        )}
        {paso < 2 && (
          <button type="button" className="formulario__botonPrincipal" onClick={alSiguiente}>
            Siguiente <FontAwesomeIcon icon={faArrowRight} />
          </button>
        )}
        {paso === 2 && (
          <button type="button" className="formulario__botonPrincipal" onClick={alCalcular}>
            <FontAwesomeIcon icon={faCalculator} /> Calcular viaje
          </button>
        )}
        {paso === 3 && resultado && (
          <button
            type="button"
            className="formulario__botonSecundario"
            onClick={() => {
              setPaso(0);
              setError(null);
            }}
          >
            Editar datos
          </button>
        )}
      </nav>

      <div className="calculadora__historial">
        <div className="paginaPerfil__cochesCabecera">
          <h3 className="paginaPerfil__subtitulo">Historial ({historial.length}/10)</h3>
          {historial.length > 0 && (
            <button
              type="button"
              className="paginaPerfil__botonEliminar"
              onClick={alVaciarHistorial}
            >
              Vaciar
            </button>
          )}
        </div>
        {historial.length === 0 ? (
          <p className="textoSuave">Aún no hay viajes calculados en este dispositivo.</p>
        ) : (
          <div className="calculadora__historialLista">
            {historial.map((entrada) => (
              <article key={entrada.id} className="calculadora__historialItem">
                <p className="calculadora__historialRuta">
                  {[entrada.origen, entrada.destino].filter(Boolean).join(" → ") || "Viaje"}
                </p>
                <p className="textoSuave">
                  {new Date(entrada.fecha).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {entrada.esConvoy ? " · convoy" : ""} ·{" "}
                  {entrada.idaYVuelta ? "ida y vuelta" : "solo ida"}
                </p>
                <p>Total: {formatearEuros(entrada.resultado.costeTotal)}</p>
              </article>
            ))}
          </div>
        )}
        <p className="textoSuave">
          Se guarda solo en este dispositivo: si borras la caché, se pierde.
        </p>
      </div>
    </section>
  );
}
