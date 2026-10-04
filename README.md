# MiConvoy — Documentación técnica y funcional

> Documento vivo. Recoge todas las decisiones tomadas hasta ahora sobre la app.

## 1. Visión general

MiConvoy es una aplicación para organizar viajes en coche de grupos de amigos: quién va en cada coche, cuántos kilómetros y combustible supone el trayecto, y cómo se reparte el gasto entre los participantes.

La app funciona en **dos modos**:

- **Modo Free** — sin servidor propio desplegado. Cálculo puntual de un caso concreto (un trayecto con X participantes). Es el modo principal y el primero en desarrollarse.
- **Modo Online** — con servidor, base de datos y tiempo real, para viajes compartidos entre varios usuarios. Se activará más adelante, cuando se pague un servidor.

Ambos modos viven en la **misma aplicación**: si el servidor no está activo o no hay conexión, el apartado "online" se muestra simplemente como no disponible, en lugar de existir como una app separada.

> Nota de terminología: al modo individual se le llamó inicialmente "modo offline", pero no es estrictamente así — necesita conexión para llamar a la API externa de cálculo de distancia. Por eso se renombró a **Modo Free** (sin servidor propio, pero con conexión a internet).

### Hoja de ruta de escalado (3 etapas)

1. **Web simple** — Modo Free actual, sin backend, desplegada en Netlify.
2. **Web + servidor + BBDD** — se activa el Modo Online (backend, base de datos, tiempo real).
3. **App real (nativa, vía Capacitor)** — con servidor + Modo Free integrado como calculadora local.

## 2. Stack tecnológico

- **Base**: Next.js 14, React 18, TypeScript, Prisma 5 + MySQL, SCSS propio (sin Tailwind), Leaflet + OpenStreetMap, Font Awesome, Google Identity Services (`@react-oauth/google`).
- **Pendiente de incorporar**: NextAuth (cuentas online), tRPC (routers de servidor), Zod (validación) e `html-to-image` (compartir como PNG).
- **Empaquetado**: PWA instalable desde el navegador (Android e iOS) — pendiente (sin manifest ni Service Worker todavía).
- **Portabilidad futura**: el código debe poder reutilizarse con **Capacitor** si en el futuro se convierte en app nativa. El adaptador de storage y la geolocalización estándar ya lo tienen en cuenta.
- **Despliegue inicial**: Modo Free alojado en Netlify (o similar), accesible públicamente para cualquier persona — pendiente.

## 3. Arquitectura

Estructura simple en `src/` (se descartó el monorepo `apps/packages`: no compensa para este tamaño):

```
src/
  app/            → Next.js: páginas (calculadora, perfil, online) + API (salud, sincronizar, geocode, ruta)
  components/     → UI reutilizable (incl. `perfil/`: misCoches, historialPerfil, cuentaPerfil, ...)
  calculadora.ts  → lógica pura de cálculo (compartida entre ambos modos)
  storage/        → tipos locales + adaptador de persistencia
  mapas/          → cliente de OpenRouteService (vía proxy propio)
  db.ts           → punto único de conexión Prisma (solo cambia DATABASE_URL)
```

La pieza clave es `src/calculadora.ts`: funciones puras en TypeScript, sin dependencias de red ni de base de datos, que se ejecutan en el cliente (Modo Free) y se reutilizarán desde el servidor (Modo Online).

La persistencia local queda detrás de un adaptador propio (`obtener`/`guardar`/`limpiar` en `src/storage/almacenamiento.ts`) en vez de llamar a `localStorage` directamente desde los componentes, de forma que cambiar de tecnología de almacenamiento en el futuro no obligue a tocar el resto de la app.

## 4. Modo Free — Flujo y funcionalidades

### Flujo de uso

- Pantalla por pasos (Viaje → Coches → Gastos → Resultado), clicables para navegar; al avanzar, cada paso valida sus campos (los que faltan parpadean 2 s).
- El usuario elige origen y destino con autocompletado, o usa la geolocalización actual, y ve el mini-mapa con la ruta. Los km se calculan solos; si falla, se escriben a mano.
- Se reutilizan automáticamente los datos del último viaje calculado (origen, destino, distancia, coches, gastos…).
- El resultado no se guarda solo: hay botón de **"Recalcular"** si se edita algo tras calcular, y de **"Finalizar viaje"** para guardarlo en el historial.
- Crear un viaje en Modo Free **no requiere cuenta**. Si el usuario no tiene perfil (o no tiene coches), introduce consumo y precio a mano en cada viaje.

### Coches y convoy

- Por defecto, el cálculo es para **un solo coche**.
- Existe una opción **"¿Es convoy?"** para calcular varios coches a la vez: stepper −/+ (1–6) y, por cada uno, una tarjeta con nombre del conductor, coche a usar (desplegable u "otro coche"), nº de ocupantes y si el conductor paga su parte.
- Un "convoy" no es una entidad distinta: es simplemente un viaje con más de un coche.
- Al elegir un coche del perfil, su consumo y precio quedan internos (no se muestran); el nº de ocupantes no puede superar sus plazas.
- Cada coche puede tener distinto precio de combustible (cada uno reposta donde quiere).

### Ida y vuelta

- Casilla "¿Trayecto de ida y vuelta?", **marcada por defecto**.
- Si está marcada, el resultado se multiplica **x2 antes del redondeo**.
- Si se desmarca, solo se calcula la ida.

### Gastos adicionales

- Apartado justo antes del botón "Calcular viaje", donde se pueden añadir gastos sueltos (peajes, aparcamiento, etc.) indicando nombre e importe de cada uno.
- Estos importes se suman al coste del combustible antes de repartir entre los pasajeros y aplicar el redondeo final.

### Cálculo de distancia

- La distancia se calcula con **OpenRouteService** (`driving-car/geojson`): al elegir origen y destino de las sugerencias, los km se rellenan solos y se dibuja la ruta en el mapa.
- Las llamadas van por proxy propio (`/api/geocode`, `/api/ruta`) para evitar el CORS y no exponer la key en el navegador.
- El plan gratuito de ORS tiene cuota diaria y puede fallar: ante un fallo, la app avisa una vez y deja de intentarlo en la sesión.
- El campo manual de km es siempre la alternativa: el cálculo nunca queda bloqueado.

### Resultado final

- Tarjeta tipo "recibo" (vertical, para captura en móvil): ruta, fecha, ida/vuelta, km (x2 si ida y vuelta), nº de personas y, por coche, conductor, coche e importe por persona, con el nombre de MiConvoy al pie. Se puede quitar la propina para ver el bruto exacto.
- Botón de compartir con la **Web Share API** (`navigator.share`) y el mismo texto del ticket (el "copiar como texto" está pausado de momento).
- Pendiente: generar PNG con `html-to-image`.

## 5. Fórmula de cálculo

```
costePorKm = (consumo / 100) * precioPorLitro   // consumo en L/100km, precioPorLitro en €/L (por coche)
costeCombustible = distanciaKm * costePorKm
costeCombustible = costeCombustible * 2                 // si "ida y vuelta" está marcado

gastosAdicionales = suma de los importes introducidos (en convoy, a partes iguales por coche)
costeTotal = costeCombustible + gastosAdicionales

nParticipantes = ocupantes totales (N) si el conductor paga su parte;
                 N-1 si va invitado (solo pagan los pasajeros no conductores)

precioFinal = Math.ceil(costePorPersona / 0.5) * 0.5
// Propina para el conductor: redondeo al alza en grupos de 0,50 €.
// Se puede quitar en el recibo para ver el bruto exacto.
// Ejemplos: 3,7 € → 4 €   |   3,2 € → 3,5 €
```

> ⚠️ Corrección respecto a una versión anterior de este documento: la fórmula estaba escrita como `km * (precioCombustible / km)`, que matemáticamente se anula y deja fuera el consumo del coche. La versión correcta usa el **consumo** (L/100km, del perfil del coche) junto con el **precio por litro** para calcular el coste por kilómetro — así el campo de consumo que se guarda al dar de alta un coche sí interviene en el cálculo, como estaba previsto.
>
> Un **convoy** se calcula coche por coche: cada uno con su propio consumo, precio y pasajeros, no como un único reparto conjunto.
>
> El historial guarda el **resultado ya calculado**, no solo los datos de entrada. Si en el futuro cambia la fórmula, los cálculos antiguos no se recalculan ni cambian: reflejan lo que se calculó en su momento.

## 6. Perfiles y persistencia local

### Mini-perfil de persona

- Nombre y correo (Gmail), con login real de Google o formulario local.
- Si tiene coche o no.
- Si tiene coche: marca, modelo, matrícula, consumo, precio del combustible, tipo (diésel/gasolina/eléctrico) y plazas. Si dos personas comparten un mismo coche físico, cada una lo da de alta en su propio perfil (se duplica el registro, no se comparte una única referencia).
- Se guarda en el navegador (almacenamiento local del dispositivo). La página de perfil tiene apartados de Coches, Historial y Cuenta (con sincronización y librerías).

### Historial de cálculos

- Guarda el resultado completo (con desglose por coche) solo al pulsar **"Finalizar viaje"**; calcular sin finalizar no guarda nada.
- Se puede activar/desactivar desde el perfil; vive en su apartado, con su lista y botón de vaciado.
- **Límite**: máximo 10 viajes guardados para empezar (ajustable más adelante); al superar el límite se descarta el más antiguo.
- **Enfoque técnico**: `localStorage` con claves `miconvoy_historial`, `miconvoy_historial_activo`, `miconvoy_historial_subido`, etc. Con un máximo de 10 registros, `localStorage` es más que suficiente — no hace falta IndexedDB ni SQLite para este volumen, ni siquiera en la futura app nativa.
- Debe mostrarse un aviso claro (no necesariamente un banner de cookies intrusivo) de que, si se borra la caché o los datos de navegación, esta información se perderá.
- Los datos locales son siempre la fuente utilizable, esté o no el servidor activo. La sincronización con el servidor es una acción manual, nunca automática en segundo plano.

## 7. Autenticación y cuentas

- **Identificador único**: el correo (Gmail) se usa como clave primaria tanto en local como en servidor (`upsert` por email), para poder enlazar el perfil local con la cuenta del servidor sin conflictos.
- **Login**: Google Identity Services real desde el Modo Free (resuelto en cliente, sin servidor) + formulario local de gmail + nombre como alternativa. La decisión de usar Google real quedó confirmada.
- **Contraseña provisional**: se puede crear en el perfil (mínimo 8, con medidor de fuerza); se guarda en hash SHA-256 solo en el dispositivo y se sube al campo `password` al sincronizar. El registro real con servidor queda para NextAuth.
- **Sincronización**: el apartado Sincronización compara contra el servidor (usuario, coches por matrícula, viajes por id de cliente) y el botón se activa solo si hay diferencias; si no, queda desactivado. Sube perfil + viajes pendientes sin duplicar; los coches borrados en local se borran en servidor (los viajes, nunca).
- **Crear un viaje** en Modo Free no requiere cuenta. En Modo Online, sí hará falta cuenta para crear un convoy con enlace de invitación (para poder identificar quién es quién).

## 8. Modo Online (futuro, al activar el servidor)

### Funcionalidades

- El organizador de un viaje crea el viaje y comparte un **enlace** con los pasajeros.
- Al entrar al enlace, cada persona se identifica: elige su nombre entre los pasajeros ya creados por el conductor, o crea uno nuevo (**límite de 5 pasajeros por coche**).
- Se pueden añadir **varios coches a un mismo viaje** (convoy), y cada coche puede a su vez invitar a más gente.
- Con el servidor activo, un pasajero (identificado por su gmail) solo puede estar en **un coche a la vez** dentro de un viaje/convoy.
- **Mapa en tiempo real**: se puede ver en un mapa la posición de cada coche del convoy, mediante la geolocalización del conductor o, en su defecto, de algún pasajero que la tenga activada. Si nadie la tiene activada, ese coche se muestra sin conexión.
- La geolocalización debe poder **detenerse manualmente** para no consumir recursos — prioridad explícita: ser lo menos invasivo posible.

### Notificaciones (confirmadas)

- Aviso de llegada a destino: si la geolocalización de un vehículo detecta que ha llegado (margen de unos metros) y pasan varios minutos (ej. 5) sin que el usuario haya parado la ubicación, se envía una notificación de "Has llegado, pulsa para dejar de usar la ubicación".
  - ⚠️ Nota técnica: en iOS, Safari suspende la geolocalización en segundo plano en cuanto la PWA deja de estar en primer plano, por lo que esta notificación **no es fiable en iOS como PWA**. Solo será totalmente fiable si en el futuro se pasa a app nativa vía Capacitor, con un plugin de geofencing nativo.
- Aviso de "hora de salir", si el viaje tiene hora programada y duración estimada.
- Aviso cuando otro coche del convoy llega a destino, para coordinar al resto.
- Recordatorio para detener la geolocalización si lleva mucho tiempo activa sin llegar a destino.
- Aviso de actualización de la app disponible (Modo Free y Online), vía Service Worker.

**Descartado explícitamente**: aviso si un coche se desvía notablemente de la ruta prevista.

### Requisitos técnicos del servidor

- Base de datos: MySQL gestionado (Railway, Aiven, PlanetScale…) — proveedor final todavía por elegir.
- Autenticación: NextAuth.js (con Google como proveedor preferente).
- Tiempo real: dado que Vercel no soporta WebSockets persistentes en funciones serverless, las opciones son:
  - **Pusher / Ably** (gestionados, integración rápida, pago por uso) — recomendado para velocidad de desarrollo.
  - **Supabase Realtime** (si se usa Supabase como base de datos).
  - **Socket.io autoalojado**, con un servidor Node dedicado en Railway/Fly.io/Render (más control, más mantenimiento).
- Validación de datos con Zod.

## 9. Mapas y geolocalización (con vista a Capacitor)

| Necesidad                             | Recomendación                                                  | Motivo                                                                              |
| ------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Geolocalización (web/PWA)             | `navigator.geolocation`                                        | API estándar del navegador                                                          |
| Geolocalización (nativo, futuro)      | `@capacitor/geolocation`                                       | Misma interfaz, sin reescribir lógica                                               |
| Tracking en segundo plano (nativo)    | Plugin de la comunidad tipo `capacitor-background-geolocation` | El plugin oficial no cubre background tracking fiable                               |
| Mapa del convoy                       | Leaflet + OpenStreetMap, o MapLibre GL JS                      | Gratuitos, sin cuota de facturación, funcionan igual en WebView de Capacitor        |
| Cálculo de distancia/ruta (Modo Free) | OpenRouteService                                               | API key gratuita, cuota diaria generosa; evita los costes de Google Distance Matrix |

Las llamadas a ORS van por proxy propio (`/api/geocode`, `/api/ruta`) para evitar el CORS y no exponer la key. El plan gratuito tiene cuota: ante un fallo, la app avisa una vez y sigue en manual.

## 10. Disponibilidad del servidor (on/off)

La app funciona igual de bien tanto si el servidor está desplegado como si no:

- Una única variable lo decide todo: `SERVER_ON=true/false` en `.env`. Para el despliegue inicial se deja en `false`. El cliente nunca la lee directamente: pregunta a `GET /api/salud`.
- El endpoint combina la variable con un ping a la BBDD: si el servidor está marcado como activo pero no responde, la app degrada igualmente a Modo Free sin errores (hook `useEstadoServidor`, usado en `/online` y en Cuenta).
- Los datos locales siguen siendo siempre la fuente utilizable; cuando el servidor está disponible, el apartado Sincronización sube/actualiza el perfil e historial contra el servidor.

## 11. Desarrollo local: Docker y base de datos

- El esquema de la base de datos se define en ficheros dentro del propio repositorio (el `schema.prisma` de Prisma cumple exactamente esta función: es el fichero que describe toda la estructura de la BBDD).
- Para desarrollo, un `docker-compose.yml` levanta un contenedor local de MySQL. Al ejecutarlo junto con `prisma migrate dev`, se crea la base de datos local a partir del esquema y se generan ficheros de migración.
- Esos mismos ficheros de migración son los que después se aplican contra la base de datos del servidor real (`prisma migrate deploy`), cambiando solo la variable de conexión (`DATABASE_URL`) — no hace falta mantener dos definiciones distintas de la BBDD.

## 12. Distribución y actualizaciones

- Primera versión pública: **Modo Free** alojado en Netlify (o similar), accesible para cualquier usuario sin registro.
- Vista **100% orientada a móvil**, pero responsive para verse bien en cualquier pantalla.
- Instalación como **PWA** desde el propio navegador, para que tanto usuarios de Android como de iOS puedan instalarla.
- Actualizaciones: idealmente automáticas y transparentes para el usuario; si no es posible, avisar al entrar de que hay una actualización disponible, con un botón para descargarla.
- Publicación en App Store / Google Play: no es una decisión necesaria por ahora. Capacitor permite compilar para ambas plataformas sin tener que decidir de antemano. Único punto a tener en cuenta más adelante: Apple revisa con más rigor el uso de geolocalización en segundo plano, así que conviene justificarlo bien en el formulario de publicación cuando llegue el momento.

## 13. Modelo de datos (esquema)

- **`src/calculadora.ts`**: función pura `calcularCoche` con la fórmula de la sección 5, sin dependencias de Next.js, Prisma ni `localStorage`. Se importa desde el cliente (Modo Free) y se reutilizará desde el servidor (Modo Online). Un convoy es `calcularConvoy`, que llama a `calcularCoche` una vez por cada coche.

- **Autenticación**: Google Identity Services (login real de Google) desde el principio en Modo Free; NextAuth + proveedor Google pendiente para el Modo Online. El correo es el identificador natural que enlaza el perfil local con la cuenta del servidor.
- **Modo Free** (sin base de datos, todo en `localStorage`): tipos en `src/storage/tiposModoGratis.ts` — `PerfilLocal` (con `tieneCoche`), `CocheLocal` (consumo, precio, tipo, plazas), `EntradaHistorial` (con resultado + `detallePorCoche` como snapshot inmutable, más `origen`/`destino`).
- **Modo Online** (con base de datos): esquema en `schema.prisma` — `User`/`Account`/`Session` (+ `password` provisional), `Coche` (con precio, tipo, plazas), `Viaje` (con `modoOrigen`, `origenClienteId` único), `CocheDelViaje`, `Pasajero`, `GastoAdicional`.
- La sincronización (`POST /api/sincronizar`, con comparación previa en `POST /api/estado-sincronizacion`) mapea:
  - `PerfilLocal` → `User` (upsert por email, con hash a `password`)
  - `CocheLocal` → `Coche` (emparejado por matrícula; borra los eliminados en local)
  - `EntradaHistorial` → `Viaje` (con `modoOrigen: "gratis"` y `origenClienteId` para no duplicar)
- El campo `resultado` de `Viaje` (tipo `Json`) guarda el cálculo ya hecho: si la fórmula cambia en el futuro, estos registros no se recalculan.
- La restricción de "un pasajero solo en un coche a la vez" se implementa como índice único `(viajeId, personaId)` en `Pasajero`. El límite de 5 pasajeros por coche se valida en la lógica de negocio, no en el esquema (en Modo Free el tope lo marcan las plazas del coche).

## 14. Pendiente / próximos pasos

- [ ] Elegir proveedor definitivo de base de datos gestionada, tiempo real y hosting del servidor.
- [ ] NextAuth con Google + routers tRPC que reutilicen `calculadora.ts` (issues 8.2 y 8.3).
- [ ] Funcionalidades online: crear viaje con enlace, unirse, mapa en tiempo real (issues 5.2–5.6).
- [ ] Compartir el recibo como PNG + PWA instalable (issues 2.14 y 10.2).
