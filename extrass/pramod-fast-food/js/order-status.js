'use strict';

/**
 * ═══════════════════════════════════════════════
 * ORDER STATUS — Single Source of Truth
 * ═══════════════════════════════════════════════
 *
 * Matches backend contract EXACTLY (Title Case).
 * Import nothing — this is a global constant.
 *
 * Backend routes:
 *   PATCH /api/restaurant/orders/:id/status   → { status: "Preparing" }
 *   PATCH /api/restaurant/orders/:orderId/cancel → no body
 */

const ORDER_STATUS = Object.freeze({
    PENDING:   'Pending',
    PREPARING: 'Preparing',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
});

const ALLOWED_TRANSITIONS = Object.freeze({
    [ORDER_STATUS.PENDING]:   [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PREPARING]: [ORDER_STATUS.COMPLETED],
    [ORDER_STATUS.COMPLETED]: [],
    [ORDER_STATUS.CANCELLED]: [],
});

/**
 * Customer-facing display labels.
 * Never send these to the backend.
 */
const STATUS_LABELS = Object.freeze({
    [ORDER_STATUS.PENDING]:   'Pending',
    [ORDER_STATUS.PREPARING]: 'Accepted',
    [ORDER_STATUS.COMPLETED]: 'Served',
    [ORDER_STATUS.CANCELLED]: 'Cancelled',
});

/**
 * Progress bar stages (3-stage system).
 * Cancelled is a terminal override, not a stage.
 */
const PROGRESS_STAGES = Object.freeze([
    ORDER_STATUS.PENDING,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.COMPLETED,
]);

/**
 * Validate whether a transition is allowed.
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean}
 */
const isTransitionAllowed = (currentStatus, newStatus) => {
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed) {
        console.warn(`[OrderStatus] Unknown current status: "${currentStatus}"`);
        return false;
    }
    const ok = allowed.includes(newStatus);
    if (!ok) {
        console.warn(`[OrderStatus] Transition "${currentStatus}" → "${newStatus}" is NOT allowed. Allowed: [${allowed.join(', ')}]`);
    }
    return ok;
};

/**
 * Normalize any casing variant to the canonical Title Case value.
 * Handles "PENDING", "pending", "Pending" → "Pending", etc.
 * Returns the input unchanged if no match found.
 * @param {string} raw
 * @returns {string}
 */
const normalizeStatus = (raw) => {
    if (!raw) return ORDER_STATUS.PENDING;
    const upper = raw.toUpperCase();
    const map = {
        PENDING:   ORDER_STATUS.PENDING,
        PREPARING: ORDER_STATUS.PREPARING,
        COMPLETED: ORDER_STATUS.COMPLETED,
        CANCELLED: ORDER_STATUS.CANCELLED,
    };
    return map[upper] || raw;
};
