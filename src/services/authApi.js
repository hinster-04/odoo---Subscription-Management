/**
 * Brightloop Authentication API Service
 *
 * Exposes lightweight API methods for user authentication and health checks.
 * Uses centralized apiClient.
 */

import { apiClient } from './apiClient.js';

/**
 * Register a new customer account.
 * Endpoint: POST /api/auth/register
 *
 * @param {object} payload - { email, password, first_name, last_name, business_name, ... }
 * @param {object} [options] - Additional request options
 * @returns {Promise<object>} Created user and profile payload
 */
export function registerCustomer(payload, options = {}) {
  return apiClient.post('/auth/register', payload, options);
}

/**
 * Authenticate a user across all roles (Admin, Staff, Customer).
 * Endpoint: POST /api/auth/login
 *
 * @param {object} credentials - { email, password }
 * @param {object} [options] - Additional request options
 * @returns {Promise<object>} { success, message, accessToken, tokenType, expiresIn, user }
 */
export function loginUser(credentials, options = {}) {
  return apiClient.post('/auth/login', credentials, options);
}

/**
 * Retrieve the current authenticated user's account and profile.
 * Endpoint: GET /api/auth/me
 *
 * @param {string} [token] - Optional explicit Bearer access token
 * @param {object} [options] - Additional request options
 * @returns {Promise<object>} { success, message, data: { id, email, role, profile } }
 */
export function getCurrentUser(token, options = {}) {
  const requestOptions = {
    ...options,
    ...(token ? { token } : {})
  };
  return apiClient.get('/auth/me', requestOptions);
}

/**
 * Stateless logout for the authenticated user.
 * Endpoint: POST /api/auth/logout
 *
 * @param {string} [token] - Optional explicit Bearer access token
 * @param {object} [options] - Additional request options
 * @returns {Promise<object>} { success, message }
 */
export function logoutUser(token, options = {}) {
  const requestOptions = {
    ...options,
    ...(token ? { token } : {})
  };
  return apiClient.post('/auth/logout', null, requestOptions);
}

/**
 * Backend health check.
 * Endpoint: GET /api/health
 *
 * @param {object} [options] - Additional request options
 * @returns {Promise<object>} { status, timestamp, uptime, environment }
 */
export function checkBackendHealth(options = {}) {
  return apiClient.get('/health', options);
}

export const authApi = {
  registerCustomer,
  loginUser,
  getCurrentUser,
  logoutUser,
  checkBackendHealth
};

export default authApi;
