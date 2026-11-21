# SPEC · Mi Recetario PWA — Subproducto No. 7 "Aplicación Web Progresiva"

**Materia:** Aplicaciones Web Progresivas · Unidad I · Actividad Cierre
**Alumno:** Jahir Jaziel Serrano Arana · 10° D
**Repositorio:** `JazyelAe/web` → se propone renombrarlo a **`JazyelAe/MiRecetario-PWA`** (requiere tu confirmación)
**Estado:** borrador para aprobación (Checkpoint A)

## 1. Objetivo
Verificar y **pulir, sin rehacer**, Mi Recetario PWA, que es la evolución de la app web del SP2 (`Mi_Recetario`) con Firebase Firestore, TheMealDB, manifest y service worker. Debe quedar:
- **instalable**;
- **funcionando sin conexión con datos**;
- con todas las **evidencias de características PWA** que pide la profesora.

## 2. Auditoría (sitio publicado y código, 20/11/2026)
| # | Hallazgo | Estado |
|---|---|---|
| A-1 | Manifest con `name`, `short_name`, `start_url`, `scope`, `display: standalone`, colores e iconos 192/512. | ✅ |
| A-2 | El icono *maskable* es el mismo de 512 px, sin margen de seguridad: Android le recortaría el borde. | ❌ |
| A-3 | Service worker registrado y **activo**, con 11 archivos en caché (`recetario-v1`). | ✅ |
| A-4 | La estrategia es *network first* para todo. No hay `offline.html` (la ruta da 404). | ⚠️ |
| A-5 | **Sin conexión, la lista de recetas queda vacía**: la persistencia offline de Firestore **no está activada** (verificado con Playwright). | ❌ |
| A-6 | Sin conexión, la etiqueta sigue diciendo «● Conectado a Firebase». No hay aviso de que no hay red. | ❌ |
| A-7 | El SDK de Firebase (gstatic.com) no está en la caché del service worker: sin red solo carga si el navegador lo tenía en su caché HTTP. | ⚠️ |
| A-8 | Reglas de Firestore: **cualquiera puede borrar cualquier receta** (`allow delete: if true`). La spec pide escritura limitada. | ❌ |
| A-9 | El manifest no tiene `screenshots`, que Chrome usa para mostrar un diálogo de instalación más completo. | Mejora |
| A-10 | Sitio en HTTPS (GitHub Pages) y diseño responsive. | ✅ |
| A-11 | El README es la guía de configuración de Firebase; no explica la PWA ni la relación con SP2. | ⚠️ |

## 3. Requisitos funcionales (qué se pule)
- **RF-1 Manifest completo.**
  - Icono **maskable** propio (`icon-maskable-512.png`, con el contenido dentro de la zona segura del 80 %).
  - `screenshots` (escritorio y móvil) y `description`.
  - `start_url: "./"`.
- **RF-2 Service worker con estrategias documentadas** (`recetario-v2`):
  - **App shell (HTML, CSS, JS, iconos): *cache first*** y se actualiza al cambiar la versión.
  - **Navegación: *network first*** → copia en caché → `offline.html` como último recurso.
  - **SDK de Firebase (gstatic, con versión fija): *cache first*.** No cambia nunca, así que la app abre sin red.
  - **Fotos de TheMealDB: *stale-while-revalidate*** en una caché aparte, con límite de 40 imágenes.
  - Firestore y la API de TheMealDB **no pasan por el service worker**: Firestore usa su propia caché offline.
- **RF-3 Instalable** en Chrome y Edge (escritorio y Android). Se verifica con `Page.getInstallabilityErrors` (Chrome DevTools Protocol), que debe responder **sin errores**.
- **RF-4 Funciona sin conexión.**
  - Se activa la **persistencia offline de Firestore** (`persistentLocalCache`): las recetas se ven sin red y lo que se agregue offline se sincroniza al volver la conexión.
  - Indicador **«En línea / Sin conexión · mostrando recetas guardadas»** (`navigator.onLine` + eventos).
  - La búsqueda en TheMealDB avisa que necesita Internet.
- **RF-5 HTTPS y responsive:** se revisa en 390 px (móvil) y 1280 px (escritorio), sin desbordamiento horizontal.
- **RF-6 Reglas de Firestore** (`firestore.rules`):
  - **lectura pública**;
  - **alta de recetas validada** (campos y tamaños permitidos);
  - **borrar solo en los 10 minutos siguientes a crear la receta**, para deshacer un error propio sin poder vandalizar el catálogo;
  - sugerencias solo de alta.
  - **🔐 Publicarlas requiere tu cuenta de Firebase** (te paso el texto exacto y los clics).
- **RF-7 README de PWA:** qué la hace PWA, estrategias de caché, cómo instalarla y relación con SP2.

## 4. Requisitos no funcionales
- **RNF-1** Mismo diseño y funciones actuales; no se rehace la app.
- **RNF-2** Código comentado en español; la estrategia de cada tipo de petición se explica en `service-worker.js`.
- **RNF-3** La config web de Firebase sigue en el cliente (no es secreta); la protección real son las reglas.

## 5. Herramientas (para el reporte)
Web App Manifest, Service Worker API, Cache Storage API, Firebase Firestore (caché persistente), Chrome DevTools (Application), Chrome DevTools Protocol (instalabilidad), Playwright, PWABuilder y Workbox (como alternativas, sin usarlas en el código).

## 6. Criterios de aceptación
| # | Criterio | Cómo se verifica |
|---|---|---|
| CA-1 | Instalable: `getInstallabilityErrors` = [] y el manifest es válido. | Playwright + CDP (automático) |
| CA-2 | Sin conexión: al recargar se ven las recetas (desde Firestore offline) y el aviso «Sin conexión». | Playwright `set_offline(True)` |
| CA-3 | Una navegación a una página no cacheada sin red muestra `offline.html`. | Playwright |
| CA-4 | Service worker activo y Cache Storage con app shell, SDK de Firebase e imágenes. | Playwright (automático) + captura de DevTools |
| CA-5 | Responsive en 390 px y 1280 px, sin desbordamiento. | Playwright |
| CA-6 | Reglas: borrar una receta antigua es rechazado y crear una válida funciona. | Prueba contra Firestore tras publicar las reglas |
| CA-7 | Evidencias con descripción en el PDF y 4 ejemplos con URL verificada. | Revisar el PDF |

## 7. Plan de despliegue
- Se renombra el repo, si lo apruebas. La nueva dirección será `https://jazyelae.github.io/MiRecetario-PWA/`; GitHub redirige el repo, pero **no la página de Pages**.
- **Pages** desde la rama `main` (como ahora); se actualizan los enlaces del README y del repo central.
- **Firebase:** no se cambia de proyecto. Solo se publican las nuevas reglas, con tu cuenta.
- Como el sitio cambia de dirección, **la app instalada antes (si la tenías) dejará de funcionar** y se instala de nuevo desde la nueva URL.

## 8. Evidencias
**Automáticas (las tomo yo con Playwright y CDP, sobre el sitio publicado):**
- `01_escritorio.png` · `02_movil.png` (responsive)
- `03_https.png` (URL `https://` y certificado válido, leído con Playwright)
- `04_manifest.png` (manifest leído por Chrome con `Page.getAppManifest`, presentado en una tabla)
- `05_service_worker.png` (estado `activated` y alcance)
- `06_cache_storage.png` (lista real de cachés y archivos)
- `07_instalable.png` (resultado de `getInstallabilityErrors`: sin errores)
- `08_offline.png` (recarga sin red con las recetas visibles) · `09_offline_html.png`
- `10_pwa_real_squoosh.png` (manifest + service worker de una PWA real)

**🙋 Te las pediría a ti** (solo una persona puede tomarlas con la interfaz de Chrome; son opcionales, pero dan más valor):
- `evidencias/SP7/11_devtools_manifest.png`: Chrome → F12 → pestaña **Application** → **Manifest**. Debe verse el nombre, los iconos y «Installability» sin errores.
- `evidencias/SP7/12_dialogo_instalar.png`: el diálogo **«¿Instalar app?»**, que se abre con el icono de instalar en la barra de direcciones.
- `evidencias/SP7/13_ventana_standalone.png`: la app instalada, abierta en **su propia ventana** (sin barra de direcciones).
- **Opcional:** `14_android_instalada.png`, la app instalada en tu teléfono Android.

Si no las tomas, el reporte usa solo las automáticas y lo indica.

## 9. Ejemplos de PWA reales (comprobados el 20/11/2026 con Playwright)
| PWA | URL | Evidencia encontrada |
|---|---|---|
| Mi Recetario (propia) | `https://jazyelae.github.io/MiRecetario-PWA/` | Manifest + SW + offline |
| Squoosh (Google) | https://squoosh.app/ | Manifest + service worker activo |
| Spotify Web Player | https://open.spotify.com/ | Manifest + service worker |
| Uber (web móvil) | https://m.uber.com/ | Manifest |
| Pinterest | https://www.pinterest.com/ | Manifest |

- **Starbucks (`app.starbucks.com`) ya no existe:** el dominio no resuelve, así que se descarta.
- Para el reporte elegiré 3 ejemplos con fuente oficial que los describa como PWA (por ejemplo los casos de web.dev).

**Fuentes de la definición:** web.dev (Learn PWA), MDN (Progressive web apps) y Microsoft Learn (PWA en Edge). Son las 3 del material de lectura.

## 10. Pruebas
_(Se llena después de implementar.)_
