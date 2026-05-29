import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 🔹 Обязательно: отправлять куки для сессий Django
  withCredentials: true,
});

// 🔹 Функция получения CSRF-токена из cookie (требуется для Django)
const getCSRFToken = (): string | null => {
  const name = 'csrftoken';
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1];
  return cookieValue || null;
};

// 🔹 Интерцептор запросов: добавляем CSRF-токен к небезопасным методам
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 🔹 Добавляем X-CSRFToken заголовок для POST/PUT/PATCH/DELETE
    const method = config.method?.toLowerCase();
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      const csrfToken = getCSRFToken();
      if (csrfToken && config.headers) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Интерцептор ответов: обработка 401 (не авторизован)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 🔹 При 401 очищаем данные авторизации и редиректим на логин
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 🔹 Функции для работы с услугами
export const getServices = (params?: Record<string, any>) => 
  api.get('/services/', { params });

export const getService = (id: number) => 
  api.get(`/services/${id}/`);

// 🔹 Функции для работы с корзиной/заявкой
export const addToCart = (serviceId: number, quantity = 1) =>
  api.post('/order-items/add/', { service_id: serviceId, quantity });

export const getCart = () => 
  api.get('/orders/cart/');

export const getOrder = (orderId: number) => 
  api.get(`/orders/${orderId}/`);

export default api;
