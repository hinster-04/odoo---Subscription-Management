// API client for Brightloop Subscription Plans Module

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

export const plansApi = {
  async getPlans(params = {}) {
    return request(`/subscription-plans${buildQuery(params)}`);
  },

  async getPlanById(id) {
    return request(`/subscription-plans/${encodeURIComponent(id)}`);
  },

  async createPlan(data) {
    return request('/subscription-plans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updatePlan(id, data) {
    return request(`/subscription-plans/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async toggleStatus(id, isActive) {
    return request(`/subscription-plans/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    });
  },

  async deletePlan(id) {
    return request(`/subscription-plans/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  }
};
