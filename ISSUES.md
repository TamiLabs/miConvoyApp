# MiConvoy — Lista de issues del proyecto

Fuente: `README.md` + estado real del código (`src/`).
Leyenda: ✅ Hecho · ⬜ Pendiente.
Orden: por página, de funcionalidad grande a pequeña. Cada sub-tarea es un futuro issue de GitHub.

---

## 1. Perfil (`/perfil`)

### 1.1 Crear perfil con Google + fallback manual — ✅ Hecho

Crear el perfil si no existe: botón real de Google (GIS vía `@react-oauth/google`: `GoogleLogin` típico + botón propio `Continuar con Google` con icono Font Awesome) y, sin client ID, formulario local de correo + nombre. Guarda en `localStorage` vía adaptador.
Estado actual: implementado en `src/components/crearPerfil.tsx`. Falta pulir (ver 1.6).

### 1.2 Dar de alta un coche en popup reutilizable — ✅ Hecho

Formulario de alta (marca, modelo, matrícula, consumo L/100km) dentro del componente reutilizable `VentanaEmergente` (cierra con ✕, fondo y Escape). Acepta `,` o `.` en decimales (`interpretarNumero`).
Estado: `src/components/formularioCoche.tsx`, `src/components/ventanaEmergente.tsx`.

### 1.3 Listar coches en tarjetas + eliminar — ✅ Hecho

Una vez creado el perfil, sus coches aparecen como tarjetas con marca/modelo, matrícula y consumo, más botón `+` (icono Font Awesome `faPlus`) para añadir.
Estado: `src/app/perfil/page.tsx`. Incluye eliminar; falta editar (ver 1.4).

### 1.4 Editar un coche existente — ⬜ Pendiente

Reabrir `FormularioCoche` precargado desde la tarjeta del coche y guardar cambios en el perfil local.
Criterios: misma validación que el alta; el consumo editado se usa en próximos cálculos, no reescribe historiales.

### 1.5 Cerrar sesión / borrar perfil local — ⬜ Pendiente

Botón para eliminar el perfil guardado (clave `miconvoy_perfil`) y volver al estado "crear perfil". Necesario también para descartar nombres guardados con mala codificación.
Criterios: pide confirmación; no toca el historial salvo que se pida.

### 1.6 Aviso de crear contraseña con servidor activo — ⬜ Pendiente

Cuando `SERVIDOR_ACTIVADO`, mostrar en el perfil el aviso de crear contraseña para proteger el historial si otro dispositivo usa el mismo gmail.
Criterios: solo visible con servidor activo; enlaza al futuro registro.

### 1.7 Botón "Subir perfil e historial" — ⬜ Pendiente

Con servidor activo, subir perfil e historial a la cuenta del servidor (mapeo `EntradaHistorial → Viaje`, ver 9.3).
Criterios: acción manual con confirmación y resumen de subidos.

---

## 2. Calculadora Modo Gratis (`/calculadora`)

### 2.1 Flujo por pasos con flechas atrás/adelante — ⬜ Pendiente

Pantalla por pasos hasta el resultado, navegación con flechas. Maquetar el esqueleto aunque los pasos se rellenen en issues siguientes.
Criterios: funciona solo con cliente; no exige cuenta.

### 2.2 Paso origen (geolocalización actual) + destino — ⬜ Pendiente

Elegir destino y posición de partida usando `navigator.geolocation`.
Criterios: pide permiso, muestra errores (denegado, sin señal) y permite escribir origen/destino a mano.

### 2.3 Cálculo de distancia con OpenRouteService — ⬜ Pendiente

Llamar a la API externa para obtener los km del trayecto.
Criterios: necesita internet (no es 100% offline); clave en variable de entorno; gestión de errores y cuota.

### 2.4 Campo manual de km alternativo — ⬜ Pendiente

Si falla la API o no hay conexión, permitir introducir los km a mano para no bloquear el cálculo.
Criterios: visible como alternativa siempre, no solo en error.

### 2.5 Selección de coche (del perfil o manual) — ⬜ Pendiente

Si hay perfil, elegir uno de sus coches (el consumo viene del alta); si no hay perfil, pedir marca/modelo/consumo manualmente.
Criterios: crear viaje no requiere cuenta.

### 2.6 Reutilizar últimos datos introducidos — ⬜ Pendiente

Precargar conductor, pasajeros, coche y precio del combustible de la última vez.
Criterios: leído de `localStorage`; se puede cambiar en cada cálculo.

### 2.7 Opción "¿Es convoy?" con tarjetas por coche — ⬜ Pendiente

Por defecto un coche; con la opción, elegir nº de coches y mostrar por cada uno una tarjeta con nombre del conductor y nº de pasajeros.
Criterios: un convoy = viaje con >1 coche, sin entidad distinta.

### 2.8 Casilla "¿Ida y vuelta?" marcada por defecto — ⬜ Pendiente

Si está marcada, el combustible se multiplica x2 antes del redondeo; si no, solo ida.
Criterios: la lógica ya existe en `calculadora.ts`; falta la UI.

### 2.9 Incluir / no incluir al conductor en el reparto — ⬜ Pendiente

Si no se incluye, los ocupantes le compensan (le "pagan la gasolina").
Criterios: lógica ya en `calculadora.ts`; falta UI por coche.

### 2.10 Gastos adicionales antes de "Calcular viaje" — ⬜ Pendiente

Lista de gastos sueltos (peajes, aparcamiento…) con nombre e importe; se suman al combustible antes de repartir y redondear.
Criterios: añadir/quitar filas; importes aceptan `,` y `.`.

### 2.11 Botón "Calcular viaje" + validaciones — ⬜ Pendiente

Valida distancia, consumo, precio, pasajeros y ejecuta `calcularCoche` / `calcularConvoy`.
Criterios: errores claros en móvil; deshabilitado hasta datos mínimos.

### 2.12 Resumen editable + botón "Recalcular" — ⬜ Pendiente

Antes del resultado, lista (no `<ul>`) con los datos introducidos, editable; al editar aparece "Recalcular".
Criterios: no recalcula solo hasta pulsar el botón.

### 2.13 Tarjeta de resultado tipo "recibo" — ⬜ Pendiente

Resultado vistoso para captura y WhatsApp: ruta, fecha, ida/vuelta, conductor destacado, fila por pasajero con su importe y logo al pie. Convoy: un bloque por coche.
Criterios: 100% móvil, vertical, legible en captura.

### 2.14 Compartir como imagen (Web Share + PNG) — ⬜ Pendiente

Botón compartir con `navigator.share` + librería tipo `html-to-image` para generar el PNG de la tarjeta.
Criterios: funciona en Android y iOS 16.4+; fallback a descarga si no hay share.

### 2.15 Copiar resultado como texto — ⬜ Pendiente

Botón secundario que copia el resumen para pegarlo en el chat.
Criterios: formato corto con ruta, total y deudas por pasajero.

---

## 3. Fórmula y lógica de cálculo

### 3.1 Funciones puras `calcularCoche` / `calcularConvoy` — ✅ Hecho

Fórmula del README (coste/km, x2 ida/vuelta, reparto, redondeo al alza en grupos de 0,50 €) sin dependencias de Next/DOM.
Estado: `src/calculadora.ts`.

### 3.2 Tests unitarios de la fórmula — ⬜ Pendiente

Casos: solo ida, ida/vuelta, con/sin conductor, gastos extra, redondeos (3,7→4 · 3,2→3,5), convoy coche a coche.
Criterios: script de test ejecutable sin levantar la app.

### 3.3 Congelar resultado calculado en historial — ✅/⬜ Parcial

Los tipos ya guardan `resultado` como snapshot inmutable (`tiposModoGratis.ts`); falta usarlo al guardar cada cálculo (ver 4.1) y no recalcular nunca registros viejos.

---

## 4. Historial local

### 4.1 Guardar cada cálculo en el historial (máx. 10) — ⬜ Pendiente

Al calcular, añadir `EntradaHistorial` con el resultado ya calculado; el más reciente primero, descartando el más antiguo.
Estado: funciones listas (`obtenerHistorial`, `anadirEntradaHistorial`); falta llamarlas desde la calculadora y su UI.

### 4.2 Ver historial de viajes — ⬜ Pendiente

Lista de los últimos cálculos con fecha, ruta y total.
Criterios: lee solo de `miconvoy_historial`; vacío con mensaje amable.

### 4.3 Botón vaciar historial — ⬜ Pendiente

Borra todos los registros con confirmación.
Estado: función `limpiarHistorial` lista; falta el botón.

### 4.4 Aviso de pérdida de datos al borrar caché — ⬜ Pendiente

Aviso claro (no banner intrusivo) de que borrar caché/datos del navegador elimina perfil e historial.
Criterios: visible en perfil y/o historial.

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

### 7.4 Crear viaje Gratis sin cuenta; Online con cuenta — ⬜ Pendiente

Regla de negocio a aplicar en las UIs y routers cuando exista el servidor.

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

### 9.1 Geo web con `navigator.geolocation` — ⬜ Pendiente

Usar en origen (2.2) y mapa online (5.6) con la misma capa de utilidades.

### 9.2 Mapa del convoy (Leaflet/OSM o MapLibre) — ⬜ Pendiente

Gratuito, sin facturación, compatible con WebView de Capacitor.

### 9.3 Mapeo sync `EntradaHistorial → Viaje` — ⬜ Pendiente

`EntradaHistorial→Viaje(modoOrigen:"gratis")`, `CocheDelViajeLocal→CocheDelViaje(numeroPasajerosLibre)`, `GastoAdicionalLocal→GastoAdicional`, `PerfilLocal.coches→Coche`.

### 9.4 Health check del backend + degradado — ⬜ Pendiente

Además de `SERVIDOR_ACTIVADO` (✅ hecho en `configuracion.ts`), llamada de salud: si no responde, degradar a Gratis sin errores.

---

## 10. Distribución, PWA y Capacitor

### 10.1 Despliegue Modo Gratis en Netlify — ⬜ Pendiente

Público sin registro; variable de servidor en `false`.

### 10.2 PWA instalable Android/iOS + responsive móvil — ⬜ Pendiente

Manifest, iconos, Service Worker; vista 100% móvil pero responsive.

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
Estado: implementado.

### 11.2 Prettier + `npm run format` — ✅ Hecho

Formato de todo el proyecto con un comando.

### 11.3 Nombres camelCase en español — ✅ Hecho

Ficheros renombrables y variables internas traducidas (los exigidos por Next/Prisma se mantienen).

### 11.4 Iconos Font Awesome (todas las variantes free) — ✅ Hecho

`brands`, `solid`, `regular` + `react-fontawesome` instalados; usados en login Google y botón añadir coche.

### 11.5 Estructura monorepo `apps/packages` — ⬜ Pendiente (decisión)

El README recomienda `create-t3-turbo`; hoy el repo es `src/` simple. Decidir si migrar o mantener adaptador + import directo.

### 11.6 Logo de MiConvoy — ⬜ Pendiente

Necesario para el pie de la tarjeta-recibo (2.13) y PWA (10.2).
