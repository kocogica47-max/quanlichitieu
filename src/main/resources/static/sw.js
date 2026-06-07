/**
 * Service Worker — Quản Lý Chi Tiêu PWA
 *
 * Chiến lược:
 * - Static assets (CSS, JS, fonts, icons): Cache First → luôn nhanh
 * - API calls (/api/*, /deleteExpense, /saveExpense...): Network First
 *   → dữ liệu luôn mới nhất, fallback cache nếu offline
 * - HTML pages: Network First → hiển thị offline page nếu không có mạng
 */

const CACHE_NAME    = 'chitieu-v1';
const OFFLINE_URL   = '/offline';

// Assets cần cache ngay khi install
const PRECACHE = [
    '/css/theme-variables.css',
    '/js/theme-toggle.js',
    '/js/login-bg.js',
    '/js/premium-effects.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
];

// ── Install: precache static assets ──────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Dùng addAll với cache: 'reload' để bỏ qua cache HTTP cũ
            return cache.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' })));
        })
    );
    self.skipWaiting();
});

// ── Activate: xóa cache cũ ───────────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// ── Fetch: routing strategy ───────────────────────────────────────────────
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Bỏ qua non-GET và cross-origin
    if (request.method !== 'GET') return;
    if (url.origin !== location.origin) return;

    // API & dynamic HTML → Network First
    if (url.pathname.startsWith('/api/') ||
        url.pathname === '/' ||
        url.pathname.startsWith('/showNewExpenseForm') ||
        url.pathname.startsWith('/login') ||
        url.pathname.startsWith('/register')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Static assets → Cache First
    event.respondWith(cacheFirst(request));
});

// Network First: thử network → nếu fail thì dùng cache
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            // Clone vì response chỉ đọc 1 lần
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached || caches.match('/offline') || new Response(
            '<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0f0f23;color:#fff">' +
            '<h2>📶 Không có kết nối</h2><p>Vui lòng kiểm tra internet và thử lại.</p>' +
            '<button onclick="location.reload()" style="padding:12px 24px;background:#6366f1;color:#fff;border:none;border-radius:10px;font-size:1rem;cursor:pointer">Thử lại</button>' +
            '</body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    }
}

// Cache First: dùng cache → nếu không có thì fetch và cache
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('', { status: 408 });
    }
}
