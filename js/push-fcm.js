import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getMessaging, getToken, onMessage, isSupported } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js';

const cfg = window.AppConfig || window.RestaurantConfig || {};

const firebaseConfig = cfg.FIREBASE_CONFIG || {};
const vapidKey = cfg.FIREBASE_VAPID_KEY || '';
const hasFirebaseConfig = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
    .every((key) => typeof firebaseConfig[key] === 'string' && firebaseConfig[key].length > 0);

const isAdminPage = window.location.pathname.startsWith('/admin');
const isMenuPage = window.location.pathname.startsWith('/menu');

const getCustomerPhone = () => {
    if (!cfg.storageKey) return '';
    return (
        localStorage.getItem(cfg.storageKey('customer_phone')) ||
        localStorage.getItem(cfg.storageKey('customerPhone')) ||
        ''
    ).trim();
};

const getRoleAndIdentifier = () => {
    if (isAdminPage) {
        const token = localStorage.getItem('admin_token') || localStorage.getItem('adminToken') || '';
        if (!token) return null;
        return { role: 'admin', identifier: 'admin' };
    }

    if (isMenuPage) {
        const phone = getCustomerPhone();
        if (!phone) return null;
        return { role: 'customer', identifier: phone };
    }

    return null;
};

const requestPermission = async () => {
    if (typeof Notification === 'undefined') return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';

    try {
        return await Notification.requestPermission();
    } catch {
        return 'default';
    }
};

const registerDeviceToken = async (role, identifier, token) => {
    if (!window.MenuNovaAPI || !cfg.initialized) return;

    try {
        await MenuNovaAPI.request('/register-device', {
            method: 'POST',
            body: { role, identifier, token },
        });
    } catch (error) {
        console.warn('[FCM] register-device failed:', error?.message || error);
    }
};

const wireForegroundMessage = (messaging) => {
    onMessage(messaging, (payload) => {
        const title = payload?.notification?.title || payload?.data?.title || 'MenuNova';
        const body = payload?.notification?.body || payload?.data?.body || '';

        if (typeof window.showToast === 'function') {
            window.showToast(`${title}${body ? ` — ${body}` : ''}`);
        }

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
            try {
                new Notification(title, { body, tag: 'mn-fcm-foreground' });
            } catch {}
        }
    });
};

const bootFcm = async () => {
    if (!cfg.initialized || !hasFirebaseConfig || !vapidKey) return;

    const supported = await isSupported().catch(() => false);
    if (!supported) return;

    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const swQuery = new URLSearchParams({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
    });

    let swRegistration;
    try {
        swRegistration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swQuery.toString()}`, { type: 'module' });
    } catch (error) {
        console.warn('[FCM] service worker registration failed:', error?.message || error);
        return;
    }

    wireForegroundMessage(messaging);

    let lastRegisteredIdentifier = null;
    let lastRegisteredToken = null;

    const ensureRegistration = async () => {
        const roleInfo = getRoleAndIdentifier();
        if (!roleInfo) return;

        const permission = await requestPermission();
        if (permission !== 'granted') return;

        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: swRegistration,
        }).catch((error) => {
            console.warn('[FCM] getToken failed:', error?.message || error);
            return '';
        });

        if (!token) return;

        if (lastRegisteredIdentifier === roleInfo.identifier && lastRegisteredToken === token) return;

        await registerDeviceToken(roleInfo.role, roleInfo.identifier, token);
        lastRegisteredIdentifier = roleInfo.identifier;
        lastRegisteredToken = token;
    };

    await ensureRegistration();

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) ensureRegistration();
    });

    window.addEventListener('focus', () => {
        ensureRegistration();
    });

    document.addEventListener('customer:updated', () => {
        ensureRegistration();
    });

    document.addEventListener('click', () => {
        ensureRegistration();
    }, { once: true });

    if (isMenuPage) {
        setInterval(ensureRegistration, 8000);
    }
};

if ('serviceWorker' in navigator) {
    bootFcm().catch((error) => {
        console.warn('[FCM] init failed:', error?.message || error);
    });
}
