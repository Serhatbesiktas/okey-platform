const CACHE_NAME = 'beyco-v2-cache';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/tema.css',
    '/css/auth.css',
    '/css/lobi.css',
    '/css/masa.css',
    '/css/modal.css',
    '/css/animations.css'
    // İleride diğer JS dosyaları da eklenebilir
];

// Uygulama Kurulurken Dosyaları Hafızaya Al
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('BEYCO GAMES: Dosyalar önbelleğe alınıyor...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// İnternet Yokken veya Yavaşken Hafızadan Hızlıca Aç
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
