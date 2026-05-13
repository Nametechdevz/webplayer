import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }

        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  activate: (code: string) =>
    apiClient.post('/auth/activate', { code }),
  logout: () =>
    apiClient.post('/auth/logout'),
  me: () =>
    apiClient.get('/auth/me'),
  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
};

export const moviesApi = {
  list: (params?: { page?: number; genre?: string; search?: string }) =>
    apiClient.get('/movies', { params }),
  getById: (id: string) =>
    apiClient.get(`/movies/${id}`),
  trending: () =>
    apiClient.get('/movies/trending'),
  recommended: () =>
    apiClient.get('/movies/recommended'),
  byGenre: (genre: string) =>
    apiClient.get(`/movies/genre/${genre}`),
};

export const seriesApi = {
  list: (params?: { page?: number; genre?: string; search?: string }) =>
    apiClient.get('/series', { params }),
  getById: (id: string) =>
    apiClient.get(`/series/${id}`),
  getSeasons: (id: string) =>
    apiClient.get(`/series/${id}/seasons`),
  getEpisodes: (id: string, season: number) =>
    apiClient.get(`/series/${id}/seasons/${season}/episodes`),
  trending: () =>
    apiClient.get('/series/trending'),
};

export const channelsApi = {
  list: (params?: { category?: string; search?: string }) =>
    apiClient.get('/channels', { params }),
  getById: (id: string) =>
    apiClient.get(`/channels/${id}`),
  categories: () =>
    apiClient.get('/channels/categories'),
  epg: (channelId: string, date?: string) =>
    apiClient.get(`/channels/${channelId}/epg`, { params: { date } }),
  allEpg: () =>
    apiClient.get('/epg'),
};

export const searchApi = {
  search: (query: string) =>
    apiClient.get('/search', { params: { q: query } }),
};

export const userApi = {
  getProfile: () =>
    apiClient.get('/user/profile'),
  updateProfile: (data: Record<string, unknown>) =>
    apiClient.put('/user/profile', data),
  getFavorites: () =>
    apiClient.get('/user/favorites'),
  addFavorite: (contentId: string, type: string) =>
    apiClient.post('/user/favorites', { contentId, type }),
  removeFavorite: (contentId: string) =>
    apiClient.delete(`/user/favorites/${contentId}`),
  getWatchHistory: () =>
    apiClient.get('/user/history'),
};

export const adminApi = {
  stats: () =>
    apiClient.get('/admin/stats'),
  users: (params?: { page?: number; search?: string }) =>
    apiClient.get('/admin/users', { params }),
  updateUser: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) =>
    apiClient.delete(`/admin/users/${id}`),
  banUser: (id: string) =>
    apiClient.post(`/admin/users/${id}/ban`),
  unbanUser: (id: string) =>
    apiClient.post(`/admin/users/${id}/unban`),
  dns: () =>
    apiClient.get('/admin/dns'),
  addDns: (data: Record<string, unknown>) =>
    apiClient.post('/admin/dns', data),
  updateDns: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/dns/${id}`, data),
  deleteDns: (id: string) =>
    apiClient.delete(`/admin/dns/${id}`),
  testDns: (id: string) =>
    apiClient.post(`/admin/dns/${id}/test`),
  syncDns: () =>
    apiClient.post('/admin/dns/sync'),
  streams: () =>
    apiClient.get('/admin/streams'),
  killStream: (id: string) =>
    apiClient.delete(`/admin/streams/${id}`),
};

export default apiClient;
