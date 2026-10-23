var CACHE_PREFIX = 'zgzs-' + encodeURIComponent(self.registration.scope) + '-';
var CACHE = CACHE_PREFIX + '8e44c069';
var ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  var isPage = req.mode === 'navigate' || req.destination === 'document';
  e.respondWith(caches.open(CACHE).then(function (cache) {
    var fromCache = function () {
      return cache.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || cache.match('./index.html') || cache.match('./');
      });
    };
    var fromNet = fetch(req).then(function (res) {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    });
    // 打开页面时优先用网上的新版本；断网才用缓存
    if (isPage) return fromNet.catch(fromCache);
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      fromNet.catch(function () { });
      return hit || fromNet;
    });
  }));
});
