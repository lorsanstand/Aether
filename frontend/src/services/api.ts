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
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  
  failedQueue = [];
};

// Interceptor для обработки ошибок и автоматического обновления токенов
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка 401 и запрос ещё не повторялся
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Если это сам запрос на refresh - редирект на логин
      if (originalRequest.url?.includes('/auth/refresh')) {
        isRefreshing = false;
        window.location.href = '/auth';
        return Promise.reject(error);
      }
      
      // Проверяем, находимся ли на публичной странице
      const publicPaths = ['/auth', '/verify-email', '/reset-password'];
      const currentPath = window.location.pathname;
      const isPublicPage = publicPaths.some(path => currentPath.startsWith(path));
      
      if (isPublicPage) {
        return Promise.reject(error);
      }

      // Если refresh уже в процессе, добавляем запрос в очередь
      if (isRefreshing) {
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
        
        // Если успешно, обрабатываем очередь
        processQueue();
        isRefreshing = false;
        
        // Повторяем оригинальный запрос с обновленным токеном
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Если refresh не удался, очищаем очередь и редиректим на логин
        processQueue(refreshError);
        isRefreshing = false;
        
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
