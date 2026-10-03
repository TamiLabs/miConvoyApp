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

- **T3 Stack**: Next.js, TypeScript, tRPC, Prisma, NextAuth, Tailwind CSS, Zod.
- **Empaquetado**: PWA instalable desde el navegador (Android e iOS).
- **Portabilidad futura**: el código debe poder reutilizarse con **Capacitor** si en el futuro se convierte en app nativa. Se integrará desde ya, aunque no se publique nada todavía, para detectar pronto cualquier incompatibilidad.
- **Despliegue inicial**: Modo Free alojado en Netlify (o similar), accesible públicamente para cualquier persona.

## 3. Arquitectura recomendada

Para compartir código entre el Modo Free y el Modo Online sin duplicar lógica, se recomienda una estructura de monorepo (p. ej. con `create-t3-turbo`):

```
apps/
  web/            → Next.js: Modo Online completo (BD, tRPC, auth) + Modo Free
  desktop/        → (futuro) wrapper Capacitor de la misma UI
packages/
  calculator/     → lógica pura de cálculo del viaje (compartida entre ambos modos)
  ui/             → componentes de interfaz reutilizados
  db/             → esquema Prisma (solo usado en Modo Online)
```

La pieza clave es `packages/calculator`: funciones puras en TypeScript, sin dependencias de red ni de base de datos, que se ejecutan:

- En el cliente, sin conexión al servidor, para el Modo Free.
- Dentro de un router de tRPC, para el Modo Online.

La persistencia local debe quedar detrás de un pequeño adaptador propio (`storage.get/set/clear`) en vez de llamar a `localStorage` directamente desde los componentes, de forma que cambiar de tecnología de almacenamiento en el futuro no obligue a tocar el resto de la app.

## 4. Modo Free — Flujo y funcionalidades

### Flujo de uso

- Pantalla por pasos hasta llegar al resultado, con navegación mediante flechas (atrás / adelante).
- El usuario elige destino y posición de partida (usando la geolocalización actual del dispositivo) para calcular los km del trayecto.
- Se reutilizan automáticamente los datos de la última vez que se rellenó el formulario: quién conduce, pasajeros, coche y precio del combustible.
- Antes del resultado final se muestra un **resumen editable** de los datos introducidos (formato de lista, pero no un `<ul>`). Si se edita algún dato, aparece un botón de **"Recalcular"**.
- Crear un viaje en Modo Free **no requiere cuenta**. Si el usuario no tiene un perfil guardado, se le piden manualmente los campos que normalmente se autocompletarían desde el perfil (coche, consumo, etc.).

### Coches y convoy

- Por defecto, el cálculo es para **un solo coche**.
- Existe una opción **"¿Es convoy?"** para calcular varios coches a la vez: se elige el número de coches y, por cada uno, se añade una tarjeta con un input para el nombre del conductor y el número de pasajeros de ese coche.
- Un "convoy" no es una entidad distinta: es simplemente un viaje con más de un coche.
- El consumo de cada coche se obtiene de los datos introducidos al **dar de alta el coche** en el perfil.

### Ida y vuelta

- Casilla "¿Trayecto de ida y vuelta?", **marcada por defecto**.
- Si está marcada, el resultado se multiplica **x2 antes del redondeo**.
- Si se desmarca, solo se calcula la ida.

### Gastos adicionales

- Apartado justo antes del botón "Calcular viaje", donde se pueden añadir gastos sueltos (peajes, aparcamiento, etc.) indicando nombre e importe de cada uno.
- Estos importes se suman al coste del combustible antes de repartir entre los pasajeros y aplicar el redondeo final.

### Cálculo de distancia

- La distancia se calcula mediante una **API externa** (ver recomendación técnica en sección 9): OpenRouteService.
- Esto implica que el Modo Free **no es 100% sin conexión** — necesita internet para este paso.
- **Recomendación**: incluir un campo de introducción manual de km como alternativa, para que el cálculo nunca quede bloqueado si falla la llamada a la API por falta de conexión.

### Resultado final

- Debe ser **vistoso y claro**, pensado para hacerle una captura de pantalla y compartirlo por WhatsApp: cada pasajero debe poder ver de un vistazo cuánto le debe pagar al conductor.
- Ideas para mejorar el compartir:
  - Diseñar el resultado como una tarjeta tipo "recibo" (formato vertical, pensado para captura en móvil): ruta, fecha, ida/vuelta, conductor destacado, una fila por pasajero con su importe, y el logo de MiConvoy al pie.
  - Añadir un botón de compartir directo usando la **Web Share API** (`navigator.share`) junto con una librería tipo `html-to-image` para generar un PNG de la tarjeta y compartirlo sin necesidad de captura manual (funciona en Android y en iOS 16.4+).
  - Botón secundario de "Copiar como texto" para quien prefiera pegar el resumen en el chat en vez de compartir una imagen.

## 5. Fórmula de cálculo

```
costePorKm = (consumo / 100) * precioPorLitro   // consumo en L/100km, precioPorLitro en €/L
costeCombustible = distanciaKm * costePorKm
costeCombustible = costeCombustible * 2                 // si "ida y vuelta" está marcado

gastosAdicionales = suma de los importes introducidos (peajes, aparcamiento, etc.)
costeTotal = costeCombustible + gastosAdicionales

costePorPersona = costeTotal / nParticipantes
// nParticipantes: puede incluir o no al conductor en el reparto.
// Si NO se incluye al conductor, el resto de ocupantes le compensan
// (le "pagan la gasolina") como pago por conducir y poner su coche.

precioFinal = Math.ceil(costePorPersona / 0.5) * 0.5
// Redondeo al alza en grupos de 0,50 €, para dejar un pequeño extra al conductor.
// Ejemplos: 3,7 € → 4 €   |   3,2 € → 3,5 €
```

> ⚠️ Corrección respecto a una versión anterior de este documento: la fórmula estaba escrita como `km * (precioCombustible / km)`, que matemáticamente se anula y deja fuera el consumo del coche. La versión correcta usa el **consumo** (L/100km, del perfil del coche) junto con el **precio por litro** para calcular el coste por kilómetro — así el campo de consumo que se guarda al dar de alta un coche sí interviene en el cálculo, como estaba previsto.
>
> Un **convoy** se calcula coche por coche: cada uno con su propio consumo y sus propios pasajeros, no como un único reparto conjunto.
>
> El historial guarda el **resultado ya calculado**, no solo los datos de entrada. Si en el futuro cambia la fórmula, los cálculos antiguos no se recalculan ni cambian: reflejan lo que se calculó en su momento.

## 6. Perfiles y persistencia local

### Mini-perfil de persona

- Nombre y correo (Gmail).
- Si tiene coche o no.
- Si tiene coche: marca, modelo, matrícula y consumo. Si dos personas comparten un mismo coche físico, cada una lo da de alta en su propio perfil (se duplica el registro, no se comparte una única referencia).
- Se guarda en el navegador (almacenamiento local del dispositivo).

### Historial de cálculos

- Guarda el resultado completo mostrado por la calculadora para cada viaje calculado.
- **Límite**: máximo 10 viajes guardados para empezar (ajustable más adelante); al superar el límite se descarta el más antiguo.
- **Enfoque técnico**: `localStorage` con una única clave (p. ej. `miconvoy_historial`) que contiene un array JSON con los registros, usando nombres de campo cortos. Con un máximo de 10 registros, `localStorage` es más que suficiente — no hace falta IndexedDB ni SQLite para este volumen, ni siquiera en la futura app nativa.
- Debe existir un botón para **vaciar el historial**.
- Debe mostrarse un aviso claro (no necesariamente un banner de cookies intrusivo) de que, si se borra la caché o los datos de navegación, esta información se perderá.
- Los datos locales son siempre la fuente utilizable, esté o no el servidor activo. La sincronización con el servidor es una acción manual (botón "Sincronizar datos"), nunca automática en segundo plano.

## 7. Autenticación y cuentas

- **Identificador único**: el correo (Gmail) se usa como clave primaria tanto en local como en servidor, para poder enlazar el perfil local con la cuenta del servidor sin conflictos.
- **Solo Modo Free activo**: el "login" es simplemente introducir gmail + nombre (identificación local, sin verificación real).
- **Servidor activo**: en el apartado de perfil aparece un aviso para crear una contraseña, con el fin de proteger el historial si otra persona intenta entrar con el mismo gmail en otro dispositivo.
  - _A valorar_: usar directamente el inicio de sesión real de Google (Google Identity Services, funciona en cliente sin necesidad de servidor propio) desde el propio Modo Free, en lugar de un campo de texto libre para el gmail. Al ser una autenticación real, nadie podría "escribir" el correo de otra persona para suplantarla, lo que eliminaría la necesidad del paso posterior de crear contraseña. Queda como decisión pendiente de confirmar.
- **Subida de datos**: si el servidor está operativo, al entrar al apartado de perfil en Modo Free aparece un botón de "Subir perfil e historial" para sincronizar con la cuenta del servidor.
- **Crear un viaje** en Modo Free no requiere cuenta. En Modo Online, sí hace falta cuenta para crear un convoy con enlace de invitación (para poder identificar quién es quién).

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

## 10. Disponibilidad del servidor (on/off)

La app debe funcionar igual de bien tanto si el servidor está desplegado como si no (su disponibilidad puede variar a lo largo del año según se pague o no el hosting):

- Una variable de configuración indica si el servidor está activo o no. Para empezar se deja en `false`, de forma que al desplegar en Netlify la parte online no se muestra ni intenta conectarse a nada.
- Además de esa variable, conviene añadir una comprobación en tiempo real (una llamada de "salud" al backend) para que, si el servidor está marcado como activo pero no responde en un momento dado, la app degrade igualmente a Modo Free sin errores.
- Los datos locales siguen siendo siempre la fuente utilizable; cuando el servidor está disponible, un botón de "Sincronizar datos" sube/actualiza el perfil e historial contra el servidor.

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

- **`calculator.ts`** (`packages/calculator`): función pura `calcularCoche` con la fórmula de la sección 5, sin dependencias de Next.js, Prisma ni `localStorage`. Se importa igual desde el cliente (Modo Free) que desde un router de tRPC (Modo Online). Un convoy es `calcularConvoy`, que llama a `calcularCoche` una vez por cada coche.

- **Autenticación**: Google Identity Services (login real de Google) desde el principio, tanto en Modo Free (resuelto en el cliente, sin servidor) como en Modo Online (NextAuth + proveedor Google). El correo es el identificador natural que enlaza el perfil local con la cuenta del servidor.
- **Modo Free** (sin base de datos, todo en `localStorage`): tipos definidos en `types-modo-free.ts` — `PerfilLocal`, `CocheLocal`, `HistorialEntry` (con el resultado ya calculado, como snapshot inmutable).
- **Modo Online** (con base de datos): esquema completo en `schema.prisma` — `User`/`Account`/`Session` (tablas estándar de NextAuth), `Coche`, `Viaje`, `CocheDelViaje`, `Pasajero`, `GastoAdicional`.
- Los tipos locales están pensados para mapear 1:1 con el esquema del servidor, de forma que sincronizar (botón "Subir perfil e historial") sea un mapeo directo:
  - `HistorialEntry` → `Viaje` (con `modoOrigen: "free"`)
  - `CocheDelViajeLocal` → `CocheDelViaje` (usando `numeroPasajerosLibre`, ya que en Modo Free los pasajeros no están identificados uno a uno)
- El campo `resultado` de `Viaje` (tipo `Json`) guarda el cálculo ya hecho, igual que `HistorialEntry.resultado` en local: si la fórmula cambia en el futuro, estos registros no se recalculan.
- La restricción de "un pasajero solo en un coche a la vez" se implementa como índice único `(viajeId, personaId)` en `Pasajero`. El límite de 5 pasajeros por coche se valida en la lógica de negocio, no en el esquema.

## 14. Pendiente / próximos pasos

- [ ] Elegir proveedor definitivo de base de datos, tiempo real y hosting del servidor.
- [ ] Definir el detalle del "health check" de disponibilidad del servidor.
- [ ] Diseñar el adaptador de storage y la lógica de sincronización que mapea `HistorialEntry` a `Viaje`.
- [ ] Maquetar el flujo de pantallas paso a paso del Modo Free.

miguelturra → ciudad real
2/10/2026 · Ida y vuelta · 5 km · 4 personas
Hugo Sánchez
Skoda Octavia TDI 1.9
1,00 €
por persona
MiConvoy
