// frontend/src/store/slices/authSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { 
  loginThunk, 
  registerThunk, 
  logoutThunk, 
  setAuthFromStorage 
} from '../thunks/authThunks';

// 🔹 Тип данных пользователя
export interface UserData {
  id?: number;
  username: string;
  role: 'USER' | 'ADMIN';
  email?: string;
}

// 🔹 Тип ответа от thunk'ов аутентификации
interface AuthResponse {
  user: UserData;
}

// 🔹 Состояние аутентификации
export interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthChecked: boolean; // 🔹 Флаг: завершена ли первичная проверка авторизации
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isAuthChecked: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 🔹 Очистка ошибки (например, при смене формы)
    clearError: (state) => {
      state.error = null;
    },
    
    // 🔹 Полный сброс состояния аутентификации
    resetAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isAuthChecked = true;
      state.error = null;
      // 🔹 Очищаем localStorage только от пользовательских данных
      localStorage.removeItem('user');
    },
    
    // 🔹 Установка пользователя извне (для отладки/миграции)
    setUser: (state, action: PayloadAction<UserData>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isAuthChecked = true;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
  },
  
  extraReducers: (builder) => {
    builder
      // ═══════════════════════════════════════════════════
      // 🔹 LOGIN
      // ═══════════════════════════════════════════════════
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.isAuthChecked = true;
        state.error = null;
        // 🔹 Session-based: сохраняем только данные пользователя для быстрого доступа в UI
        try {
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        } catch (e) {
          console.warn('Failed to save user to localStorage:', e);
        }
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthChecked = true;
        state.error = typeof action.payload === 'string' 
          ? action.payload 
          : 'Ошибка входа';
      })
      
      // ═══════════════════════════════════════════════════
      // 🔹 REGISTER
      // ═══════════════════════════════════════════════════
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.isAuthChecked = true;
        state.error = null;
        try {
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        } catch (e) {
          console.warn('Failed to save user to localStorage:', e);
        }
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthChecked = true;
        state.error = typeof action.payload === 'string' 
          ? action.payload 
          : 'Ошибка регистрации';
      })
      
      // ═══════════════════════════════════════════════════
      // 🔹 LOGOUT
      // ═══════════════════════════════════════════════════
      .addCase(logoutThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.isAuthChecked = true;
        state.error = null;
        // 🔹 Очищаем данные пользователя из localStorage
        localStorage.removeItem('user');
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = typeof action.payload === 'string' 
          ? action.payload 
          : 'Ошибка выхода';
        // 🔹 Даже при ошибке на бэкенде — локально выходим
        state.isAuthenticated = false;
        state.user = null;
        state.isAuthChecked = true;
        localStorage.removeItem('user');
      })
      
      // ═══════════════════════════════════════════════════
      // 🔹 SET AUTH FROM STORAGE (восстановление после перезагрузки)
      // ═══════════════════════════════════════════════════
      .addCase(setAuthFromStorage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(setAuthFromStorage.fulfilled, (state, action: PayloadAction<AuthResponse | null>) => {
        state.isLoading = false;
        state.isAuthChecked = true;
        
        if (action.payload?.user) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.error = null;
        } else {
          state.isAuthenticated = false;
          state.user = null;
          state.error = null;
        }
      })
      .addCase(setAuthFromStorage.rejected, (state) => {
        state.isLoading = false;
        state.isAuthChecked = true;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null; // Не показываем ошибку пользователю — это штатная ситуация
      });
  },
});

// 🔹 Экспортируем экшены для использования в компонентах
export const { clearError, resetAuth, setUser } = authSlice.actions;

// 🔹 Экспортируем редюсер
export default authSlice.reducer;
