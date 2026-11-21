import * as db from "./db.js";
import { buscarEnLinea } from "./api.js";

const $ = s => document.querySelector(s);
const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const EJEMPLOS = [
  { nombre: "Tacos de papa", emoji: "🌮", categoria: "Antojitos", minutos: 25, dificultad: "Fácil", ingredientes: "papa, tortilla, queso, salsa" },
  { nombre: "Sopa de lentejas", emoji: "🥣", categoria: "Sopas", minutos: 40, dificultad: "Fácil", ingredientes: "lentejas, zanahoria, jitomate, ajo" },
  { nombre: "Guacamole clásico", emoji: "🥑", categoria: "Antojitos", minutos: 10, dificultad: "Muy fácil", ingredientes: "aguacate, cebolla, limón, cilantro" },
  { nombre: "Pollo al horno", emoji: "🍗", categoria: "Platos fuertes", minutos: 60, dificultad: "Media", ingredientes: "pollo, ajo, limón, especias" },
  { nombre: "Arroz rojo", emoji: "🍚", categoria: "Guarniciones", minutos: 30, dificultad: "Fácil", ingredientes: "arroz, jitomate, ajo, caldo" },
  { nombre: "Ensalada fresca", emoji: "🥗", categoria: "Ligeros", minutos: 15, dificultad: "Muy fácil", ingredientes: "lechuga, pepino, jitomate, limón" }
];

let recetas = [], cat = "Todas", texto = "";
let resultadosApi = [];

function categorias() { return ["Todas", ...new Set(recetas.map(r => r.categoria))]; }

function pintarFiltros() {
  $("#filters").innerHTML = categorias().map(c =>
    `<button class="chip ${c === cat ? "on" : ""}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
  document.querySelectorAll(".chip").forEach(b => b.onclick = () => { cat = b.dataset.c; render(); });
}

function tarjeta(r, extra) {
  const meta = [r.minutos ? `<span>⏱ ${esc(r.minutos)} min</span>` : "", r.dificultad ? `<span>${esc(r.dificultad)}</span>` : ""].join("");
  return `<article class="card">
    ${r.imagen ? `<img class="foto" src="${esc(r.imagen)}/preview" alt="${esc(r.nombre)}" loading="lazy">` : `<div class="em">${esc(r.emoji || "🍽️")}</div>`}
    <h3>${esc(r.nombre)}</h3><p>${esc(r.ingredientes)}</p>
    <div class="meta">${meta}</div>${extra || ""}
  </article>`;
}

function render() {
  if (!categorias().includes(cat)) cat = "Todas";
  const lista = recetas.filter(r =>
    (cat === "Todas" || r.categoria === cat) &&
    (r.nombre + " " + r.ingredientes).toLowerCase().includes(texto.toLowerCase()));
  $("#grid").innerHTML = lista.map(r => tarjeta(r, `<button class="mini del" data-id="${esc(r.id)}">Borrar</button>`)).join("") ||
    "<p>No hay recetas todavía. Agrega una, guarda una desde la búsqueda en línea o carga los ejemplos.</p>";
  $("#count").textContent = lista.length + " receta(s) encontrada(s)";
  $("#seed").hidden = recetas.length > 0;
  pintarFiltros();
  document.querySelectorAll(".del").forEach(b => b.onclick = async () => {
    if (confirm("¿Borrar esta receta?")) {
      try { await guardarSinEsperar(db.borrarReceta(b.dataset.id), "Receta borrada."); }
      catch (e) { avisar(e.code === "permission-denied"
        ? "Solo se puede borrar una receta en los 10 minutos siguientes a crearla." : "No se pudo borrar: " + e.message, true); }
    }
  });
}

function avisar(msg, error = false) {
  const el = $("#aviso"); el.textContent = msg; el.className = "aviso " + (error ? "err" : "ok"); el.hidden = false;
  clearTimeout(avisar.t); avisar.t = setTimeout(() => el.hidden = true, 4000);
}

$("#q").addEventListener("input", e => { texto = e.target.value; render(); });

$("#seed").onclick = async () => {
  try { for (const r of EJEMPLOS) await db.agregarReceta({ ...r, origen: "ejemplo" }); avisar("Recetas de ejemplo cargadas."); }
  catch (e) { avisar("No se pudieron cargar: " + e.message, true); }
};

$("#formReceta").addEventListener("submit", async e => {
  e.preventDefault();
  const r = {
    nombre: $("#rNombre").value.trim(), emoji: "🍽️", categoria: $("#rCat").value.trim() || "Otras",
    minutos: Number($("#rMin").value) || null, dificultad: $("#rDif").value,
    ingredientes: $("#rIng").value.trim(), origen: "manual"
  };
  try { e.target.reset(); await guardarSinEsperar(db.agregarReceta(r), "Receta guardada."); }
  catch (err) { avisar("No se pudo guardar: " + err.message, true); }
});

$("#formApi").addEventListener("submit", async e => {
  e.preventDefault();
  const q = $("#qApi").value.trim(); if (!q) return;
  if (!navigator.onLine) { $("#estadoApi").textContent = "La búsqueda en TheMealDB necesita Internet. Tus recetas guardadas sí están disponibles."; return; }
  $("#estadoApi").textContent = "Buscando en TheMealDB…"; $("#gridApi").innerHTML = "";
  try {
    resultadosApi = await buscarEnLinea(q);
    $("#estadoApi").textContent = resultadosApi.length ? resultadosApi.length + " resultado(s)." : "Sin resultados. Prueba con un nombre en inglés (chicken, pasta, beef…).";
    $("#gridApi").innerHTML = resultadosApi.map((r, i) => tarjeta(r, `<button class="mini add" data-i="${i}">Guardar en mi recetario</button>`)).join("");
    document.querySelectorAll(".add").forEach(b => b.onclick = async () => {
      try { b.textContent = "✓ Guardada"; b.disabled = true; await guardarSinEsperar(db.agregarReceta(resultadosApi[b.dataset.i])); }
      catch (err) { avisar("No se pudo guardar: " + err.message, true); }
    });
  } catch (err) {
    $("#estadoApi").textContent = "No se pudo consultar el servicio (revisa tu conexión). " + err.message;
  }
});

$("#form").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await guardarSinEsperar(db.agregarSugerencia({ nombre: $("#nombre").value.trim(), correo: $("#correo").value.trim(), mensaje: $("#msg").value.trim() }));
    const ok = $("#ok"); ok.hidden = false; ok.textContent = "¡Gracias, " + $("#nombre").value + "! Tu sugerencia fue registrada.";
    e.target.reset();
  } catch (err) { avisar("No se pudo enviar: " + err.message, true); }
});

// Sin conexión, Firestore guarda el cambio en el dispositivo al instante, pero la promesa no termina
// hasta que el servidor lo confirma (al volver la red). Por eso, sin red no se espera: se avisa y se sigue.
async function guardarSinEsperar(promesa, mensaje) {
  if (!navigator.onLine) {
    promesa.catch(err => avisar("No se pudo sincronizar: " + err.message, true));
    avisar("Guardado en tu dispositivo; se enviará a Firebase cuando vuelva la conexión.");
    return;
  }
  await promesa;
  if (mensaje) avisar(mensaje);
}

// Indicador de conexión: la app sigue funcionando sin red con las recetas guardadas.
const modo = await db.iniciar();
let desdeCache = false;
function mostrarEstado() {
  const el = $("#modo");
  if (modo !== "firebase") { el.textContent = "● Modo local (Firebase sin configurar)"; el.className = "modo local"; return; }
  if (!navigator.onLine) { el.textContent = "● Sin conexión · mostrando recetas guardadas"; el.className = "modo offline"; }
  // Hay red local pero Firestore solo responde desde la caché (por ejemplo, wifi sin Internet).
  else if (desdeCache) { el.textContent = "● Sin conexión con Firebase · mostrando recetas guardadas"; el.className = "modo offline"; }
  else { el.textContent = "● Conectado a Firebase"; el.className = "modo firebase"; }
}
window.addEventListener("online", () => { mostrarEstado(); avisar("Conexión recuperada."); });
window.addEventListener("offline", () => { mostrarEstado(); avisar("Sin conexión: puedes seguir viendo tus recetas.", true); });
mostrarEstado();
db.suscribirRecetas((l, cache) => { recetas = l; desdeCache = !!cache; mostrarEstado(); render(); },
  err => avisar("Error de base de datos: " + err.message, true));
