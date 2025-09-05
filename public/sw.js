// Aurelia Prayer App - Service Worker
// Enables offline functionality and caching

const CACHE_NAME = 'aurelia-v1.0.0';
const STATIC_CACHE = 'aurelia-static-v1.0.0';
const DYNAMIC_CACHE = 'aurelia-dynamic-v1.0.0';

// Files to cache for offline use
const STATIC_FILES = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/favicon.ico',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Static files cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Error caching static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => {
                            return cacheName !== STATIC_CACHE && 
                                   cacheName !== DYNAMIC_CACHE;
                        })
                        .map(cacheName => {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached files and handle offline
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different types of requests
    if (request.method === 'GET') {
        if (isStaticFile(request.url)) {
            // Static files - cache first strategy
            event.respondWith(cacheFirst(request));
        } else if (isAPIRequest(request.url)) {
            // API requests - network first with fallback
            event.respondWith(networkFirstWithFallback(request));
        } else if (isFirebaseRequest(request.url)) {
            // Firebase requests - network only
            event.respondWith(networkOnly(request));
        } else {
            // Other requests - network first
            event.respondWith(networkFirst(request));
        }
    }
});

// Cache first strategy for static files
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache first strategy failed:', error);
        return new Response('Offline - Content not available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Network first strategy for dynamic content
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', request.url);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }
        
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Network first with offline fallback for API requests
async function networkFirstWithFallback(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.log('API request failed, providing offline fallback');
        
        // Return cached offline prayer response
        return new Response(JSON.stringify({
            prayer: getOfflinePrayer(),
            offline: true
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Network only for Firebase requests
async function networkOnly(request) {
    return fetch(request);
}

// Helper functions
function isStaticFile(url) {
    return STATIC_FILES.some(file => url.includes(file)) ||
           url.includes('.css') ||
           url.includes('.js') ||
           url.includes('.png') ||
           url.includes('.ico') ||
           url.includes('.json');
}

function isAPIRequest(url) {
    return url.includes('/.netlify/functions/') ||
           url.includes('/api/');
}

function isFirebaseRequest(url) {
    return url.includes('firebase') ||
           url.includes('firestore') ||
           url.includes('googleapis.com');
}

function getOfflinePrayer() {
    const offlinePrayers = [
        "Divine presence, grant me peace and strength in this moment of disconnection. Help me find serenity within and trust in your eternal guidance. Amen.",
        "Lord, even when technology fails, your love remains constant. Fill my heart with patience and my spirit with hope. Guide me through this time. Amen.",
        "Gracious God, in times when I cannot reach out digitally, remind me that you are always within reach. Grant me comfort and wisdom. Amen."
    ];
    
    return offlinePrayers[Math.floor(Math.random() * offlinePrayers.length)];
}

// Background sync for offline prayer submissions
self.addEventListener('sync', event => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'prayer-submission') {
        event.waitUntil(syncOfflinePrayers());
    }
});

async function syncOfflinePrayers() {
    try {
        // Get offline prayers from IndexedDB or localStorage
        const offlinePrayers = await getOfflinePrayers();
        
        for (const prayer of offlinePrayers) {
            try {
                await submitPrayerToServer(prayer);
                await removeOfflinePrayer(prayer.id);
                console.log('Synced offline prayer:', prayer.id);
            } catch (error) {
                console.error('Failed to sync prayer:', prayer.id, error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push notification support for prayer reminders
self.addEventListener('push', event => {
    console.log('Push notification received');
    
    const options = {
        body: 'Time for your daily prayer moment 🙏',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/',
            action: 'prayer-reminder'
        },
        actions: [
            {
                action: 'pray-now',
                title: 'Pray Now',
                icon: '/icon-192.png'
            },
            {
                action: 'remind-later',
                title: 'Remind Later'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Aurelia Prayer Reminder', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'pray-now') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'remind-later') {
        // Schedule another reminder in 30 minutes
        setTimeout(() => {
            self.registration.showNotification('Aurelia Prayer Reminder', {
                body: 'Ready for your prayer moment? 🙏',
                icon: '/icon-192.png'
            });
        }, 30 * 60 * 1000);
    } else {
        // Default action - open app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Helper functions for offline storage
async function getOfflinePrayers() {
    // Implementation would use IndexedDB
    return [];
}

async function submitPrayerToServer(prayer) {
    // Implementation would submit to your API
    return fetch('/.netlify/functions/generate-prayer', {
        method: 'POST',
        body: JSON.stringify(prayer)
    });
}

async function removeOfflinePrayer(prayerId) {
    // Implementation would remove from IndexedDB
    console.log('Removing offline prayer:', prayerId);
}
