const CACHE_NAME = 'lakeside-retreat-v4';

// Only cache static assets - NOT HTML files
// HTML should always be fetched fresh to get latest CSP headers and content
const urlsToCache = [
    '/images/logormbg.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .catch((err) => {
                console.warn('Service worker cache failed:', err);
            })
    );
    // Skip waiting to activate immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Clean up ALL old caches on activation
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => {
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle same-origin requests to avoid CSP issues
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Never intercept admin pages or API calls — let them go direct to the network
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) {
        return;
    }

    // Leave page loads (HTML) to the browser. HTML is never cached, so the
    // worker has no offline copy to offer. It used to fall back to
    // caches.match('/'), which always resolved to undefined, and handing
    // undefined to respondWith() turned every failed page load into
    // "TypeError: Failed to convert value to 'Response'" instead of the
    // browser's normal offline page.
    if (event.request.mode === 'navigate' ||
        event.request.destination === 'document' ||
        event.request.url.endsWith('/') ||
        event.request.url.endsWith('.html')) {
        return;
    }

    // For other requests (images, scripts, etc.), use cache-first. If both
    // the cache and the network fail, answer with a proper network error
    // rather than undefined (or an HTML page standing in for an image).
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
            .catch(() => Response.error())
    );
});
