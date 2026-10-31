/**
 * Brightloop Centralized Authentication State (AuthContext)
 *
 * Provides global authentication state, token persistence,
 * session hydration via /api/auth/me, and unified login/register/logout actions.
 *
 * Security Note:
 * Access tokens are stored in browser localStorage under key `brightloop_access_token`
 * for development. Note that localStorage is accessible by client JavaScript and does
 * not offer the XSS protection of HttpOnly cookies.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { setTokenProvider } from '../services/apiClient.js';
import { loginUser, registerCustomer, getCurrentUser, logoutUser } from '../services/authApi.js';

export const TOKEN_STORAGE_KEY = 'brightloop_access_token';

export const AuthContext = createContext(null);

/**
 * Safely retrieve token from localStorage.
 */
export function getStoredToken() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
  return null;
}

/**
 * Safely write or remove token from localStorage.
 */
export function setStoredToken(token) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Safely purge stored token.
 */
export function removeStoredToken() {
  setStoredToken(null);
}

/**
 * Normalize the canonical backend /api/auth/me profile into a consistent user shape.
 * Accommodates both customer profiles and admin/staff profiles.
 */
export function normalizeUser(raw) {
  if (!raw) return null;
  const account = raw.data || raw;
  const profile = account.profile || account;
  const firstName = profile.first_name || account.first_name || '';
  const lastName = profile.last_name || account.last_name || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || account.name || account.email || '';
  const businessName = profile.business_name || account.business_name || null;
  const businessType = profile.business_type || account.business_type || null;
  const phone = profile.phone || account.phone || null;
  const address = profile.address || account.address || null;
  const designation = profile.designation || account.designation || null;
  const city = profile.city || account.city || null;
  const state = profile.state || account.state || null;
  const country = profile.country || account.country || null;
  const postalCode = profile.postal_code || account.postal_code || null;

  return {
    id: account.id,
    authId: account.auth_id || account.id,
    email: account.email,
    role: account.role,
    isActive: Boolean(account.is_active ?? true),
    emailVerified: Boolean(account.email_verified),
    createdAt: account.created_at,
    updatedAt: account.updated_at,
    profileId: profile.id || account.id || null,
    firstName,
    lastName,
    name: fullName,
    businessName,
    businessType,
    phone,
    address,
    city,
    state,
    country,
    postalCode,
    designation,
    profile: {
      id: profile.id || account.id,
      auth_id: account.auth_id || account.id,
      first_name: firstName,
      last_name: lastName,
      business_name: businessName,
      business_type: businessType,
      phone,
      address,
      city,
      state,
      country,
      postal_code: postalCode,
      designation
    },
    raw: account
  };
}

// Module-level cache for in-flight hydration requests to eliminate React StrictMode duplicates
let activeHydrationPromise = null;
let activeHydrationToken = null;

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mutable ref to current token to avoid stale closures in API client
  const tokenRef = useRef(token);

  // Synchronize tokenRef whenever token state changes
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Connect apiClient token provider on mount
  useEffect(() => {
    setTokenProvider(() => tokenRef.current);
    return () => {
      setTokenProvider(null);
    };
  }, []);

  // Session Hydration on initial mount
  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      const storedToken = getStoredToken();

      if (!storedToken) {
        if (isMounted) {
          setToken(null);
          tokenRef.current = null;
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      setToken(storedToken);
      tokenRef.current = storedToken;

      try {
        // Reuse in-flight promise if React StrictMode fires duplicate mount
        if (!activeHydrationPromise || activeHydrationToken !== storedToken) {
          activeHydrationToken = storedToken;
          activeHydrationPromise = getCurrentUser(storedToken);
        }

        const response = await activeHydrationPromise;

        if (isMounted && response && response.data) {
          const canonicalUser = normalizeUser(response.data);
          setUser(canonicalUser);
        }
      } catch (err) {
        if (!isMounted) return;

        // If backend explicitly rejected token as invalid or expired (401), clean up
        if (err.status === 401) {
          removeStoredToken();
          setToken(null);
          tokenRef.current = null;
          setUser(null);
        } else if (err.status === 0) {
          // Temporary network failure: do not destroy potentially valid token
          console.warn('[AuthContext] Network error during session hydration. Preserving stored token.');
        } else {
          console.warn('[AuthContext] Session hydration error:', err.message);
        }
      } finally {
        activeHydrationPromise = null;
        activeHydrationToken = null;
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in user, persist token, and hydrate canonical profile.
   */
  const login = useCallback(async (credentials) => {
    // 1. Submit credentials
    const loginResult = await loginUser(credentials);
    const accessToken = loginResult?.accessToken;

    if (!accessToken) {
      throw new Error('Authentication response did not contain an access token.');
    }

    // 2. Persist token in storage and update ref immediately for subsequent calls
    setStoredToken(accessToken);
    tokenRef.current = accessToken;
    setToken(accessToken);

    // 3. Fetch canonical /me profile
    try {
      const meResponse = await getCurrentUser(accessToken);
      const canonicalUser = normalizeUser(meResponse.data);
      setUser(canonicalUser);
      return canonicalUser;
    } catch (profileError) {
      // Revert to unauthenticated state if profile fetch fails
      removeStoredToken();
      tokenRef.current = null;
      setToken(null);
      setUser(null);
      throw profileError;
    }
  }, []);

  /**
   * Public customer registration.
   * Does NOT issue JWT or authenticate session.
   */
  const register = useCallback(async (payload) => {
    return await registerCustomer(payload);
  }, []);

  /**
   * Log out user, purge local credentials and reset state.
   */
  const logout = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (currentToken) {
      try {
        await logoutUser(currentToken);
      } catch {
        // Backend logout is stateless; ignore network/HTTP failures
      }
    }

    // Local cleanup is unconditionally performed
    removeStoredToken();
    tokenRef.current = null;
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(user && token);

  const contextValue = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout
  }), [user, token, isAuthenticated, isLoading, login, register, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to consume AuthContext.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
