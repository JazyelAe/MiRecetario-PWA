# Mi Recetario · Aplicación web progresiva (PWA)

Recetario de cocina casera que **se instala** como una app y **funciona sin conexión**. Usa Firebase Firestore como base de datos y la API pública TheMealDB para buscar recetas en línea.

> Subproducto No. 7 · Aplicaciones Web Progresivas · Unidad I · Jahir Jaziel Serrano Arana · 10° D

**App:** https://jazyelae.github.io/MiRecetario-PWA/

## De app web a PWA (relación con el Subproducto 2)
El SP2, [Mi_Recetario](https://github.com/JazyelAe/Mi_Recetario), es una **app web**: necesita Internet, vive en una pestaña y guarda en `localStorage`. Esta versión es su evolución:

| | App web (SP2) | PWA (SP7) |
|---|---|---|
| Datos | JSON local + `localStorage` | Firebase Firestore con **caché persistente offline** |
| Sin Internet | No abre | Abre y muestra las recetas guardadas |
| Instalación | No | Sí: icono propio y ventana independiente |
| Archivos de la app | Se descargan siempre | Service worker + Cache Storage |

## ¿Qué la hace PWA?
| Característica | Cómo se cumple |
|---|---|
| **Instalable** | [`manifest.json`](manifest.json): `name`, `short_name`, `start_url`, `scope`, `display: standalone`, colores, iconos 192/512, **icono maskable** y `screenshots` |
| **Funciona sin conexión** | [`service-worker.js`](service-worker.js) + caché persistente de Firestore + [`offline.html`](offline.html) |
| **Segura** | Servida por HTTPS (GitHub Pages) |
| **Responsive** | Se adapta a teléfono y computadora |
| **Actualizable** | Al subir `VERSION` en el service worker, se borra la caché vieja y se descarga la nueva |
| **Re-engageable** | Avisa al perder o recuperar la conexión |

### Estrategias de caché del service worker
| Tipo de petición | Estrategia | Por qué |
|---|---|---|
| Páginas (navegación) | **Network first** → copia guardada → `offline.html` | Siempre la versión más nueva si hay red |
| CSS, JS, iconos, manifest | **Cache first** (`recetario-app-v2`) | Abren al instante; se renuevan al cambiar la versión |
| SDK de Firebase (gstatic, v10.12.2) | **Cache first** | La URL lleva la versión y nunca cambia |
| Fotos de TheMealDB | **Stale-while-revalidate** (`recetario-fotos`, máximo 40) | Se ve la guardada y se actualiza por detrás |
| Recetas (Firestore) | Caché persistente de Firestore (IndexedDB) | Lo que se agrega sin red se sincroniza al volver la conexión |

## Instalarla
- **Computadora (Chrome o Edge):** abre la app y pulsa el icono **Instalar** de la barra de direcciones (o menú ⋮ → *Instalar Mi Recetario*).
- **Android (Chrome):** menú ⋮ → **Agregar a la pantalla principal** → **Instalar**.
- **iPhone (Safari):** Compartir → **Agregar a inicio**.

## Estructura
```
index.html            interfaz
offline.html          página que se muestra sin red si la página pedida no estaba guardada
manifest.json         datos para instalar la app
service-worker.js     caché y funcionamiento sin conexión
js/pwa.js             registra el service worker
js/app.js             lógica de la interfaz e indicador de conexión
js/db.js              Firestore con caché persistente (o localStorage si no hay Firebase)
js/api.js             búsqueda en TheMealDB
js/firebase-config.js configuración web de Firebase (no es secreta; la protegen las reglas)
firestore.rules       reglas de seguridad de Firestore
icons/, screenshots/  iconos (incluido el maskable) y capturas del manifest
```

## Reglas de Firestore ([`firestore.rules`](firestore.rules))
- **Recetas:**
  - lectura pública;
  - altas solo con campos y tamaños válidos, con la fecha que pone el servidor;
  - **se pueden borrar solo durante los 10 minutos siguientes a crearlas** (para deshacer un error, sin que nadie vacíe el catálogo);
  - no se editan.
- **Sugerencias:** solo se pueden crear; se leen desde la consola de Firebase.

## Ejecutar en tu computadora
Los módulos de JavaScript y el service worker necesitan un servidor (no basta con doble clic):
```bash
python -m http.server 8000
# abrir http://localhost:8000/
```

## Tecnologías
HTML, CSS y JavaScript (módulos ES) · Web App Manifest · Service Worker API · Cache Storage · Firebase Firestore 10.12 (caché persistente) · TheMealDB · GitHub Pages.
