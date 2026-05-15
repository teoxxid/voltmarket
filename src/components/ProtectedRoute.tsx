import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  user: { username: string; role: string } | null;
  isLoading: boolean;
  allowedRoles?: string[];  // ['USER'], ['ADMIN'], ['USER', 'ADMIN']
  fallbackPath?: string;    // Куда редиректить при отказе в доступе
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  user,
  isLoading,
  allowedRoles = ['USER', 'ADMIN'],  // По умолчанию доступно всем авторизованным
  fallbackPath = '/pages/user-page/'
}) => {
  const location = useLocation();

  // Пока загружается авторизация — показываем лоадер
  if (isLoading) {
    return (
      <div style={{ padding: 50, textAlign: 'center', fontSize: 18, color: '#666' }}>
        Проверка авторизации...
      </div>
    );
  }

  // Если пользователь не авторизован — редирект на логин
  if (!user) {
    console.log(`[ProtectedRoute] Access denied: not authenticated | path=${location.pathname}`);
    return <Navigate to="/login/" state={{ from: location }} replace />;
  }

  // Если указана проверка роли и роль пользователя не подходит
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(`[ProtectedRoute] Access denied: role mismatch | user=${user.username} | role=${user.role} | allowed=${allowedRoles.join(',')} | path=${location.pathname}`);
    return <Navigate to={fallbackPath} replace />;
  }

  // Все проверки пройдены — рендерим компонент
  console.log(`[ProtectedRoute] Access granted | user=${user.username} | role=${user.role} | path=${location.pathname}`);
  return <>{children}</>;
};