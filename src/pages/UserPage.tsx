import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../store/slices/uiSlice';
import type { RootState } from '../store';

interface User {
  username: string;
  email?: string;
  role: string;
}

interface AdminOrder {
  id: number;
  user: { username: string };
  status: string;
  total_amount: number;
  created_at: string;
}

interface UserPageProps {
  user: User | null;
  onLogout: () => void;
}

const UserPage: React.FC<UserPageProps> = ({ user, onLogout }) => {
  const dispatch = useDispatch();
  
  // Вкладки: профиль, безопасность, админка (только для ADMIN)
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'admin'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  
  const cartItems = useSelector((state: RootState) => state.cart.items || []);
  const orders = useSelector((state: RootState) => state.orders.list || []);
  
  const ordersCount = orders.length;
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalSpent = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Админские данные
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminStats, setAdminStats] = useState({ orders: 0, revenue: 0 });

  // Загрузка админских данных при открытии вкладки
  useEffect(() => {
    if (activeTab === 'admin' && user?.role === 'ADMIN' && adminOrders.length === 0) {
      fetchAdminData();
    }
  }, [activeTab, user]);

  const fetchAdminData = async () => {
    setAdminLoading(true);
    try {
      // 🔹 Используем fetch с credentials: 'include' для отправки куки сессии
      const response = await fetch('/api/orders/', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const json = await response.json();
        const ordersList = (json.data || json) as AdminOrder[];
        setAdminOrders(ordersList);
        
        setAdminStats({
          orders: ordersList.filter(o => o.status !== 'draft').length,
          revenue: ordersList.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        });
      } else if (response.status === 401 || response.status === 403) {
        dispatch(showNotification({ type: 'error', message: 'Требуется авторизация' }));
      }
    } catch (e) {
      console.error('Failed to fetch admin data:', e);
      dispatch(showNotification({ type: 'error', message: 'Ошибка загрузки данных' }));
    } finally {
      setAdminLoading(false);
    }
  };

  const handleOrderStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const endpoint = newStatus === 'completed' 
        ? `/api/orders/${orderId}/complete/`
        : `/api/orders/${orderId}/reject/`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setAdminOrders(orders => orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        dispatch(showNotification({ type: 'success', message: 'Статус заказа изменён' }));
      } else {
        dispatch(showNotification({ type: 'error', message: 'Ошибка изменения статуса' }));
      }
    } catch {
      dispatch(showNotification({ type: 'error', message: 'Ошибка сети' }));
    }
  };

  const handleEditOpen = () => {
    setEditForm({ username: user?.username || '', email: user?.email || '' });
    setIsEditing(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.username.trim()) {
      dispatch(showNotification({ type: 'error', message: 'Имя не может быть пустым' }));
      return;
    }
    setIsEditing(false);
    dispatch(showNotification({ type: 'success', message: 'Профиль обновлен' }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      dispatch(showNotification({ type: 'error', message: 'Минимум 6 символов' }));
      return;
    }
    if (newPassword !== confirmPassword) {
      dispatch(showNotification({ type: 'error', message: 'Пароли не совпадают' }));
      return;
    }
    setIsChangingPassword(true);
    await new Promise(r => setTimeout(r, 800));
    dispatch(showNotification({ type: 'success', message: 'Пароль изменён' }));
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setIsChangingPassword(false);
  };

  const handleLogoutClick = () => {
    if (window.confirm('Выйти?')) onLogout();
  };

  const getStatusColor = (status: string) => {
    const c: Record<string, string> = {
      draft: '#64748b', submitted: '#f59e0b', completed: '#10b981',
      rejected: '#ef4444', deleted: '#94a3b8', active: '#10b981', inactive: '#64748b'
    };
    return c[status] || '#64748b';
  };

  const getStatusText = (status: string) => {
    const t: Record<string, string> = {
      draft: 'Черновик', submitted: 'Отправлен', completed: 'Завершён',
      rejected: 'Отклонён', deleted: 'Удалён', active: 'Активен', inactive: 'Неактивен'
    };
    return t[status] || status;
  };

  return (
    <div className="user-page-container">
      <div className="user-page-header">
        <div>
          <h1 className="user-page-title">Личный кабинет</h1>
          <p className="user-page-subtitle">Управление профилем и настройками</p>
        </div>
        <button type="button" onClick={handleLogoutClick} className="logout-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Выйти
        </button>
      </div>

      {/* Вкладки */}
      <div className="user-tabs">
        <button
          type="button"
          className={`user-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          Профиль
        </button>
        <button
          type="button"
          className={`user-tab ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          Безопасность
        </button>
        {/* Вкладка "Управление" — только для админов */}
        {user?.role === 'ADMIN' && (
          <button
            type="button"
            className={`user-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
            style={{ color: '#dc2626', borderColor: activeTab === 'admin' ? '#dc2626' : 'transparent' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            Управление
          </button>
        )}
      </div>

      <div className="user-content">
        {/* Профиль */}
        {activeTab === 'profile' && (
          <div className="user-section">
            <div className="section-header">
              <h2 className="section-title">Информация о пользователе</h2>
              {!isEditing && <button type="button" onClick={handleEditOpen} className="edit-btn">Редактировать</button>}
            </div>
            {isEditing ? (
              <form onSubmit={handleEditSave} className="password-form">
                <div className="form-group">
                  <label className="form-label">Имя пользователя</label>
                  <input type="text" className="form-input" value={editForm.username}
                    onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={editForm.email}
                    onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Отмена</button>
                  <button type="submit" className="btn btn-primary">Сохранить</button>
                </div>
              </form>
            ) : (
              <>
                <div className="info-grid">
                  <div className="info-item"><div className="info-label">Имя пользователя</div><div className="info-value">{user?.username || '—'}</div></div>
                  <div className="info-item"><div className="info-label">Email</div><div className="info-value">{user?.email || '—'}</div></div>
                  <div className="info-item"><div className="info-label">Роль</div>
                    <div className="info-value">
                      <span className="role-badge" style={{ background: user?.role === 'ADMIN' ? '#fee2e2' : '#dbeafe', color: user?.role === 'ADMIN' ? '#dc2626' : '#3b82f6' }}>
                        {user?.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="stats-grid">
                  <div className="stat-card"><div className="stat-value">{ordersCount}</div><div className="stat-label">Заказов</div></div>
                  <div className="stat-card"><div className="stat-value">{cartCount}</div><div className="stat-label">В корзине</div></div>
                  <div className="stat-card"><div className="stat-value">{totalSpent.toLocaleString('ru-RU')} ₽</div><div className="stat-label">Потрачено</div></div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Смена пароля */}
        {activeTab === 'password' && (
          <div className="user-section">
            <h2 className="section-title">Смена пароля</h2>
            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="form-group"><label className="form-label">Текущий пароль</label>
                <input type="password" className="form-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Новый пароль (мин. 6 символов)</label>
                <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required /></div>
              <div className="form-group"><label className="form-label">Подтвердите пароль</label>
                <input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
              <button type="submit" className="btn btn-primary" disabled={isChangingPassword}>{isChangingPassword ? 'Сохранение...' : 'Сохранить новый пароль'}</button>
            </form>
          </div>
        )}

        {/* Админ-панель (внутри UserPage) */}
        {activeTab === 'admin' && user?.role === 'ADMIN' && (
          <div className="user-section">
            <h2 className="section-title" style={{ color: '#dc2626' }}>Панель управления</h2>
            
            {adminLoading ? (
              <p style={{ textAlign: 'center', padding: '40px' }}>Загрузка данных...</p>
            ) : (
              <>
                {/* Статистика */}
                <div className="stats-grid" style={{ marginBottom: '32px' }}>
                  <div className="stat-card"><div className="stat-value">{adminStats.orders}</div><div className="stat-label">Заказов</div></div>
                  <div className="stat-card"><div className="stat-value">{adminStats.revenue.toLocaleString('ru-RU')} ₽</div><div className="stat-label">Выручка</div></div>
                </div>

                {/* Управление заказами */}
                <h3 style={{ margin: '24px 0 16px', fontSize: '18px' }}>Заказы</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>#</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Пользователь</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Сумма</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Статус</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminOrders.filter(o => o.status !== 'draft').map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '12px' }}>#{o.id}</td>
                          <td style={{ padding: '12px' }}>{o.user.username}</td>
                          <td style={{ padding: '12px' }}>{o.total_amount.toLocaleString('ru-RU')} ₽</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                              padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                              background: getStatusColor(o.status) + '20', color: getStatusColor(o.status)
                            }}>{getStatusText(o.status)}</span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {o.status === 'submitted' && (
                              <>
                                <button
                                  type="button"
                                  className="btn-sm btn-success"
                                  onClick={() => handleOrderStatusChange(o.id, 'completed')}
                                  title="Завершить заказ"
                                  style={{ marginRight: '4px' }}
                                >
                                  ✓
                                </button>
                                <button
                                  type="button"
                                  className="btn-sm btn-danger"
                                  onClick={() => handleOrderStatusChange(o.id, 'rejected')}
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

                {/* Кнопка обновления */}
                <button type="button" className="btn btn-secondary" 
                  onClick={fetchAdminData} style={{ marginTop: '20px' }}>Обновить данные</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPage;
