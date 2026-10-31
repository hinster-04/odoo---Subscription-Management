// API client for Brightloop People Management Module (Customers & Staff)

const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  // If a JWT token is present in localStorage, attach it
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

export const peopleApi = {
  // --- Customers ---
  async getCustomers(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryStr = searchParams.toString();
    return request(`/customers${queryStr ? `?${queryStr}` : ''}`);
  },

  async getCustomerById(id) {
    return request(`/customers/${encodeURIComponent(id)}`);
  },

  async updateCustomer(id, data) {
    return request(`/customers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async toggleCustomerStatus(id, isActive) {
    return request(`/customers/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    });
  },

  async getCustomerMetadata() {
    return request('/customers/meta/summary');
  },

  // --- Staff Management ---
  async getStaff(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryStr = searchParams.toString();
    return request(`/staff${queryStr ? `?${queryStr}` : ''}`);
  },

  async getStaffById(id) {
    return request(`/staff/${encodeURIComponent(id)}`);
  },

  async createStaff(data) {
    return request('/staff', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateStaff(id, data) {
    return request(`/staff/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async toggleStaffStatus(id, isActive) {
    return request(`/staff/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    });
  },

  async getStaffMetadata() {
    return request('/staff/meta/summary');
  }
};
