(function () {
    'use strict';

    const LOCK_STORAGE_KEY = 'menunova_test_portal_unlocked';
    const DEV_PASSWORD_HASH = '2e2c2c5e6de58479ac00c9ce456c25745fb949153b87c55718a73294497f1489';

    const lockView = document.getElementById('lockView');
    const dashboardView = document.getElementById('dashboardView');
    const lockCard = document.getElementById('lockCard');
    const unlockForm = document.getElementById('unlockForm');
    const passwordInput = document.getElementById('portalPassword');
    const unlockError = document.getElementById('unlockError');
    const lockAgainBtn = document.getElementById('lockAgainBtn');

    const debugSlug = document.getElementById('debugSlug');
    const debugApiBase = document.getElementById('debugApiBase');
    const debugRealtime = document.getElementById('debugRealtime');
    const debugTimestamp = document.getElementById('debugTimestamp');

    let timestampTimer = null;

    function setUnlockedState(isUnlocked) {
        if (isUnlocked) {
            localStorage.setItem(LOCK_STORAGE_KEY, '1');
        } else {
            localStorage.removeItem(LOCK_STORAGE_KEY);
        }
    }

    function isUnlocked() {
        return localStorage.getItem(LOCK_STORAGE_KEY) === '1';
    }

    function toggleViews(showDashboard) {
        if (showDashboard) {
            lockView.classList.remove('view--active');
            setTimeout(() => {
                dashboardView.classList.add('view--active');
            }, 120);
            return;
        }

        dashboardView.classList.remove('view--active');
        setTimeout(() => {
            lockView.classList.add('view--active');
        }, 120);
    }

    function showError(message) {
        unlockError.textContent = message;
        lockCard.classList.remove('shake');
        void lockCard.offsetWidth;
        lockCard.classList.add('shake');
    }

    function clearError() {
        unlockError.textContent = '';
    }

    async function sha256(input) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(input);
        const buffer = await crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(buffer))
            .map((chunk) => chunk.toString(16).padStart(2, '0'))
            .join('');
    }

    async function verifyPassword(inputPassword) {
        if (!inputPassword) return false;
        const enteredHash = await sha256(inputPassword.trim());
        return enteredHash === DEV_PASSWORD_HASH;
    }

    function updateTimestamp() {
        debugTimestamp.textContent = new Date().toLocaleString();
    }

    function updateRealtimeStatus() {
        const isConnected = navigator.onLine;
        debugRealtime.textContent = isConnected ? 'Connected' : 'Disconnected';
        debugRealtime.classList.toggle('status-pill--on', isConnected);
        debugRealtime.classList.toggle('status-pill--off', !isConnected);
    }

    function bindRealtimeListeners() {
        window.addEventListener('online', updateRealtimeStatus);
        window.addEventListener('offline', updateRealtimeStatus);

        updateRealtimeStatus();
        updateTimestamp();
        timestampTimer = window.setInterval(updateTimestamp, 1000);
    }

    function stopRealtimeListeners() {
        window.removeEventListener('online', updateRealtimeStatus);
        window.removeEventListener('offline', updateRealtimeStatus);
        if (timestampTimer) {
            window.clearInterval(timestampTimer);
            timestampTimer = null;
        }
    }

    function fillDebugPanel() {
        const slug = (window.AppConfig && window.AppConfig.SLUG) || 'test';
        const apiBase = (window.AppConfig && window.AppConfig.API_BASE) || 'https://api.menunova.me/api/restaurant/test';

        debugSlug.textContent = slug;
        debugApiBase.textContent = apiBase;
    }

    function unlockPortal() {
        setUnlockedState(true);
        clearError();
        fillDebugPanel();
        toggleViews(true);
        bindRealtimeListeners();
        passwordInput.value = '';
    }

    function lockPortal() {
        setUnlockedState(false);
        stopRealtimeListeners();
        toggleViews(false);
        clearError();
        passwordInput.value = '';
        passwordInput.focus();
    }

    unlockForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearError();

        const password = passwordInput.value;
        const valid = await verifyPassword(password);
        if (valid) {
            unlockPortal();
            return;
        }

        showError('Incorrect password. Access denied.');
    });

    lockAgainBtn.addEventListener('click', lockPortal);

    if (isUnlocked()) {
        fillDebugPanel();
        toggleViews(true);
        bindRealtimeListeners();
    } else {
        toggleViews(false);
        passwordInput.focus();
    }
})();