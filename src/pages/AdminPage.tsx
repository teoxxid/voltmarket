import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../store';
import { showNotification } from '../store/slices/uiSlice';

interface User {
  id: number;
  username: string;
  email?: string;
  role: 'USER' | 'ADMIN';
  date_joined?: string;
}

interface Order {
  id: number;
  user: { username: string };
  status: string;
  total_amount: number;
  created_at: string;
}

interface Service {
  id: number;
  name: string;
  price: number;
  category: string;
  status: string;
}

const AdminPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAuthChecked } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'orders' | 'services'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeServices: 0,
  });

  // 🔹 Проверка прав администратора — только после полной проверки авторизации
  useEffect(() => {
    if (!isAuthChecked) return; // Ждём завершения проверки авторизации
    
    if (!isAuthenticated || !user || user.role !== 'ADMIN') {
      dispatch(showNotification({ type: 'error', message: 'Доступ запрещён' }));
      navigate('/', { replace: true });
      return;
    }
    
    fetchAdminData();
  }, [isAuthenticated, isAuthChecked, user, navigate, dispatch]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, ordersRes, servicesRes] = await Promise.allSettled([
        fetch('/api/users/'),
        fetch('/api/orders/?exclude_draft=true'),
        fetch('/api/services/'),
      ]);

      // Обработка пользователей
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const usersData = await usersRes.value.json();
        const usersList = (usersData.data || usersData) as User[];
        setUsers(usersList);
      }

      // Обработка заказов
      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const ordersData = await ordersRes.value.json();
        const ordersList = (ordersData.data || ordersData) as Order[];
        setOrders(ordersList);
      }

      // Обработка товаров
      if (servicesRes.status === 'fulfilled' && servicesRes.value.ok) {
        const servicesData = await servicesRes.value.json();
        const servicesList = (servicesData.data || servicesData) as Service[];
        setServices(servicesList);
      }

      // Обновление статистики
      setStats({
        totalUsers: users.length,
        totalOrders: orders.filter(o => o.status !== 'draft').length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        activeServices: services.filter(s => s.status === 'active').length,
      });
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      dispatch(showNotification({ type: 'error', message: 'Ошибка загрузки данных' }));
    } finally {
      setLoading(false);
    }
  };

  const handleUserRoleChange = async (userId: number, newRole: 'USER' | 'ADMIN') => {
    try {
      const res = await fetch(`/api/users/${userId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        dispatch(showNotification({ type: 'success', message: 'Роль пользователя изменена' }));
      } else {
        dispatch(showNotification({ type: 'error', message: 'Ошибка изменения роли' }));
      }
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Ошибка сети' }));
    }
  };

  const handleOrderStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        dispatch(showNotification({ type: 'success', message: 'Статус заказа изменён' }));
      } else {
        dispatch(showNotification({ type: 'error', message: 'Ошибка изменения статуса' }));
      }
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Ошибка сети' }));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: '#64748b',
      submitted: '#f59e0b',
      completed: '#10b981',
      rejected: '#ef4444',
      deleted: '#94a3b8',
      active: '#10b981',
      inactive: '#64748b',
    };
    return colors[status] || '#64748b';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: 'Черновик',
      submitted: 'Отправлен',
      completed: 'Завершён',
      rejected: 'Отклонён',
      deleted: 'Удалён',
      active: 'Активен',
      inactive: 'Неактивен',
    };
    return texts[status] || status;
  };

  // 🔹 Показываем лоадер пока проверяется авторизация или грузятся данные
  if (!isAuthChecked || loading) {
    return (
      <div className="container" style={{ padding: '50px', textAlign: 'center' }}>
        <div className="loader-spinner" style={{ margin: '0 auto 20px' }}></div>
        <p>{!isAuthChecked ? 'Проверка прав...' : 'Загрузка панели администратора...'}</p>
      </div>
    );
  }

  // 🔹 Если не админ — не рендерим контент (редирект уже сработал в useEffect)
  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div>
          <h1 className="admin-page-title">Панель администратора</h1>
          <p className="admin-page-subtitle">Управление пользователями, заказами и товарами</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          Обзор
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
          Пользователи ({users.length})
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          Заказы ({orders.filter(o => o.status !== 'draft').length})
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
          </svg>
          Товары ({services.length})
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="admin-overview">
            <div className="stats-grid-admin">
              <div className="stat-card-admin">
                <div className="stat-icon-admin" style={{ background: '#dbeafe', color: '#3b82f6' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="stat-value-admin">{stats.totalUsers}</div>
                <div className="stat-label-admin">Пользователей</div>
              </div>

              <div className="stat-card-admin">
                <div className="stat-icon-admin" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  </svg>
                </div>
                <div className="stat-value-admin">{stats.totalOrders}</div>
                <div className="stat-label-admin">Заказов</div>
              </div>

              <div className="stat-card-admin">
                <div className="stat-icon-admin" style={{ background: '#d1fae5', color: '#10b981' }}>
                  <span style={{ fontSize: 22, fontWeight: 600 }}>₽</span>
                </div>
                <div className="stat-value-admin">{stats.totalRevenue.toLocaleString('ru-RU')} ₽</div>
                <div className="stat-label-admin">Выручка</div>
              </div>

              <div className="stat-card-admin">
                <div className="stat-icon-admin" style={{ background: '#fce7f3', color: '#ec4899' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                  </svg>
                </div>
                <div className="stat-value-admin">{stats.activeServices}</div>
                <div className="stat-label-admin">Товаров</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-table-container">
            <h2 className="admin-section-title">Пользователи</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя пользователя</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem) => (
                  <tr key={userItem.id}>
                    <td>{userItem.id}</td>
                    <td>{userItem.username}</td>
                    <td>{userItem.email || '—'}</td>
                    <td>
                      <span 
                        className="role-badge"
                        style={{
                          background: userItem.role === 'ADMIN' ? '#fee2e2' : '#dbeafe',
                          color: userItem.role === 'ADMIN' ? '#dc2626' : '#3b82f6',
                        }}
                      >
                        {userItem.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                      </span>
                    </td>
                    <td>
                      {userItem.role === 'ADMIN' ? (
                        <button
                          type="button"
                          className="btn-sm btn-secondary"
                          onClick={() => handleUserRoleChange(userItem.id, 'USER')}
                          title="Снять права администратора"
                        >
                          Снять админа
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-sm btn-primary"
                          onClick={() => handleUserRoleChange(userItem.id, 'ADMIN')}
                          title="Назначить администратором"
                        >
                          Сделать админом
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="admin-table-container">
            <h2 className="admin-section-title">Заказы</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Пользователь</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Дата</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {orders.filter((o) => o.status !== 'draft').map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.user.username}</td>
                    <td>{order.total_amount.toLocaleString('ru-RU')} ₽</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ background: getStatusColor(order.status) + '20', color: getStatusColor(order.status) }}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString('ru-RU')}</td>
                    <td>
                      {order.status === 'submitted' && (
                        <>
                          <button
                            type="button"
                            className="btn-sm btn-success"
                            onClick={() => handleOrderStatusChange(order.id, 'completed')}
                            title="Завершить заказ"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            className="btn-sm btn-danger"
                            onClick={() => handleOrderStatusChange(order.id, 'rejected')}
                            title="Отклонить заказ"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="admin-table-container">
            <h2 className="admin-section-title">Товары</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Категория</th>
                  <th>Цена</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>{service.id}</td>
                    <td>{service.name}</td>
                    <td>{service.category}</td>
                    <td>{service.price.toLocaleString('ru-RU')} ₽</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ background: getStatusColor(service.status) + '20', color: getStatusColor(service.status) }}
                      >
                        {getStatusText(service.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
