import React from 'react';

interface UserPageProps {
  user: { username: string; role: string } | null;
  onLogout: () => void;
}

const UserPage: React.FC<UserPageProps> = ({ user, onLogout }) => {
  if (!user) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <p>Ошибка: пользователь не авторизован</p>
        <button onClick={onLogout} style={{ marginTop: 20 }}>На главную</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '50px auto', padding: 20, background: '#f8fafc', borderRadius: 12 }}>
      <h2 style={{ marginBottom: 20 }}>User Dashboard</h2>
      
      <div style={{ background: 'white', padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <p><strong>Пользователь:</strong> {user.username}</p>
        <p><strong>Роль:</strong> <span style={{ 
          padding: '4px 12px', 
          borderRadius: 20, 
          background: user.role === 'ADMIN' ? '#dc2626' : '#2563eb',
          color: 'white',
          fontSize: 14
        }}>{user.role}</span></p>
      </div>
      
      <p style={{ color: '#666', marginBottom: 20 }}>
        Эта страница доступна авторизованным пользователям (<strong>USER</strong> и <strong>ADMIN</strong>).
      </p>
      
      <div style={{ display: 'flex', gap: 10 }}>
        <a href="/pages/catalog/" style={{ 
          padding: '10px 20px', 
          background: '#2563eb', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: 6,
          fontWeight: 500
        }}>
          🛒 В каталог
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

export default UserPage;
