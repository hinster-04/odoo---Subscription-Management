// Finance API client — Taxes, Discounts, Invoices, Payments
const API_BASE = (import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
    const url = `${API_BASE}/finance${endpoint}`;
    const config = {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
    };
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const err = new Error(data.message || `Request failed (${response.status})`);
        err.status = response.status;
        err.data = data;
        throw err;
    }
    return data;
}

// ── Helper: build query string ────────────────────────────────────────────────
function qs(params = {}) {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p.append(k, v);
    });
    const str = p.toString();
    return str ? `?${str}` : '';
}

// ── Taxes ─────────────────────────────────────────────────────────────────────
export const taxesApi = {
    list: (params) => request(`/taxes${qs(params)}`),
    getById: (id) => request(`/taxes/${id}`),
    create: (body) => request('/taxes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/taxes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => request(`/taxes/${id}`, { method: 'DELETE' }),
    listActive: () => request('/taxes-list'),
};

// ── Discounts ─────────────────────────────────────────────────────────────────
export const discountsApi = {
    list: (params) => request(`/discounts${qs(params)}`),
    getById: (id) => request(`/discounts/${id}`),
    create: (body) => request('/discounts', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/discounts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => request(`/discounts/${id}`, { method: 'DELETE' }),
    listActive: () => request('/discounts-list'),
};

// ── Invoices ──────────────────────────────────────────────────────────────────
export const invoicesApi = {
    list: (params) => request(`/invoices${qs(params)}`),
    getById: (id) => request(`/invoices/${id}`),
    create: (body) => request('/invoices', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    confirm: (id) => request(`/invoices/${id}/confirm`, { method: 'PATCH' }),
    cancel: (id) => request(`/invoices/${id}/cancel`, { method: 'PATCH' }),
    listOutstanding: (params) => request(`/invoices-outstanding${qs(params)}`),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsApi = {
    list: (params) => request(`/payments${qs(params)}`),
    getById: (id) => request(`/payments/${id}`),
    record: (body) => request('/payments', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Shared dropdown data ──────────────────────────────────────────────────────
export const financeHelpers = {
    getCustomers: (search) => request(`/customers${qs({ search })}`),
    getActiveTaxes: () => request('/taxes-list'),
    getActiveDiscounts: () => request('/discounts-list'),
    getOutstandingInvoices: (search) => request(`/invoices-outstanding${qs({ search })}`),
};
