// Background notifications for new support messages.
// This worker does not cache pages or assets. Caching the app shell
// served stale HTML after deploys.

let lastTotalUnreadCount = 0;
let pollingInterval = null;

async function broadcastMessage(type, payload) {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type, payload });
    });
}

async function checkNewMessages() {
    try {
        const response = await fetch('/api/trpc/tickets.getList?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22limit%22%3A100%2C%22offset%22%3A0%7D%7D%7D');
        if (!response.ok) return;

        const data = await response.json();
        const tickets = data[0]?.result?.data?.json || [];

        const totalUnreadCount = tickets.reduce((acc, t) => acc + (t.unreadCount || 0), 0);

        if (totalUnreadCount > lastTotalUnreadCount) {
            const ticketWithNew = tickets.find(t => t.unreadCount > 0);

            if (ticketWithNew) {
                self.registration.showNotification(`New Message from ${ticketWithNew.customerName || "Customer"}`, {
                    body: ticketWithNew.lastMessage || "Click to view message",
                    icon: "/favicon/favicon.ico",
                    tag: ticketWithNew.id,
                    renotify: true,
                    data: { ticketId: ticketWithNew.id }
                });

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

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))),
            clients.claim(),
        ])
    );

    if (!pollingInterval) {
        checkNewMessages();
        pollingInterval = setInterval(checkNewMessages, 15000);
    }
});
