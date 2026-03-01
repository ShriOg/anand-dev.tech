'use strict';

const BASE_URL = 'https://anand-os-backend.onrender.com/api';

let customersData = [];

const $body         = document.getElementById('customersBody');
const $search       = document.getElementById('searchInput');
const $searchCount  = document.getElementById('searchCount');
const $headerCount  = document.getElementById('headerCount');
const $totalCust    = document.getElementById('totalCustomers');
const $totalRev     = document.getElementById('totalRevenue');
const $totalOrders  = document.getElementById('totalOrders');
const $avgSpend     = document.getElementById('avgSpend');
const $empty        = document.getElementById('emptyState');

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

async function loadCustomers() {
    try {
        const [custRes, analyticsRes] = await Promise.all([
            fetch(`${BASE_URL}/restaurant/customers`),
            fetch(`${BASE_URL}/restaurant/analytics`),
        ]);
        const custJson = await custRes.json();
        const analyticsJson = await analyticsRes.json();

        if (custJson.success && Array.isArray(custJson.data)) {
            customersData = custJson.data;
            renderCustomers(customersData);
        } else {
            showEmpty();
        }

        if (!analyticsJson || !analyticsJson.success || !analyticsJson.data) {
            setAllStatsToZero();
            return;
        }

        updateSummaryFromAnalytics(analyticsJson.data);
    } catch (err) {
        console.error('[Customers] Load failed:', err);
        $body.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--c-red)">Failed to load — server may be waking up. Retrying…</td></tr>`;

        setTimeout(loadCustomers, 4000);
    }
}

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

function setAllStatsToZero() {
    $totalCust.textContent = '0';
    $totalRev.textContent = fmt(0);
    $totalOrders.textContent = '0';
    $avgSpend.textContent = fmt(0);
    $headerCount.textContent = '0 total';
}

function updateSummaryFromAnalytics(data) {
    const totalCustomers = data.totalCustomers || 0;
    const totalRevenue = data.totalRevenue || 0;
    const totalOrders = data.totalOrders || 0;
    const avgSpend = data.avgSpend || 0;

    $totalCust.textContent   = totalCustomers;
    $totalRev.textContent    = fmt(totalRevenue);
    $totalOrders.textContent = totalOrders;
    $avgSpend.textContent    = fmt(avgSpend);
    $headerCount.textContent = totalCustomers + ' total';
}

function updateSummaryFallback(customers) {
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

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

loadCustomers();
