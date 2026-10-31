// API client for Brightloop Sales Module (Quotations, Templates & Subscriptions)

const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('brightloop_admin_token') : null;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

// ─── Quotations API ────────────────────────────────────────────────────────────
export const quotationsApi = {
  async getQuotations(params = {}) {
    return request(`/quotations${buildQuery(params)}`);
  },

  async getQuotationById(id) {
    return request(`/quotations/${encodeURIComponent(id)}`);
  },

  async createQuotation(data) {
    return request('/quotations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateQuotation(id, data) {
    return request(`/quotations/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async updateStatus(id, status) {
    return request(`/quotations/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async convertToSubscription(id) {
    return request(`/quotations/${encodeURIComponent(id)}/convert-to-subscription`, {
      method: 'POST'
    });
  },

  async deleteQuotation(id) {
    return request(`/quotations/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  }
};

// ─── Quotation Templates API ──────────────────────────────────────────────────
export const quotationTemplatesApi = {
  async getTemplates(params = {}) {
    return request(`/quotation-templates${buildQuery(params)}`);
  },

  async getTemplateById(id) {
    return request(`/quotation-templates/${encodeURIComponent(id)}`);
  },

  async createTemplate(data) {
    return request('/quotation-templates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateTemplate(id, data) {
    return request(`/quotation-templates/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async toggleStatus(id, isActive) {
    return request(`/quotation-templates/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    });
  },

  async deleteTemplate(id) {
    return request(`/quotation-templates/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  }
};

// ─── Subscriptions API ────────────────────────────────────────────────────────
export const subscriptionsApi = {
  async getSubscriptions(params = {}) {
    return request(`/subscriptions${buildQuery(params)}`);
  },

  async getSubscriptionById(id) {
    return request(`/subscriptions/${encodeURIComponent(id)}`);
  },

  async createSubscription(data) {
    return request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateSubscription(id, data) {
    return request(`/subscriptions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async updateStatus(id, status) {
    return request(`/subscriptions/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async deleteSubscription(id) {
    return request(`/subscriptions/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  }
};
