/**
 * customers.js — Fetch, render, and search customers.
 * Standalone page — no dependency on admin modules.
 */
'use strict';

const BASE_URL = 'https://anand-os-backend.onrender.com/api';

let customersData = [];

/* ============ DOM refs ============ */
const $body         = document.getElementById('customersBody');
const $search       = document.getElementById('searchInput');
const $searchCount  = document.getElementById('searchCount');
const $headerCount  = document.getElementById('headerCount');
const $totalCust    = document.getElementById('totalCustomers');
const $totalRev     = document.getElementById('totalRevenue');
const $totalOrders  = document.getElementById('totalOrders');
const $avgSpend     = document.getElementById('avgSpend');
const $empty        = document.getElementById('emptyState');

/* ============ Helpers ============ */
const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');

function relativeDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 30) return diff + 'd ago';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

/* ============ Fetch ============ */
async function loadCustomers() {
    try {
        const res = await fetch(`${BASE_URL}/restaurant/customers`);
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
            customersData = json.data;
            renderCustomers(customersData);
            updateSummary(customersData);
        } else {
            showEmpty();
        }
    } catch (err) {
        console.error('[Customers] Load failed:', err);
        $body.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--c-red)">Failed to load — server may be waking up. Retrying…</td></tr>`;
        // Retry once after 4s (Render cold start)
        setTimeout(loadCustomers, 4000);
    }
}

/* ============ Render table ============ */
function renderCustomers(customers) {
    $empty.hidden = customers.length > 0;
    $body.innerHTML = '';

    if (!customers.length) {
        showEmpty();
        return;
    }

    customers.forEach((c, i) => {
        const row = document.createElement('tr');
        row.className = 'cust-table__row';
        row.innerHTML = `
            <td class="cust-table__num">${i + 1}</td>
            <td class="cust-table__name">${esc(c.name)}</td>
            <td class="cust-table__phone">${esc(c.phone)}</td>
            <td>${c.totalOrders ?? 0}</td>
            <td class="cust-table__spent">${fmt(c.totalSpent)}</td>
            <td class="cust-table__points">${c.points ?? 0}</td>
            <td class="cust-table__date">${relativeDate(c.createdAt)}</td>
        `;
        $body.appendChild(row);
    });
}

function showEmpty() {
    $empty.hidden = false;
    $body.innerHTML = '';
}

/* ============ Summary cards ============ */
function updateSummary(customers) {
    const count = customers.length;
    const revenue = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);
    const orders  = customers.reduce((s, c) => s + (c.totalOrders || 0), 0);
    const avg = count ? Math.round(revenue / count) : 0;

    $totalCust.textContent   = count;
    $totalRev.textContent    = fmt(revenue);
    $totalOrders.textContent = orders;
    $avgSpend.textContent    = fmt(avg);
    $headerCount.textContent = count + ' total';
}

/* ============ Search ============ */
$search.addEventListener('input', () => {
    const q = $search.value.trim().toLowerCase();

    if (!q) {
        renderCustomers(customersData);
        $searchCount.textContent = '';
        return;
    }

    const filtered = customersData.filter(c =>
        (c.name  && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
    );

    renderCustomers(filtered);
    $searchCount.textContent = filtered.length + ' / ' + customersData.length;
});

/* ============ XSS-safe escape ============ */
function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

/* ============ Init ============ */
loadCustomers();
