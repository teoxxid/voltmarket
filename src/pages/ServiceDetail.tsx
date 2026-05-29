import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { showNotification } from '../store/slices/uiSlice';
import { addToCartThunk, fetchCartIconThunk } from '../store/thunks/orderThunks';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  category?: string;
  brand?: string;
  rating?: number;
  weight?: number | string;
  image_url?: string;
  video_url?: string;
  status?: string;
}

const MINIO_BASE_URL = 'http://localhost:9000/services';

const ServiceDetail: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [relatedServices, setRelatedServices] = useState<Service[]>([]);
  
  const user = useSelector((state: RootState) => state.auth.user);
  const isGlobalLoading = useSelector((state: RootState) => state.ui.loading);

  useEffect(() => {
    if (!serviceId) return;
    
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/services/${serviceId}/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const serviceData = json.data || json;
        
        if (serviceData && !serviceData.video_url && serviceData.name) {
          const possibleVideoName = serviceData.name.toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^\w\-]/g, '') + '.mp4';
          const possibleVideoUrl = `${MINIO_BASE_URL}/${possibleVideoName}`;
          
          try {
            const checkRes = await fetch(possibleVideoUrl, { method: 'HEAD' });
            if (checkRes.ok) {
              serviceData.video_url = possibleVideoUrl;
            }
          } catch {
          }
        }
        
        setService(serviceData);
        
        // 🔹 Загружаем похожие товары ТОЛЬКО по категории
        if (serviceData?.category) {
          try {
            const relatedRes = await fetch(`/api/services/?category=${encodeURIComponent(serviceData.category)}&limit=4`);
            if (relatedRes.ok) {
              const relatedJson = await relatedRes.json();
              const relatedData = relatedJson.results || relatedJson.data || relatedJson;
              const relatedList = Array.isArray(relatedData) ? relatedData : [];
              setRelatedServices(relatedList.filter((s: Service) => s.id !== serviceData.id).slice(0, 4));
            }
          } catch (e) {
            console.warn('Failed to fetch related by category:', e);
            setRelatedServices([]);
          }
        } else {
          setRelatedServices([]);
        }
      } catch (err) {
        console.error('Failed to fetch service:', err);
        dispatch(showNotification({ type: 'error', message: 'Ошибка загрузки товара' }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchService();
  }, [serviceId, dispatch]);

  const handleAddToCart = async () => {
    if (!service) return;
    
    if (!user) {
      dispatch(showNotification({ 
        type: 'info', 
        message: 'Войдите, чтобы добавить товар в заказ' 
      }));
      return;
    }
    
    setAddingToCart(true);
    
    // 🔹 Диспатчим thunk и ждём результат
    const result = await dispatch(addToCartThunk(service.id));
    
    // 🔹 Проверяем результат
    if (addToCartThunk.fulfilled.match(result)) {
      // ✅ Успех — уведомление уже показано в thunk, но можно продублировать
      dispatch(showNotification({ 
        type: 'success', 
        message: `${service.name} добавлен в заказ` 
      }));
      
      // 🔹 Обновляем иконку корзины в навбаре
      dispatch(fetchCartIconThunk());
    } else {
      // ❌ Ошибка
      dispatch(showNotification({ 
        type: 'error', 
        message: (result.payload as string) || 'Ошибка добавления в заказ' 
      }));
    }
    setAddingToCart(false);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: 50, textAlign: 'center' }}>
        <div className="loader-spinner" style={{ margin: '0 auto 20px' }}></div>
        <p>Загрузка товара...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container">
        <div className="not-found-card">
          <h1 className="not-found-code">404</h1>
          <p>Товар не найден</p>
          <Link to="/catalog/" className="btn btn-primary">Вернуться в каталог</Link>
        </div>
      </div>
    );
  }

  const hasValidVideo = service.video_url && !hasVideoError;
  const shouldCropVideo = service.name?.toLowerCase().includes('apple watch');

  return (
    <div className="container">
      <div className="product-detail-card">
        <div className="product-detail-image-section">
          <div className="product-image-container">
            {hasValidVideo ? (
              <video 
                autoPlay 
                muted 
                loop 
                playsInline 
                controls 
                className="product-detail-media"
                data-crop={shouldCropVideo ? 'true' : undefined}
                poster={service.image_url || ''}
                onError={() => setHasVideoError(true)}
              >
                <source src={service.video_url} type="video/mp4" />
              </video>
            ) : (
              <img 
                src={service.image_url || '/placeholder.svg'} 
                alt={service.name} 
                className="product-detail-media"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
              />
            )}
          </div>
        </div>

        <div className="product-detail-info">
          <Link to="/catalog/" className="back-link">
            ← Назад в каталог
          </Link>

          <h1 className="product-detail-title">{service.name}</h1>
          
          <div className="product-detail-price">
            {service.price.toLocaleString('ru-RU')} ₽
          </div>

          <div className="product-detail-specs">
            {service.category && (
              <div className="spec-row">
                <span className="spec-label">Категория</span>
                <span className="spec-value">{service.category}</span>
              </div>
            )}
            {service.brand && (
              <div className="spec-row">
                <span className="spec-label">Бренд</span>
                <span className="spec-value">{service.brand}</span>
              </div>
            )}
            {service.weight != null && (
              <div className="spec-row">
                <span className="spec-label">Вес</span>
                <span className="spec-value">{service.weight} кг</span>
              </div>
            )}
            {service.rating && (
              <div className="spec-row">
                <span className="spec-label">Рейтинг</span>
                <span className="spec-value">★ {service.rating}</span>
              </div>
            )}
          </div>
          
          {service.description && (
            <div className="product-detail-description">
              <h3>Описание</h3>
              <p>{service.description}</p>
            </div>
          )}
          
          {user ? (
            <button
              onClick={handleAddToCart}
              disabled={isGlobalLoading || addingToCart}
              className="add-to-order-btn"
            >
              {addingToCart ? 'Добавление...' : 'Добавить в заказ'}
            </button>
          ) : (
            <Link to="/login/" state={{ from: `/service/${serviceId}/` }} className="login-to-add-btn">
              Войдите, чтобы добавить в заказ
            </Link>
          )}
        </div>
      </div>

      {/* 🔹 Похожие товары */}
      {relatedServices.length > 0 && (
        <section className="related-products" style={{
          marginTop: '60px',
          padding: '40px 0',
          borderTop: '2px solid #f0f0f0',
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '32px',
            color: '#0f172a',
          }}>
            Похожие товары
          </h2>
          
          <div className="products-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
          }}>
            {relatedServices.map((related) => (
              <div
                key={related.id}
                className="product-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  border: '1px solid #e0e0e0',
                  height: '100%',
                }}
                onClick={() => window.location.href = `/service/${related.id}/`}
              >
                <div style={{
                  width: '100%',
                  height: '200px',
                  background: 'white',
                  border: '1px solid #d0d0d0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  boxSizing: 'border-box',
                  marginBottom: '16px',
                }}>
                  <img 
                    src={related.image_url || '/placeholder.svg'} 
                    alt={related.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </div>
                
                <div style={{
                  padding: '0 20px 16px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#333',
                    marginBottom: '4px',
                    lineHeight: 1.4,
                    minHeight: '42px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>{related.name}</h3>
                  
                  <p style={{
                    fontSize: '13px',
                    color: '#888',
                    marginBottom: '8px',
                  }}>{related.category}</p>
                  
                  <p style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#005bff',
                    marginTop: 'auto',
                  }}>{related.price.toLocaleString('ru-RU')} ₽</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ServiceDetail;
