const CACHE_NAME = "gram-vidya-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/register.html",
  "/student-dashboard.html",
  "/admin-dashboard.html",
  "/otput.css"
  
];

// Install service worker
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch from cache first, then network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Activate service worker and clean old caches
self.addEventListener("activate", event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(keyList => 
      Promise.all(keyList.map(key => {
        if(!cacheWhitelist.includes(key)) return caches.delete(key);
      }))
    )
  );
});
