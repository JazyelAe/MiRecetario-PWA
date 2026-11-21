// Capa de datos: usa Firebase Firestore si está configurado; si no, guarda en localStorage.
import { firebaseConfig, configurado } from "./firebase-config.js";

const V = "10.12.2";
let fs = null;
let base = null;
export let modo = "local";

const escuchas = [];
const LS = "recetario.recetas";
const leerLocal = () => JSON.parse(localStorage.getItem(LS) || "[]");
const guardarLocal = l => { localStorage.setItem(LS, JSON.stringify(l)); escuchas.forEach(cb => cb(l)); };

export async function iniciar() {
  if (!configurado) return modo;
  try {
    const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
    fs = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
    // Caché persistente de Firestore (IndexedDB): las recetas se guardan en el dispositivo, se ven SIN CONEXIÓN
    // y lo que se agrega sin red se envía solo cuando vuelve la conexión. Funciona con varias pestañas abiertas.
    base = fs.initializeFirestore(initializeApp(firebaseConfig), {
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() })
    });
    modo = "firebase";
  } catch (e) {
    console.error("No se pudo cargar Firebase, se usa el modo local:", e);
  }
  return modo;
}

export function suscribirRecetas(cb, onError) {
  if (modo === "firebase") {
    const q = fs.query(fs.collection(base, "recetas"), fs.orderBy("creada", "desc"));
    // includeMetadataChanges: avisa también cuando los datos vienen de la caché local (sin conexión).
    return fs.onSnapshot(q, { includeMetadataChanges: true },
      snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() })), snap.metadata.fromCache),
      err => onError && onError(err));
  }
  escuchas.push(cb); cb(leerLocal());
}

export async function agregarReceta(r) {
  if (modo === "firebase") {
    return fs.addDoc(fs.collection(base, "recetas"), { ...r, creada: fs.serverTimestamp() });
  }
  guardarLocal([{ ...r, id: String(Date.now() + Math.random()) }, ...leerLocal()]);
}

export async function borrarReceta(id) {
  if (modo === "firebase") return fs.deleteDoc(fs.doc(base, "recetas", id));
  guardarLocal(leerLocal().filter(r => r.id !== id));
}

export async function agregarSugerencia(s) {
  if (modo === "firebase") {
    return fs.addDoc(fs.collection(base, "sugerencias"), { ...s, creada: fs.serverTimestamp() });
  }
  const l = JSON.parse(localStorage.getItem("recetario.sugerencias") || "[]");
  l.push({ ...s, creada: new Date().toISOString() });
  localStorage.setItem("recetario.sugerencias", JSON.stringify(l));
}
