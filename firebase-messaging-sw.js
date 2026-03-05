import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getMessaging, onBackgroundMessage } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-sw.js';

const swUrl = new URL(self.location.href);

const firebaseConfig = {
    apiKey: swUrl.searchParams.get('apiKey') || '',
    authDomain: swUrl.searchParams.get('authDomain') || '',
    projectId: swUrl.searchParams.get('projectId') || '',
    storageBucket: swUrl.searchParams.get('storageBucket') || '',
    messagingSenderId: swUrl.searchParams.get('messagingSenderId') || '',
    appId: swUrl.searchParams.get('appId') || '',
};

const hasFirebaseConfig = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
    .every((key) => typeof firebaseConfig[key] === 'string' && firebaseConfig[key].length > 0);

if (hasFirebaseConfig) {
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    onBackgroundMessage(messaging, (payload) => {
        const title = payload?.notification?.title || payload?.data?.title || 'MenuNova';
        const body = payload?.notification?.body || payload?.data?.body || '';
        const icon = payload?.notification?.icon || '/favicon.ico';

        self.registration.showNotification(title, {
            body,
            icon,
            data: payload?.data || {},
            tag: payload?.data?.tag || 'mn-fcm-background',
        });
    });
}

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification?.data?.url || '/';

    event.waitUntil((async () => {
        const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of allClients) {
            if ('focus' in client) {
                await client.focus();
                if ('navigate' in client) await client.navigate(targetUrl);
                return;
            }
        }
        if (clients.openWindow) await clients.openWindow(targetUrl);
    })());
});
