import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 🔹 Типы пропсов
interface LoginProps {
  // 🔹 onLogin принимает объект с креденшиалами и возвращает Promise с результатом
  onLogin: (credentials: { username: string; password: string }) => Promise<{ 
    success: boolean; 
    error?: string;
  }>;
  // 🔹 Ошибка авторизации от родительского компонента (App)
  authError?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, authError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Сбрасываем ошибки перед новой попыткой
    setLocalError('');
    setIsSubmitting(true);

    // 🔹 Базовая валидация
    if (!username.trim() || !password.trim()) {
      setLocalError('Введите логин и пароль');
      setIsSubmitting(false);
      return;
    }

    try {
      // 🔹 Вызываем onLogin с объектом { username, password }
      const result = await onLogin({ username, password });
      
      if (result.success) {
        console.log(`[Login] Success | user=${username}`);
        // 🔹 Редирект только после успешного логина
        navigate('/pages/', { replace: true });
      } else {
        // 🔹 Показываем ошибку от бэкенда или дефолтное сообщение
        setLocalError(result.error || 'Неверные учетные данные');
        console.log(`[Login] Failed | user=${username} | error=${result.error}`);
      }
    } catch (err) {
      // 🔹 Обработка сетевых ошибок (если fetch упал)
      setLocalError('Ошибка соединения с сервером');
      console.error('[Login] Exception:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 Объединяем локальные ошибки и ошибки от App
  const errorMessage = localError || authError || '';

  return (
    <div style={{ 
      maxWidth: 400, 
      margin: '80px auto', 
      padding: 24, 
      background: 'white',
      borderRadius: 12,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginBottom: 24, textAlign: 'center', color: '#1e293b' }}>
        🔐 Вход в систему
      </h2>
      
      {/* 🔹 Отображение ошибки (локальной или от App) */}
      {errorMessage && (
        <div style={{ 
          padding: '12px 16px', 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: 8, 
          color: '#dc2626',
          marginBottom: 20,
          fontSize: 14
        }}>
          ⚠️ {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 6, 
            fontWeight: 500,
            color: '#334155'
          }}>
            Логин:
          </label>
          <input 
            type="text" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
            disabled={isSubmitting}
            placeholder="Введите логин"
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
          />
        </div>
        
        <div style={{ marginBottom: 24 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 6, 
            fontWeight: 500,
            color: '#334155'
          }}>
            Пароль:
          </label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            disabled={isSubmitting}
            placeholder="Введите пароль"
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting || !username.trim() || !password.trim()}
          style={{ 
            width: '100%',
            padding: '12px 20px', 
            background: isSubmitting ? '#94a3b8' : '#2563eb', 
            color: 'white', 
            border: 'none', 
            borderRadius: 6,
            fontSize: 16,
            fontWeight: 500,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={e => {
            if (!isSubmitting) e.currentTarget.style.background = '#1d4ed8';
          }}
          onMouseOut={e => {
            if (!isSubmitting) e.currentTarget.style.background = '#2563eb';
          }}
        >
          {isSubmitting ? '⏳ Вход...' : 'Войти'}
        </button>
      </form>
      
      {/* 🔹 Подсказка для тестирования */}
      <div style={{ 
        marginTop: 24, 
        padding: '12px 16px', 
        background: '#f1f5f9', 
        borderRadius: 8,
        fontSize: 13,
        color: '#64748b'
      }}>
        <strong>💡 Для тестирования:</strong><br/>
        • Создайте пользователя через регистрацию или админку<br/>
        • Или используйте: <code>newuser / newpass123</code>
      </div>
    </div>
  );
};

export default Login;
