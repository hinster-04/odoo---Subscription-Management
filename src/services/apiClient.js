/**
 * Brightloop Centralized API Client
 *
 * Built on native Fetch API.
 * Uses Vite environment variable `VITE_API_BASE_URL` with fallback to `http://localhost:5000/api`.
 */

export class ApiError extends Error {
  constructor(message, status = 0, data = null, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.errors = errors;
  }
}

let activeTokenProvider = null;

/**
 * Configure an optional global token provider callback.
 * Enables future auth integrations (e.g. AuthContext) without circular imports.
 * @param {(() => string | null) | null} providerFn
 */
export function setTokenProvider(providerFn) {
  activeTokenProvider = typeof providerFn === 'function' ? providerFn : null;
}

/**
 * Resolve the API base URL from Vite environment or system environment.
 * Validates format and strips trailing slashes.
 */
export function getApiBaseUrl() {
  let url = '';
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    url = import.meta.env.VITE_API_BASE_URL;
  } else if (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) {
    url = process.env.VITE_API_BASE_URL;
  } else {
    url = 'http://localhost:5000/api';
  }

  if (!url || typeof url !== 'string' || !url.trim()) {
    throw new ApiError('API base URL is not configured. Please set VITE_API_BASE_URL.', 0, null);
  }

  try {
    new URL(url);
  } catch {
    throw new ApiError(`Invalid API base URL configured: "${url}"`, 0, null);
  }

  return url.trim().replace(/\/+$/, '');
}

/**
 * Core HTTP request handler.
 *
 * @param {string} endpoint - Path relative to base URL (e.g. '/health' or '/auth/login')
 * @param {object} [options] - Fetch options and custom configuration
 * @param {string} [options.method='GET'] - HTTP verb
 * @param {any} [options.body] - Request body (plain object, string, FormData, etc.)
 * @param {string} [options.token] - Explicit Bearer token override
 * @param {object} [options.headers] - Additional HTTP headers
 * @param {string} [options.baseUrl] - Custom base URL override
 * @returns {Promise<any>} Parsed response data
 */
export async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    token = null,
    headers = {},
    baseUrl = null,
    ...restOptions
  } = options;

  const rawBase = baseUrl || getApiBaseUrl();
  const base = rawBase.trim().replace(/\/+$/, '');
  try {
    new URL(base);
  } catch {
    throw new ApiError(`Invalid API base URL configured: "${rawBase}"`, 0, null);
  }
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${base}${normalizedEndpoint}`;

  const requestHeaders = {
    ...headers
  };

  // Determine token: explicitly supplied in options takes priority, then global provider
  let resolvedToken = token;
  if (!resolvedToken && activeTokenProvider) {
    try {
      resolvedToken = activeTokenProvider();
    } catch {
      resolvedToken = null;
    }
  }

  if (resolvedToken && typeof resolvedToken === 'string' && !requestHeaders['Authorization']) {
    const bearer = resolvedToken.startsWith('Bearer ') ? resolvedToken : `Bearer ${resolvedToken}`;
    requestHeaders['Authorization'] = bearer;
  }

  let processedBody = body;
  if (body !== null && body !== undefined) {
    // If body is a plain object or array, JSON-stringify and set Content-Type
    const isPlainObjectOrArray =
      typeof body === 'object' &&
      !(body instanceof FormData) &&
      !(body instanceof Blob) &&
      !(body instanceof URLSearchParams);

    if (isPlainObjectOrArray) {
      if (!requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/json';
      }
      processedBody = JSON.stringify(body);
    }
  }

  const fetchConfig = {
    method: method.toUpperCase(),
    headers: requestHeaders,
    body: processedBody,
    ...restOptions
  };

  let response;
  try {
    response = await fetch(fullUrl, fetchConfig);
  } catch (networkError) {
    throw new ApiError(
      networkError.message || 'Network request failed. Please check server availability or internet connection.',
      0,
      null
    );
  }

  // Parse response safely
  let responseData = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else if (response.status === 204) {
    responseData = null;
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  // Handle non-2xx HTTP responses
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let validationErrors = null;

    if (responseData && typeof responseData === 'object') {
      if (responseData.message) {
        errorMessage = responseData.message;
      }
      if (responseData.errors) {
        validationErrors = responseData.errors;
      }
    } else if (typeof responseData === 'string' && responseData.trim()) {
      errorMessage = responseData;
    }

    throw new ApiError(errorMessage, response.status, responseData, validationErrors);
  }

  return responseData;
}

export const apiClient = {
  get(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'GET' });
  },
  post(endpoint, body = null, options = {}) {
    return request(endpoint, { ...options, method: 'POST', body });
  },
  put(endpoint, body = null, options = {}) {
    return request(endpoint, { ...options, method: 'PUT', body });
  },
  patch(endpoint, body = null, options = {}) {
    return request(endpoint, { ...options, method: 'PATCH', body });
  },
  delete(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'DELETE' });
  },
  request
};

export default apiClient;
