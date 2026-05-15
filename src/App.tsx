import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 🔹 Импорт страниц
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import UserPage from './pages/UserPage';
import AdminPage from './pages/AdminPage';
import ServiceList from './pages/ServiceList';
import ServiceDetail from './pages/ServiceDetail';
import Cart from './pages/Cart';

// 🔹 Импорт компонентов
import Navbar from './components/Navbar';
import Breadcrumbs from './components/Breadcrumbs';
import { ProtectedRoute } from './components/ProtectedRoute';

// 🔹 Типы
interface User {
  username: string;
  role: 'USER' | 'ADMIN';
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);  // 🔹 ДОБАВЛЕНО: состояние для ошибок авторизации

  // 🔹 Проверка авторизации при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/cart-icon/', {
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.data?.order_id !== undefined) {
            try {
              const saved = localStorage.getItem('voltmarket_user');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed?.username && parsed?.role) {
                  setUser(parsed);
                }
              }
            } catch (parseError) {
              console.warn('[App] Failed to parse user from localStorage:', parseError);
              localStorage.removeItem('voltmarket_user');
            }
          }
        }
      } catch (error) {
        console.warn('[App] Auth check failed (backend may not be ready):', error);
        try {
          const saved = localStorage.getItem('voltmarket_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed?.username && parsed?.role) {
              setUser(parsed);
            }
          }
        } catch {}
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // 🔹 Логин: принимает объект { username, password }
  const login = async ({ username, password }: { username: string; password: string }) => {
    try {
      setAuthError(null);  // 🔹 Теперь setAuthError определён!
      const response = await fetch('/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[App] Non-JSON response:', text.substring(0, 200));
        throw new Error('Сервер вернул неожиданный ответ.');
      }
      
      if (response.ok) {
        const data = await response.json();
        const userData = { username: data.data.username, role: data.data.role };
        localStorage.setItem('voltmarket_user', JSON.stringify(userData));
        setUser(userData);
        console.log(`[App] Login success | user=${username}`);
        return { success: true };
      } else {
        const error = await response.json().catch(() => ({}));
        const msg = error.message || 'Неверные учетные данные';
        setAuthError(msg);
        console.log(`[App] Login failed | user=${username} | ${msg}`);
        return { success: false, error: msg };
      }
    } catch (error: any) {
      if (error.message?.includes('Unexpected end of JSON')) {
        setAuthError('Сервер временно недоступен.');
      } else if (error.message?.includes('Failed to fetch')) {
        setAuthError('Не удалось соединиться с сервером.');
      } else {
        setAuthError(error.message || 'Ошибка авторизации');
      }
      console.error('[App] Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // 🔹 Логаут
  const logout = async () => {
    try {
      await fetch('/api/logout/', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[App] Logout error:', error);
    } finally {
      localStorage.removeItem('voltmarket_user');
      setUser(null);
      setAuthError(null);
    }
  };

  // 🔹 Лоадер
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#666' }}>
        🔐 Загрузка...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={logout} />
      <Breadcrumbs />
      
      <Routes>
        {/* 🔹 Публичные маршруты */}
        <Route path="/login/" element={<Login onLogin={login} authError={authError} />} />
        
        {/* 🔹 Основные страницы */}
        <Route path="/pages/" element={
          <ProtectedRoute user={user} isLoading={isLoading} allowedRoles={['USER', 'ADMIN']}>
            <HomePage user={user} />
          </ProtectedRoute>
        } />
        
        <Route path="/pages/catalog/" element={
          <ProtectedRoute user={user} isLoading={isLoading} allowedRoles={['USER', 'ADMIN']}>
            <ServiceList />
          </ProtectedRoute>
        } />
        
        <Route path="/pages/service/:serviceId/" element={
          <ProtectedRoute user={user} isLoading={isLoading} allowedRoles={['USER', 'ADMIN']}>
            <ServiceDetail />
          </ProtectedRoute>
        } />
        
        <Route path="/pages/cart/" element={
          <ProtectedRoute user={user} isLoading={isLoading} allowedRoles={['USER', 'ADMIN']}>
            <Cart user={user} />
          </ProtectedRoute>
        } />
        
        {/* 🔹 User Page */}
        <Route path="/pages/user-page/" element={
          <ProtectedRoute user={user} isLoading={isLoading} allowedRoles={['USER', 'ADMIN']}>
            <UserPage user={user} onLogout={logout} />
          </ProtectedRoute>
        } />
        
        {/* 🔹 Admin Page (только ADMIN) */}
        <Route path="/pages/admin-page/" element={
          <ProtectedRoute user={user} isLoading={isLoading} allowedRoles={['ADMIN']} fallbackPath="/pages/user-page/">
            <AdminPage user={user} onLogout={logout} />
          </ProtectedRoute>
        } />
        
        {/* 🔹 Редиректы */}
        <Route path="/catalog/" element={<Navigate to="/pages/catalog/" replace />} />
        <Route path="/service/:id/" element={<Navigate to="/pages/service/:id/" replace />} />
        <Route path="/cart/" element={<Navigate to="/pages/cart/" replace />} />
        <Route path="/" element={<Navigate to="/pages/" replace />} />
        
        {/* 🔹 404 */}
        <Route path="*" element={
          <div style={{ padding: 50, textAlign: 'center' }}>
            <h1 style={{ fontSize: 48, color: '#dc2626' }}>404</h1>
            <p>Страница не найдена</p>
            <a href="/pages/catalog/" style={{ color: '#2563eb' }}>Вернуться в каталог</a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
