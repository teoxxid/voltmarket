import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from './store';

import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import UserPage from './pages/UserPage';
import AdminPage from './pages/AdminPage';
import ServiceList from './pages/ServiceList';
import ServiceDetail from './pages/ServiceDetail';
import Cart from './pages/Cart';
import OrderList from './pages/OrderList';

import Navbar from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import NotificationToast from './components/NotificationToast';

// 🔹 ИСПРАВЛЕНО: используем setAuthFromStorage вместо несуществующего checkAuthStatusThunk
import { logoutThunk, setAuthFromStorage } from './store/thunks/authThunks';
import { fetchCartIconThunk } from './store/thunks/orderThunks';
import { clearNotification } from './store/slices/uiSlice';

const ServiceRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/service/${id}/`} replace />;
};

function App() {
  const dispatch = useDispatch<AppDispatch>();
  
  const { user, isAuthenticated, isLoading: authLoading, isAuthChecked } = useSelector(
    (state: RootState) => state.auth
  );
  const { notification } = useSelector((state: RootState) => state.ui);

  // 🔹 При загрузке приложения проверяем авторизацию из localStorage
  useEffect(() => {
    if (!isAuthChecked) {
      dispatch(setAuthFromStorage());
    }
  }, [dispatch, isAuthChecked]);

  // 🔹 Обновляем иконку корзины при авторизации
  useEffect(() => {
    if (isAuthenticated && user?.username) {
      dispatch(fetchCartIconThunk());
    }
  }, [dispatch, isAuthenticated, user?.username]);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    dispatch(clearNotification());
  };

  // 🔹 Пока авторизация не проверена — показываем лоадер
  if (!isAuthChecked) {
    return (
      <div className="auth-loader">
        <div className="loader-spinner" />
        <p>Проверка авторизации...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        
        <Navbar user={user} onLogout={handleLogout} />

        {notification?.type && notification?.message && (
          <NotificationToast 
            type={notification.type as "success" | "error"}
            message={notification.message}
            onClose={() => dispatch(clearNotification())}
          />
        )}

        <main className="main-content">
          <Routes>
            {/* 🔹 Публичные маршруты */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<HomePage user={user} />} />
            <Route path="/catalog/" element={<ServiceList />} />
            <Route path="/service/:serviceId/" element={<ServiceDetail />} />

            {/* 🔹 Защищённые маршруты */}
            <Route
              path="/cart/"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated} isAuthChecked={isAuthChecked} isLoading={authLoading}>
                  <Cart />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders/"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated} isAuthChecked={isAuthChecked} isLoading={authLoading}>
                  <OrderList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/user-page/"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated} isAuthChecked={isAuthChecked} isLoading={authLoading}>
                  <UserPage user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin-page/"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated} isAuthChecked={isAuthChecked} isLoading={authLoading} adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* 🔹 Редиректы со старых URL */}
            <Route path="/pages/" element={<Navigate to="/" replace />} />
            <Route path="/pages/catalog/" element={<Navigate to="/catalog/" replace />} />
            <Route path="/pages/service/:id/" element={<ServiceRedirect />} />
            <Route path="/pages/cart/" element={<Navigate to="/cart/" replace />} />
            <Route path="/pages/orders/" element={<Navigate to="/orders/" replace />} />
            <Route path="/pages/user-page/" element={<Navigate to="/user-page/" replace />} />
            <Route path="/pages/admin-page/" element={<Navigate to="/admin-page/" replace />} />

            {/* 🔹 404 */}
            <Route
              path="*"
              element={
                <div className="not-found-page">
                  <div className="not-found-card">
                    <h1 className="not-found-code">404</h1>
                    <p className="not-found-text">Страница не найдена</p>
                    <a href="/catalog/" className="btn btn-primary">
                      Вернуться в каталог
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="container text-center">
            <div style={{fontSize:'14px',color:'#666'}}>
              <strong>VoltMarket</strong> - маркетплейс электронной техники
            </div>
            <div style={{marginTop:'8px',fontSize:'13px',color:'#999'}}>
              © 2026 VoltMarket. Все права защищены.
            </div>
          </div>
        </footer>

      </div>
    </BrowserRouter>
  );
}

export default App;
