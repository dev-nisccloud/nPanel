// Service Worker for nPanel - Notifications + PWA Caching
const CACHE_NAME = 'npanel-v2';
const OFFLINE_URL = '/offline';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
    '/',
    '/offline',
    '/nisclogowhite.png',
    '/favicon/favicon.ico',
    '/favicon/apple-touch-icon.png',
    '/manifest',
];

let lastTotalUnreadCount = 0;
let pollingInterval = null;

// Helper to broadcast to all tabs
async function broadcastMessage(type, payload) {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type, payload });
    });
}

// Background polling function
async function checkNewMessages() {
    try {
        // Poll the TRPC endpoint for ticket list
        // Note: We use the same format TRPC uses for httpBatchLink
        const response = await fetch('/api/trpc/tickets.getList?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22limit%22%3A100%2C%22offset%22%3A0%7D%7D%7D');
        if (!response.ok) return;

        const data = await response.json();
        const tickets = data[0]?.result?.data?.json || [];

        const totalUnreadCount = tickets.reduce((acc, t) => acc + (t.unreadCount || 0), 0);

        if (totalUnreadCount > lastTotalUnreadCount) {
            // Find the new message for the notification
            const ticketWithNew = tickets.find(t => t.unreadCount > 0);

            if (ticketWithNew) {
                // Show notification from SW (works even if tab is minimized)
                self.registration.showNotification(`New Message from ${ticketWithNew.customerName || "Customer"}`, {
                    body: ticketWithNew.lastMessage || "Click to view message",
                    icon: "/favicon/favicon.ico",
                    tag: ticketWithNew.id,
                    renotify: true,
                    data: { ticketId: ticketWithNew.id }
                });

                // Notify active tabs to play sound
                broadcastMessage('NEW_MESSAGE', { ticketId: ticketWithNew.id });
            }
        }

        lastTotalUnreadCount = totalUnreadCount;
    } catch (error) {
        console.error('Background polling failed:', error);
    }
}

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.error('Precache failed:', err);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName !== CACHE_NAME)
                        .map((cacheName) => caches.delete(cacheName))
                );
            }),
            // Take control of all clients
            clients.claim()
        ])
    );

    // Start polling when activated
    if (!pollingInterval) {
        // Initial check
        checkNewMessages();
        // Poll every 15 seconds in the background
        pollingInterval = setInterval(checkNewMessages, 15000);
    }
});

// Fetch event - PWA caching strategy
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }
    // Only handle http(s); Cache API does not support chrome-extension:, etc.
    if (!event.request.url.startsWith('http')) {
        return;
    }

    // For document navigations, always follow redirects so we never return a redirect
    // response to the client (avoids "redirected response was used for a request whose
    // redirect mode is not 'follow'" which breaks the page).
    const isNavigate = event.request.mode === 'navigate';
    const fetchRequest = isNavigate
        ? new Request(event.request, { redirect: 'follow' })
        : event.request;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(fetchRequest)
                .then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();
                    const url = event.request.url;
                    if (url.startsWith('http') && !url.includes('/api/')) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        }).catch(function () {});
                    }

                    return response;
                })
                .catch(() => {
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL) || caches.match('/');
                    }
                    return new Response('Offline', { status: 503 });
                });
        })
    );
});
