import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor для обработки ошибок и автоматического обновления токенов
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка 401 и это не запрос на refresh и не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      
      // Проверяем, находимся ли на публичной странице
      const publicPaths = ['/auth', '/verify-email', '/reset-password'];
      const currentPath = window.location.pathname;
      const isPublicPage = publicPaths.some(path => currentPath.startsWith(path));
      
      if (isPublicPage) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Если refresh уже в процессе, добавляем запрос в очередь
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Пытаемся обновить токен
        await apiClient.post('/auth/refresh');
        
        // Если успешно, обрабатываем очередь и повторяем оригинальный запрос
        processQueue(null, 'refreshed');
        isRefreshing = false;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Если refresh не удался, очищаем очередь и редиректим на логин
        processQueue(refreshError, null);
        isRefreshing = false;
        
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
