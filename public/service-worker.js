const CACHE_NAME = 'beyco-v3-cache'; // Versiyonu değiştirdik, eskisi çöpe gidecek
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
];

// Uygulama Kurulurken
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Yeni sw anında devreye girsin
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('BEYCO GAMES: Yeni dosyalar önbelleğe alınıyor...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Eski İnatçı Hafızayı (Cache) Silen Kod
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('BEYCO GAMES: Eski önbellek temizlendi!');
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// GELİŞTİRİCİ MODU: Önce her zaman güncel kodu çek! (Network First)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
