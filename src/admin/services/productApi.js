// API client for Brightloop Product Management Module

const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
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

export const productApi = {
  // Products
  async getProducts(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryStr = searchParams.toString();
    return request(`/products${queryStr ? `?${queryStr}` : ''}`);
  },

  async getProductById(id) {
    return request(`/products/${encodeURIComponent(id)}`);
  },

  async createProduct(productData) {
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  async updateProduct(id, productData) {
    return request(`/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  async deleteProduct(id) {
    return request(`/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  async getFilterMetadata() {
    return request('/products/meta/categories');
  },

  // Variants
  async getVariants(productId) {
    return request(`/products/${encodeURIComponent(productId)}/variants`);
  },

  async createVariant(productId, variantData) {
    return request(`/products/${encodeURIComponent(productId)}/variants`, {
      method: 'POST',
      body: JSON.stringify(variantData)
    });
  },

  async updateVariant(productId, variantId, variantData) {
    return request(`/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`, {
      method: 'PUT',
      body: JSON.stringify(variantData)
    });
  },

  async deleteVariant(productId, variantId) {
    return request(`/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`, {
      method: 'DELETE'
    });
  },

  // Add-ons
  async getAddons(productId) {
    return request(`/products/${encodeURIComponent(productId)}/addons`);
  },

  async createAddon(productId, addonData) {
    return request(`/products/${encodeURIComponent(productId)}/addons`, {
      method: 'POST',
      body: JSON.stringify(addonData)
    });
  },

  async updateAddon(productId, addonId, addonData) {
    return request(`/products/${encodeURIComponent(productId)}/addons/${encodeURIComponent(addonId)}`, {
      method: 'PUT',
      body: JSON.stringify(addonData)
    });
  },

  async deleteAddon(productId, addonId) {
    return request(`/products/${encodeURIComponent(productId)}/addons/${encodeURIComponent(addonId)}`, {
      method: 'DELETE'
    });
  }
};
