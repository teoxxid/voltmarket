import React from 'react';

interface AdminPageProps {
  user: { username: string; role: string } | null;
  onLogout: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ user, onLogout }) => {
  if (!user) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <p>Ошибка: пользователь не авторизован</p>
        <button onClick={onLogout} style={{ marginTop: 20 }}>На главную</button>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div style={{ padding: 50, textAlign: 'center', background: '#fef2f2', borderRadius: 12 }}>
        <h2 style={{ color: '#dc2626', marginBottom: 20 }}>Доступ запрещён</h2>
        <p>Эта страница доступна <strong>только администраторам</strong>.</p>
        <p style={{ color: '#666', marginTop: 10 }}>Ваша роль: <strong>{user.role}</strong></p>
        <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
          <a href="/pages/user-page/" style={{ 
            padding: '10px 20px', 
            background: '#2563eb', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: 6
          }}>
            Перейти в User Dashboard
          </a>
          <button onClick={onLogout} style={{ 
            padding: '10px 20px', 
            background: '#64748b', 
            color: 'white', 
            border: 'none', 
            borderRadius: 6,
            cursor: 'pointer'
          }}>
            Выйти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '50px auto', padding: 20, background: '#fef2f2', borderRadius: 12, border: '2px solid #dc2626' }}>
      <h2 style={{ marginBottom: 20, color: '#dc2626' }}>Admin Panel</h2>
      
      <div style={{ background: 'white', padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <p><strong>Администратор:</strong> {user.username}</p>
        <p><strong>Роль:</strong> <span style={{ 
          padding: '4px 12px', 
          borderRadius: 20, 
          background: '#dc2626',
          color: 'white',
          fontSize: 14
        }}>{user.role}</span></p>
      </div>
      
      <p style={{ color: '#666', marginBottom: 20 }}>
        Эта страница доступна <strong>только администраторам (ADMIN)</strong>.
      </p>
      
      <div style={{ background: 'white', padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <h4 style={{ marginTop: 0, marginBottom: 12 }}>Админ-функции:</h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#333' }}>
          <li>Создание новых товаров</li>
          <li>Просмотр всех заявок</li>
          <li>Завершение/отклонение заявок</li>
          <li>Управление пользователями</li>
        </ul>
      </div>
      
      <div style={{ display: 'flex', gap: 10 }}>
        <a href="/pages/orders/" style={{ 
          padding: '10px 20px', 
          background: '#2563eb', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: 6,
          fontWeight: 500
        }}>
          Все заявки
        </a>
        <button onClick={onLogout} style={{ 
          padding: '10px 20px', 
          background: '#64748b', 
          color: 'white', 
          border: 'none', 
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: 500
        }}>
          Выйти
        </button>
      </div>
    </div>
  );
};

export default AdminPage;
