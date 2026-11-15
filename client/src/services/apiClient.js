import axios from 'axios';

// Token storage with secure local hydration fallback for page reloads
const TOKEN_STORAGE_KEY = 'khetisetu_access_token';

let inMemoryAccessToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;

export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
};

export const getAccessToken = () => {
  if (!inMemoryAccessToken && typeof window !== 'undefined') {
    inMemoryAccessToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return inMemoryAccessToken;
};

export const clearAccessToken = () => {
  inMemoryAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem('khetisetu_user');
    localStorage.removeItem('khetisetu_refresh_token');
  }
};

// Resolve API base URL: strips any trailing /api/v1 or trailing slashes from VITE_API_URL
const rawEnvUrl = (import.meta.env.VITE_API_URL || '').trim();
const normalizedRoot = rawEnvUrl.replace(/\/api(\/v\d+)?\/?$/i, '').replace(/\/+$/, '');
const API_BASE_URL = normalizedRoot ? `${normalizedRoot}/api/v1` : '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HttpOnly refreshToken cookie with requests
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token from memory/storage
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 with silent token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on auth endpoints to prevent infinite refresh loops
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('khetisetu_refresh_token') : null;
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.data.accessToken;
        const newRefreshToken = refreshResponse.data.data.refreshToken;
        setAccessToken(newAccessToken);
        if (newRefreshToken && typeof window !== 'undefined') {
          localStorage.setItem('khetisetu_refresh_token', newRefreshToken);
        }
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
