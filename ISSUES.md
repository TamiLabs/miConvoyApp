# MiConvoy — Tareas pendientes

Fuente: `README.md` + estado real del código (`src/`).
Solo quedan las tareas pendientes (las terminadas se han eliminado de esta lista).
Se conserva la numeración original (por eso faltan números y secciones enteras).
Orden: por página, de funcionalidad grande a pequeña.

---

## 2. Calculadora Modo Gratis (`/calculadora`)

### 2.14 Compartir como imagen (Web Share + PNG) — ⬜ Pendiente (parcial: texto sí)

Implementado compartir/copiar como texto (`navigator.share` con fallback a portapapeles). Falta el PNG (`html-to-image`).

---

## 3. Fórmula y lógica de cálculo

### 3.2 Tests unitarios de la fórmula — ⬜ Pendiente

Casos: solo ida, ida/vuelta, con/sin conductor, gastos extra, redondeos (3,7→4 · 3,2→3,5), convoy coche a coche.
Criterios: script de test ejecutable sin levantar la app.

---

## 5. Modo Online (`/online`, futuro con servidor)

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

### 7.4 Crear viaje Gratis sin cuenta; Online con cuenta — ✅/⬜ Parcial

La calculadora Gratis no exige cuenta (hecho). Falta exigir cuenta en Online cuando exista.

---

## 8. Servidor, base de datos y tiempo real

### 8.2 NextAuth con Google — ⬜ Pendiente

Proveedor Google preferente; enlazar por email con el perfil local.

### 8.3 Routers tRPC que reutilicen `calculadora.ts` — ⬜ Pendiente

El cálculo online debe llamar a las mismas funciones puras que el cliente.

### 8.4 Elegir proveedor de BBDD / tiempo real / hosting — ⬜ Pendiente

MySQL gestionado (Railway, Aiven, PlanetScale…) + tiempo real (Pusher/Ably recomendado, o Socket.io autoalojado) + validación Zod.
Criterios: decisión documentada en README.

---

## 9. Mapas y geolocalización (con vista a Capacitor)

### 9.1 Geo web con `navigator.geolocation` — ✅/⬜ Parcial

En uso para el origen en la calculadora; falta reutilizar la misma capa en el mapa online (5.6).

### 9.2 Mapa del convoy (Leaflet/OSM o MapLibre) — ✅/⬜ Parcial

Mapa Leaflet/OSM del viaje en la calculadora (origen, destino y ruta) ✅. Falta el mapa en tiempo real del convoy online (5.6), compatible con WebView de Capacitor.

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

### 11.5 Estructura monorepo `apps/packages` — ⬜ Pendiente (decisión)

El README recomienda `create-t3-turbo`; hoy el repo es `src/` simple. Decidir si migrar o mantener adaptador + import directo.

### 11.6 Logo de MiConvoy — ⬜ Pendiente

Necesario para el pie de la tarjeta-recibo (2.13) y PWA (10.2).
