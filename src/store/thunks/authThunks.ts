import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// 🔹 Тип пользователя
export interface UserData {
  id?: number;
  username: string;
  role: 'USER' | 'ADMIN';
  email?: string;
}

// 🔹 Тип ответа авторизации
export interface AuthResponse {
  user: UserData;
  // 🔹 Для session-based auth token может быть null
  token?: string | null;
}

export const loginThunk = createAsyncThunk<
  AuthResponse,
  { username: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await api.post('/login/', credentials);
      
      // 🔹 Бэкенд возвращает { status, message, data: { username, role, ... } }
      const responseData = res.data?.data || res.data;
      
      return {
        user: {
          username: responseData.username,
          role: responseData.role || 'USER',
          email: responseData.email,
          id: responseData.id,
        },
        // 🔹 Для session auth token не используется, но оставляем для совместимости
        token: null,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Ошибка входа');
    }
  }
);

export const registerThunk = createAsyncThunk<
  AuthResponse,
  { username: string; email: string; password: string },
  { rejectValue: string }
>(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/register/', data);
      const responseData = res.data?.data || res.data;
      
      return {
        user: {
          username: responseData.username,
          role: responseData.role || 'USER',
          email: responseData.email,
          id: responseData.id,
        },
        token: null,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Ошибка регистрации');
    }
  }
);

export const logoutThunk = createAsyncThunk<
  boolean,
  void,
  { rejectValue: string }
>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/logout/');
      return true;
    } catch (err) {
      return rejectWithValue('Ошибка выхода');
    }
  }
);

// 🔹 Проверка статуса аутентификации через /api/auth/me/
export const checkAuthStatusThunk = createAsyncThunk<
  AuthResponse | null,
  void,
  { rejectValue: string }
>(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/me/');
      if (res.data?.status === 'success' && res.data.data) {
        return {
          user: {
            id: res.data.data.id,
            username: res.data.data.username,
            role: res.data.data.role,
            email: res.data.data.email,
          },
          token: null,
        };
      }
      return rejectWithValue('Not authenticated');
    } catch (err: any) {
      if (err.response?.status === 401) {
        return rejectWithValue('Not authenticated');
      }
      return rejectWithValue('Ошибка проверки авторизации');
    }
  }
);

// 🔹 Восстановление из localStorage (для совместимости, но с проверкой через API)
export const setAuthFromStorage = createAsyncThunk<
  AuthResponse | null,
  void,
  { rejectValue: string }
>(
  'auth/setFromStorage',
  async (_, { rejectWithValue }) => {
    try {
      // 🔹 Проверяем сессию через API, а не полагаемся на localStorage
      const res = await api.get('/auth/me/');
      if (res.data?.status === 'success' && res.data.data) {
        return {
          user: {
            id: res.data.data.id,
            username: res.data.data.username,
            role: res.data.data.role,
            email: res.data.data.email,
          },
          token: null,
        };
      }
      // 🔹 Если сессия недействительна — очищаем localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      return rejectWithValue('Session expired');
    } catch (err) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      return rejectWithValue('No valid session');
    }
  }
);
