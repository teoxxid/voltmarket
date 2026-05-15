import React from 'react';
import { Link } from 'react-router-dom';

interface HomePageProps {
  user: { username: string; role: 'USER' | 'ADMIN' } | null;
}

const HomePage: React.FC<HomePageProps> = ({ user }) => {
  return (
    <div style={{ 
      maxWidth: 800, 
      margin: '50px auto', 
      padding: 24, 
      background: 'white',
      borderRadius: 12,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <h1 style={{ 
        marginBottom: 24, 
        color: '#1e293b',
        textAlign: 'center',
        fontSize: 28
      }}>
        ⚡ Добро пожаловать в VoltMarket
      </h1>
      
      {user ? (
        <div style={{ 
          padding: 20, 
          background: '#f8fafc', 
          borderRadius: 8,
          border: '1px solid #e2e8f0'
        }}>
          <p style={{ marginBottom: 8, fontSize: 16 }}>
            👋 Вы вошли как <strong style={{ color: '#2563eb' }}>{user.username}</strong>
          </p>
          <p style={{ marginBottom: 24, fontSize: 14, color: '#64748b' }}>
            Роль: <span style={{ 
              padding: '4px 12px', 
              borderRadius: 20, 
              background: user.role === 'ADMIN' ? '#dc2626' : '#2563eb',
              color: 'white',
              fontSize: 12,
              fontWeight: 500
            }}>
              {user.role}
            </span>
          </p>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* 🔹 Ссылка на User Page — правильный путь с /pages/ и слэшем */}
            <Link to="/pages/user-page/" style={{ textDecoration: 'none' }}>
              <button style={{ 
                padding: '10px 20px', 
                background: '#2563eb', 
                color: 'white', 
                border: 'none', 
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'background 0.2s'
              }}
              onMouseOver={e => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseOut={e => (e.currentTarget.style.background = '#2563eb')}
              >
                👤 User Dashboard
              </button>
            </Link>
            
            {/* 🔹 Кнопка только для ADMIN — путь тоже исправлен */}
            {user.role === 'ADMIN' && (
              <Link to="/pages/admin-page/" style={{ textDecoration: 'none' }}>
                <button style={{ 
                  padding: '10px 20px', 
                  background: '#dc2626', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'background 0.2s'
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#b91c1c')}
                onMouseOut={e => (e.currentTarget.style.background = '#dc2626')}
                >
                  🛡️ Admin Panel
                </button>
              </Link>
            )}
            
            {/* 🔹 Дополнительные ссылки для удобства */}
            <Link to="/pages/catalog/" style={{ textDecoration: 'none' }}>
              <button style={{ 
                padding: '10px 20px', 
                background: '#64748b', 
                color: 'white', 
                border: 'none', 
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500
              }}>
                🛒 В каталог
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ 
          padding: 24, 
          textAlign: 'center',
          background: '#fef2f2',
          borderRadius: 8,
          border: '1px solid #fecaca'
        }}>
          <p style={{ marginBottom: 20, color: '#64748b', fontSize: 16 }}>
            🔐 Вы не авторизованы
          </p>
          <Link to="/login/" style={{ textDecoration: 'none' }}>
            <button style={{ 
              padding: '12px 24px', 
              background: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 16
            }}>
              Войти в систему
            </button>
          </Link>
          <p style={{ marginTop: 16, fontSize: 13, color: '#94a3b8' }}>
            Или <Link to="/register/" style={{ color: '#2563eb' }}>зарегистрируйтесь</Link>
          </p>
        </div>
      )}
      
      {/* 🔹 Информационный блок для тестирования */}
      <div style={{ 
        marginTop: 32, 
        padding: '16px 20px', 
        background: '#f1f5f9', 
        borderRadius: 8,
        fontSize: 13,
        color: '#64748b'
      }}>
        <strong>💡 Тестовые аккаунты:</strong><br/>
        • Админ: <code>admin / admin123</code> (роль: ADMIN)<br/>
        • Пользователь: <code>user1 / userpass123</code> (роль: USER)<br/>
        • Каталог доступен всем авторизованным пользователям
      </div>
    </div>
  );
};

export default HomePage;
