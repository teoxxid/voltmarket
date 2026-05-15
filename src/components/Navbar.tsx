import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  user: { username: string; role: string } | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log('[Navbar] Logout clicked');
    await onLogout();
    navigate('/login/', { replace: true });
  };

  // 🔹 Функция для перехода на страницу профиля
  const handleProfileClick = () => {
    if (user?.role === 'ADMIN') {
      navigate('/pages/admin-page/', { replace: false });
    } else {
      navigate('/pages/user-page/', { replace: false });
    }
  };

  return (
    <nav style={{ 
      background: '#007bff', 
      padding: '12px 24px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* 🔹 Левая часть: логотип и меню */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <Link to="/pages/" style={{ 
          color: 'white', 
          textDecoration: 'none', 
          fontWeight: 'bold',
          fontSize: 18
        }}>
          ⚡ VoltMarket
        </Link>
        
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/pages/catalog/" style={{ 
            color: 'rgba(255,255,255,0.9)', 
            textDecoration: 'none',
            fontSize: 14,
            transition: 'color 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.color = '#fff'}
          onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
          >
            🛒 Каталог
          </Link>
          
          {user && (
            <Link to="/pages/cart/" style={{ 
              color: 'rgba(255,255,255,0.9)', 
              textDecoration: 'none',
              fontSize: 14,
              transition: 'color 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.color = '#fff'}
            onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
            >
              🛍️ Корзина
            </Link>
          )}
        </div>
      </div>
      
      {/* 🔹 Правая часть: пользователь и выход */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {user ? (
          <>
            {/* 🔹 КЛИКАБЕЛЬНОЕ имя пользователя + роль */}
            <div 
              onClick={handleProfileClick}
              style={{ 
                color: 'white', 
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',  // 🔹 Показываем, что это кликабельно
                padding: '6px 12px',
                borderRadius: 6,
                transition: 'background 0.2s',
                border: '1px solid transparent'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              title={user.role === 'ADMIN' ? 'Перейти в Admin Panel' : 'Перейти в User Dashboard'}
            >
              <span>👤</span>
              <span style={{ fontWeight: 500 }}>{user.username}</span>
              <span style={{ 
                fontSize: 11,
                padding: '2px 8px',
                background: user.role === 'ADMIN' ? '#ff4757' : '#2ed573',
                borderRadius: 12,
                color: 'white',
                fontWeight: 600
              }}>
                {user.role}
              </span>
            </div>
            
            <button 
              onClick={handleLogout}
              style={{ 
                padding: '8px 16px', 
                background: 'rgba(255,255,255,0.2)', 
                color: 'white', 
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                transition: 'background 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              🚪 Выйти
            </button>
          </>
        ) : (
          <Link to="/login/" style={{ 
            padding: '8px 16px', 
            background: 'white', 
            color: '#007bff', 
            textDecoration: 'none', 
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#f8f9fa'}
          onMouseOut={e => e.currentTarget.style.background = 'white'}
          >
            Войти
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
