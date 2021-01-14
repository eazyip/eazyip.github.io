const iteration = 9;
let CACHE_STATIC_NAME = "static" + iteration;
let CACHE_DYNAMIC_NAME = "dynamic" + iteration;

staticCache = [
    "/app.html",
    "/js/index.js",
    "/js/app.js",
    "/js/app_style.js",
    "/css/style.css",
    "/css/app.css",
    "/css/fontawesome_free_5.13.0_we_all.min.css",
];

self.addEventListener("install", function (event) {
    console.log("[Service Worker] Installing Service Worker ...", event);
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME).then(function (cache) {
            console.log("[Service Worker] Precaching App Shell");
            cache.addAll(staticCache);
        })
    );
});

self.addEventListener("activate", function (event) {
    console.log("[Service Worker] Activating Service Worker ....", event);
    event.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(
                keyList.map(function (key) {
                    if (
                        key !== CACHE_STATIC_NAME &&
                        key !== CACHE_DYNAMIC_NAME
                    ) {
                        console.log(
                            "[Service Worker] Removing old cache.",
                            key
                        );
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener("fetch", function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            if (response) {
                return response;
            } else {
                return fetch(event.request)
                    .then(function (res) {
                        return caches
                            .open(CACHE_DYNAMIC_NAME)
                            .then(function (cache) {
                                cache.put(event.request.url, res.clone());
                                return res;
                            });
                    })
                    .catch(function (err) {});
            }
        })
    );
});
//*
