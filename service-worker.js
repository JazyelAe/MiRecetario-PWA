// Service Worker de Mi Recetario: hace que la app se pueda instalar y abrir SIN CONEXIÓN.
//
// Estrategia según el tipo de petición:
//  1) Páginas (navegación) ............ NETWORK FIRST: la versión más nueva; sin red, la copia guardada y, si no hay, offline.html
//  2) Archivos de la app (CSS, JS, iconos) CACHE FIRST: salen de la caché al instante (se actualizan al cambiar VERSION)
//  3) SDK de Firebase (gstatic.com) ..... CACHE FIRST: la URL lleva la versión (10.12.2) y nunca cambia
//  4) Fotos de TheMealDB ................ STALE-WHILE-REVALIDATE: se muestra la guardada y se actualiza por detrás
//  Las recetas de Firestore NO pasan por aquí: Firestore tiene su propia caché offline (ver js/db.js).
//
// IMPORTANTE: cada vez que cambies un archivo de la app, sube VERSION para que los usuarios reciban la nueva versión.
const VERSION = "v2";
const CACHE_APP = "recetario-app-" + VERSION;
const CACHE_FOTOS = "recetario-fotos";
const MAX_FOTOS = 40;

const FIREBASE = "https://www.gstatic.com/firebasejs/10.12.2/";
const ARCHIVOS_APP = [
  "./",
  "./index.html",
  "./offline.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/db.js",
  "./js/api.js",
  "./js/firebase-config.js",
  "./js/pwa.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  FIREBASE + "firebase-app.js",
  FIREBASE + "firebase-firestore.js"
];

// Instalación: descarga y guarda todo lo necesario para abrir la app sin red.
self.addEventListener("install", evento => {
  evento.waitUntil(
    caches.open(CACHE_APP).then(cache => cache.addAll(ARCHIVOS_APP)).then(() => self.skipWaiting())
  );
});

// Activación: borra las cachés de versiones anteriores y toma el control de las pestañas abiertas.
self.addEventListener("activate", evento => {
  evento.waitUntil(
    caches.keys()
      .then(nombres => Promise.all(nombres
        .filter(n => n.startsWith("recetario-") && n !== CACHE_APP && n !== CACHE_FOTOS)
        .map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", evento => {
  const peticion = evento.request;
  if (peticion.method !== "GET") return;   // las escrituras no se interceptan
  const url = new URL(peticion.url);

  if (peticion.mode === "navigate") {
    evento.respondWith(redPrimero(peticion));
  } else if (url.origin === self.location.origin || url.href.startsWith(FIREBASE)) {
    evento.respondWith(cachePrimero(peticion));
  } else if (url.hostname.endsWith("themealdb.com") && url.pathname.startsWith("/images/")) {
    evento.respondWith(fotoGuardadaYActualizar(evento));
  }
  // Todo lo demás (Firestore, API de TheMealDB) va directo a la red.
});

// 1) Network first para las páginas.
async function redPrimero(peticion) {
  const cache = await caches.open(CACHE_APP);
  try {
    const respuesta = await fetch(peticion);
    if (respuesta.ok) cache.put(peticion, respuesta.clone());
    return respuesta;
  } catch {
    return (await cache.match(peticion, { ignoreSearch: true }))
      || (await cache.match("./offline.html"));
  }
}

// 2 y 3) Cache first para los archivos de la app y el SDK de Firebase.
async function cachePrimero(peticion) {
  const guardada = await caches.match(peticion);
  if (guardada) return guardada;
  const respuesta = await fetch(peticion);
  if (respuesta.ok) (await caches.open(CACHE_APP)).put(peticion, respuesta.clone());
  return respuesta;
}

// 4) Stale-while-revalidate para las fotos, con un máximo de MAX_FOTOS.
async function fotoGuardadaYActualizar(evento) {
  const cache = await caches.open(CACHE_FOTOS);
  const guardada = await cache.match(evento.request);
  const descarga = fetch(evento.request).then(async respuesta => {
    await cache.put(evento.request, respuesta.clone());
    const claves = await cache.keys();
    if (claves.length > MAX_FOTOS) await cache.delete(claves[0]);   // borra la más antigua
    return respuesta;
  }).catch(() => guardada);
  evento.waitUntil(descarga);
  return guardada || descarga;
}
