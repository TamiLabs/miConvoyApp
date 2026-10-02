# MiConvoy — Lista de issues del proyecto

Fuente: `README.md` + estado real del código (`src/`).
Leyenda: ✅ Hecho · ⬜ Pendiente.
Orden: por página, de funcionalidad grande a pequeña. Cada sub-tarea es un futuro issue de GitHub.

---

## 1. Perfil (`/perfil`)

### 1.1 Crear perfil con Google + fallback manual — ✅ Hecho

Crear el perfil si no existe: botón real de Google (GIS vía `@react-oauth/google`: `GoogleLogin` típico + botón propio `Continuar con Google` con icono Font Awesome) y, sin client ID, formulario local de correo + nombre. Guarda en `localStorage` vía adaptador.
Estado actual: implementado en `src/components/crearPerfil.tsx`.

### 1.2 Dar de alta un coche en popup reutilizable — ✅ Hecho

Formulario de alta (marca, modelo, matrícula, consumo L/100km, precio €/L y tipo diésel/gasolina/eléctrico) dentro del componente reutilizable `VentanaEmergente` (cierra con ✕, fondo y Escape). Acepta `,` o `.` en decimales (`interpretarNumero`).
Estado: `src/components/formularioCoche.tsx`, `src/components/ventanaEmergente.tsx`.

### 1.3 Listar coches en tarjetas + eliminar — ✅ Hecho

Una vez creado el perfil, sus coches aparecen como tarjetas con marca/modelo, matrícula y consumo, más botón `+` (icono Font Awesome `faPlus`) para añadir.
Estado: `src/app/perfil/page.tsx`. Incluye eliminar y editar (ver 1.4).

### 1.4 Editar un coche existente — ✅ Hecho

Reabre `FormularioCoche` precargado (`valoresIniciales`) desde la tarjeta y guarda cambios en el perfil local. El consumo editado se usa en próximos cálculos, no reescribe historiales.
Estado: `src/app/perfil/page.tsx` + `FormularioCoche`.

### 1.5 Marcar "tengo coche / no tengo coche" — ✅ Hecho

Interruptor en el perfil (`PerfilLocal.tieneCoche`); sin coche, la sección de coches se oculta y la calculadora acepta consumo manual.
Estado: `src/app/perfil/page.tsx`.

### 1.6 Olvidar en este dispositivo (con correo recordado) — ✅ Hecho

Botón "Olvidar en este dispositivo" con confirmación: elimina `miconvoy_perfil` y vuelve al login (apartado Cuenta). El historial se conserva y el correo se recuerda (`miconvoy_ultimo_correo`) para precargarlo al volver.
Estado: `src/app/perfil/page.tsx` (`eliminarPerfil`, `guardarUltimoCorreo`).

### 1.7 Aviso de crear contraseña con servidor activo — ⬜ Pendiente (base UI hecha)

La zona "Servidor" del perfil muestra el aviso y los botones solo con `SERVIDOR_ACTIVADO`; sin backend, los botones muestran nota de pendiente. Falta el registro real cuando exista servidor.

### 1.8 Botón "Subir perfil e historial" — ⬜ Pendiente (base UI hecha)

Mismo estado que 1.7: UI presente con nota de pendiente. Falta el mapeo real contra el backend (ver 9.3).

---

## 2. Calculadora Modo Gratis (`/calculadora`)

### 2.1 Flujo por pasos con flechas atrás/adelante — ✅ Hecho

Pasos Viaje → Coches → Gastos → Resultado con indicador de progreso y navegación Atrás/Siguiente. Todo en cliente, sin cuenta.
Estado: `src/app/calculadora/page.tsx`.

### 2.2 Paso origen (geolocalización actual) + destino — ✅ Hecho (base)

Campos origen/destino más botón "usar mi posición" (`navigator.geolocation`, rellena `Mi posición (lat, lng)` con gestión de errores). Sin geocodificación inversa de momento.

### 2.3 Cálculo de distancia con OpenRouteService — ⬜ Pendiente

Llamar a la API externa para obtener los km del trayecto.
Criterios: necesita internet (no es 100% offline); clave en variable de entorno; gestión de errores y cuota.

### 2.4 Campo manual de km alternativo — ✅ Hecho

La distancia se escribe a mano (acepta `,` y `.`), así el cálculo nunca queda bloqueado. La UI lo indica.

### 2.5 Selección de coche (del perfil o manual) — ✅ Hecho

Si hay perfil con coches, desplegable "¿Qué coche vas a usar?" por cada coche del viaje: consumo y precio quedan internos (más etiqueta del tipo de combustible); si no, consumo y precio manuales. Crear viaje no requiere cuenta.

### 2.6 Reutilizar últimos datos introducidos — ✅ Hecho

Al calcular se guarda el formulario (`miconvoy_ultimo_viaje`) y al abrir se precarga: origen, destino, distancia, precio, ida/vuelta, convoy, coches y gastos.
Estado: `obtenerUltimoViaje` / `guardarUltimoViaje`.

### 2.7 Opción "¿Es convoy?" con tarjetas por coche — ✅ Hecho

Por defecto un coche; con la opción, selector de nº de coches (máx. 6) y una tarjeta por coche con conductor, consumo, pasajeros e incluir-conductor. Un convoy = viaje con >1 coche.

### 2.8 Casilla "¿Ida y vuelta?" marcada por defecto — ✅ Hecho

Si está marcada, el combustible se multiplica x2 antes del redondeo (lógica en `calculadora.ts`, UI en paso Viaje).

### 2.9 Incluir / no incluir al conductor en el reparto — ✅ Hecho

Checkbox por coche. Si no se incluye, los ocupantes le compensan.

### 2.10 Gastos adicionales antes de "Calcular viaje" — ✅ Hecho

Filas nombre + importe con añadir/quitar; aceptan `,` y `.`. En convoy se reparten a partes iguales entre coches (indicado en la UI).

### 2.11 Botón "Calcular viaje" + validaciones — ✅ Hecho

Valida distancia, conductor, consumo y precio (por coche: interno del perfil u manual), ocupantes (≥1, y ≥2 si el conductor no paga) y gastos; ejecuta `calcularConvoy`. No guarda nada: solo muestra el resultado.

### 2.12 Resumen editable + botón "Recalcular" — ✅ Hecho

Los pasos son el resumen editable (botón "Editar datos" desde el resultado); si se cambia algo tras calcular, aviso + botón "Recalcular". "Finalizar viaje" guarda en el historial; recalcular tras editar permite finalizar de nuevo.

### 2.13 Tarjeta de resultado tipo "recibo" — ✅ Hecho (base)

Recibo vertical con ruta, fecha, ida/vuelta, conductor destacado, importe por persona y total por coche, total del convoy y pie "MiConvoy". Estilos simples, pendientes de diseño final.

### 2.14 Compartir como imagen (Web Share + PNG) — ⬜ Pendiente (parcial: texto sí)

Implementado compartir/copiar como texto (`navigator.share` con fallback a portapapeles). Falta el PNG (`html-to-image`).

### 2.15 Copiar resultado como texto — ✅ Hecho

Botón que copia ruta, ida/vuelta, pago por persona y totales por coche.

---

## 3. Fórmula y lógica de cálculo

### 3.1 Funciones puras `calcularCoche` / `calcularConvoy` — ✅ Hecho

Fórmula del README (coste/km, x2 ida/vuelta, reparto, redondeo al alza en grupos de 0,50 €) sin dependencias de Next/DOM.
Estado: `src/calculadora.ts`.

### 3.2 Tests unitarios de la fórmula — ⬜ Pendiente

Casos: solo ida, ida/vuelta, con/sin conductor, gastos extra, redondeos (3,7→4 · 3,2→3,5), convoy coche a coche.
Criterios: script de test ejecutable sin levantar la app.

### 3.3 Congelar resultado calculado en historial — ✅ Hecho

Cada cálculo guarda `resultado` + `detallePorCoche` como snapshot inmutable; los registros viejos nunca se recalculan.
Estado: tipos + guardado en `PaginaCalculadora`.

---

## 4. Historial local

### 4.1 Guardar al "Finalizar viaje" (máx. 10, solo si activo) — ✅ Hecho

Calcular no guarda: solo "Finalizar viaje" añade `EntradaHistorial` (la más reciente primero, se descarta la más antigua), y solo si el historial está activado en el perfil. Recalcular tras editar permite guardar de nuevo.
Estado: `alFinalizar` en la calculadora + `obtenerHistorialActivo`.

### 4.2 Ver historial en el perfil + interruptor on/off — ✅ Hecho (base)

Apartado Historial en `/perfil` con interruptor "Guardar historial de viajes", lista con ruta, fecha, ida/vuelta y total, botón vaciar y aviso local. Sin vista detalle todavía.

### 4.3 Botón vaciar historial — ✅ Hecho

Borra todos los registros con confirmación.
Estado: `limpiarHistorial` + botón en el perfil.

### 4.4 Aviso de pérdida de datos al borrar caché — ✅ Hecho

Nota visible en perfil y en historial: todo es local, si se borra la caché se pierde.

### 4.5 Botón manual "Sincronizar datos" — ⬜ Pendiente

Sube perfil e historial al servidor cuando está activo; nunca automático en segundo plano.
Criterios: ver 1.8 y 9.3.

---

## 5. Modo Online (`/online`, futuro con servidor)

### 5.1 Página "no disponible" degradada — ✅ Hecho (base)

Si `SERVIDOR_ACTIVADO` es falso, muestra "no disponible" sin errores.
Estado: `src/app/online/page.tsx`. Falta el resto de esta sección.

### 5.2 Crear viaje online + enlace de invitación — ⬜ Pendiente

El organizador crea el convoy (requiere cuenta) y comparte enlace único (`enlaceInvitacion` ya existe en Prisma).
Criterios: enlace copiable/compartible.

### 5.3 Unirse al viaje: elegir o crear pasajero (máx. 5/coche) — ⬜ Pendiente

Al abrir el enlace, identificarse eligiendo nombre existente o creando uno nuevo; validar límite de 5 en lógica, no en esquema.

### 5.4 Varios coches por viaje + invitar más gente — ⬜ Pendiente

Añadir coches al mismo viaje; cada coche puede invitar.
Criterios: convoy = varios `CocheDelViaje` del mismo `Viaje`.

### 5.5 Un pasajero, un solo coche por viaje — ⬜ Pendiente

Aplicar índice único `(viajeId, personaId)` (ya en Prisma) con mensaje de error amable al intentarlo.

### 5.6 Mapa en tiempo real del convoy — ⬜ Pendiente

Ver posición de cada coche (geo del conductor o de un pasajero); sin ubicación, coche "sin conexión".
Criterios: ver sección 6 de mapas; botón para detener la geo (ser poco invasivo).

---

## 6. Notificaciones

### 6.1 Aviso de llegada a destino — ⬜ Pendiente

Si la geo detecta llegada (margen de metros) y pasan ~5 min sin detenerla: "Has llegado, pulsa para dejar de usar la ubicación".
Nota: no fiable en iOS como PWA (Safari suspende la geo en segundo plano); documentarlo.

### 6.2 Aviso de "hora de salir" — ⬜ Pendiente

Si el viaje tiene hora y duración estimada, notificar cuándo salir.

### 6.3 Aviso cuando otro coche del convoy llega — ⬜ Pendiente

Coordinación del resto del convoy.

### 6.4 Recordatorio de detener la geolocalización — ⬜ Pendiente

Si lleva mucho tiempo activa sin llegar a destino.

### 6.5 Aviso de actualización disponible — ⬜ Pendiente

Vía Service Worker, en Modo Gratis y Online, con botón para aplicar.

---

## 7. Autenticación y cuentas

### 7.1 Correo como identificador único local-servidor — ✅/⬜ Parcial

El correo enlaza perfil local con `User` del servidor. En local ya se usa; falta aplicarlo en el servidor (ver 8.x).

### 7.2 Login local gmail + nombre (Modo Gratis) — ✅ Hecho

Identificación local sin verificación cuando no hay Google configurado.
Estado: `CrearPerfil` manual.

### 7.3 Decidir Google real vs campo libre — ✅ Hecho (decidido: Google real)

Se optó por Google Identity Services desde el Modo Gratis. Queda extenderlo a NextAuth en Online (ver 8.2).

### 7.4 Crear viaje Gratis sin cuenta; Online con cuenta — ✅/⬜ Parcial

La calculadora Gratis no exige cuenta (hecho). Falta exigir cuenta en Online cuando exista.

---

## 8. Servidor, base de datos y tiempo real

### 8.1 Esquema Prisma base — ✅ Hecho (base)

`User/Account/Session`, `Coche`, `Viaje`, `CocheDelViaje`, `Pasajero`, `GastoAdicional` con índice único y `resultado Json`.
Estado: `prisma/schema.prisma`. Falta: migraciones aplicadas y `modoOrigen`.

### 8.2 NextAuth con Google — ⬜ Pendiente

Proveedor Google preferente; enlazar por email con el perfil local.

### 8.3 Routers tRPC que reutilicen `calculadora.ts` — ⬜ Pendiente

El cálculo online debe llamar a las mismas funciones puras que el cliente.

### 8.4 Elegir proveedor de BBDD / tiempo real / hosting — ⬜ Pendiente

PostgreSQL gestionado (Neon, Supabase o Railway) + tiempo real (Pusher/Ably recomendado, o Supabase Realtime, o Socket.io autoalojado) + validación Zod.
Criterios: decisión documentada en README.

### 8.5 Docker local + migraciones — ✅/⬜ Parcial

`docker-compose.yml` y comandos `db:*` existen; falta verificar `migrate dev` genera migraciones y `migrate deploy` sirve para el servidor real.

---

## 9. Mapas y geolocalización (con vista a Capacitor)

### 9.1 Geo web con `navigator.geolocation` — ✅/⬜ Parcial

En uso para el origen en la calculadora; falta reutilizar la misma capa en el mapa online (5.6).

### 9.2 Mapa del convoy (Leaflet/OSM o MapLibre) — ⬜ Pendiente

Gratuito, sin facturación, compatible con WebView de Capacitor.

### 9.3 Mapeo sync `EntradaHistorial → Viaje` — ⬜ Pendiente

`EntradaHistorial→Viaje(modoOrigen:"gratis")`, `CocheDelViajeLocal→CocheDelViaje(numeroPasajerosLibre)`, `GastoAdicionalLocal→GastoAdicional`, `PerfilLocal.coches→Coche`. Tipos locales ya preparados (origen/destino, detallePorCoche).

### 9.4 Health check del backend + degradado — ⬜ Pendiente

Además de `SERVIDOR_ACTIVADO` (✅ hecho en `configuracion.ts`), llamada de salud: si no responde, degradar a Gratis sin errores.

---

## 10. Distribución, PWA y Capacitor

### 10.1 Despliegue Modo Gratis en Netlify — ⬜ Pendiente

Público sin registro; variable de servidor en `false`.

### 10.2 PWA instalable Android/iOS + responsive móvil — ✅/⬜ Parcial

Responsive móvil hecho (una columna, táctil 44px+, inputs 16px sin zoom iOS, popup bottom-sheet). Falta manifest, iconos y Service Worker.

### 10.3 Actualizaciones transparentes o con aviso — ⬜ Pendiente

Automáticas si es posible; si no, aviso + botón (ver 6.5).

### 10.4 Integración Capacitor desde ya — ⬜ Pendiente

Sin publicar, para detectar incompatibilidades (storage detrás de adaptador ✅, geo con misma interfaz ⬜).

### 10.5 Ficha de stores y geo en segundo plano — ⬜ Pendiente (futuro)

Justificación de background para Apple cuando toque.

---

## 11. Transversal / calidad

### 11.1 Sistema SCSS global compilado a CSS — ✅ Hecho

`src/scss` (`_constantes`, `_normalize`, `_global`, páginas, componentes) → `src/css/estilos.css` comprimido; `npm run dev` vigila cambios; sin imports por página.
Estado: implementado (+ estilos de calculadora y perfil).

### 11.2 Prettier + `npm run format` — ✅ Hecho

Formato de todo el proyecto con un comando.

### 11.3 Nombres camelCase en español — ✅ Hecho

Ficheros renombrables y variables internas traducidas (los exigidos por Next/Prisma se mantienen).

### 11.4 Iconos Font Awesome (todas las variantes free) — ✅ Hecho

`brands`, `solid`, `regular` + `react-fontawesome` instalados; usados en login Google y botones.

### 11.5 Estructura monorepo `apps/packages` — ⬜ Pendiente (decisión)

El README recomienda `create-t3-turbo`; hoy el repo es `src/` simple. Decidir si migrar o mantener adaptador + import directo.

### 11.6 Logo de MiConvoy — ⬜ Pendiente

Necesario para el pie de la tarjeta-recibo (2.13) y PWA (10.2).
