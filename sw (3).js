// Service worker: tiene una copia dell'app sul telefono, così si apre anche senza rete
// (per esempio nel garage di Gente di Mare). Le chiamate allo script Google non passano di qui.
var CACHE = "magazzino-vini-v2";
var FILE = ["./", "./index.html", "./manifest.json", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (chiavi) {
    return Promise.all(chiavi.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;   // script Google: passa diretto
  // prima prova la rete (così gli aggiornamenti arrivano), se manca usa la copia salvata
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copia = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (r) { return r || caches.match("./index.html"); });
    })
  );
});
