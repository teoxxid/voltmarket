import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 🔹 Важно: отправлять куки для сессий
  withCredentials: true,
});

// 🔹 Функции для работы с услугами
export const getServices = () => api.get('/services/');
export const getService = (id: number) => api.get(`/services/${id}/`);

// 🔹 Функции для работы с корзиной/заявкой
export const addToCart = (serviceId: number, quantity = 1) => 
  api.post('/order-items/add/', { service_id: serviceId, quantity });

export const getCart = () => api.get('/orders/cart/');
export const getOrder = (orderId: number) => api.get(`/orders/${orderId}/`);
