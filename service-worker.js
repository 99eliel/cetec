const CACHE_NAME = "cetec-matriculas-v3-interface-profissional";
const APP_FILES = [
  "./",
  "./index.html",
  "./dashboard.html",
  "./matricula.html",
  "./consulta.html",
  "./cursos.html",
  "./importador.html",
  "./style.css",
  "./api.js",
  "./firebase-config.js",
  "./pwa.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
