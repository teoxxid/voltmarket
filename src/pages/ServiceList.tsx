import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { addToCartThunk } from '../store/thunks/orderThunks';
import { showNotification } from '../store/slices/uiSlice';
import { setFilters, clearFilters } from '../store/slices/filterSlice';
import Loader from '../components/Loader';

interface Service {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  brand: string;
  rating?: number;
  image_url?: string;
  status: 'active' | 'inactive' | 'deleted';
}

const API_BASE = '/api';
const CACHE_TTL = 5 * 60 * 1000; // 5 минут
const CATALOG_CACHE_KEY = 'voltmarket_catalog';

// 🔹 Хук для кэширования каталога
function useCatalogCache() {
  const [data, setData] = useState<Service[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCatalog = useCallback(async () => {
    try {
      // 🔹 Проверяем кэш
      const cached = localStorage.getItem(CATALOG_CACHE_KEY);
      if (cached) {
        const { data: cachedData, timestamp }: { data: Service[]; timestamp: number } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }

      // 🔹 Запрашиваем с бэкенда
      const response = await fetch(`${API_BASE}/services/`, {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      const apiData: Service[] = result.data || result;

      // 🔹 Сохраняем в кэш
      localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ 
        data: apiData, 
        timestamp: Date.now() 
      }));
      
      setData(apiData);
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const invalidateCache = useCallback(() => {
    localStorage.removeItem(CATALOG_CACHE_KEY);
    fetchCatalog();
  }, [fetchCatalog]);

  return { data, loading, refetch: invalidateCache };
}

const ServiceList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const [addingId, setAddingId] = useState<number | null>(null);

  // 🔹 Получаем фильтры из Redux
  const filters = useSelector((state: RootState) => state.filters);
  const user = useSelector((state: RootState) => state.auth.user);

  // 🔹 Локальные состояния для инпутов
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [localCategory, setLocalCategory] = useState(filters.category);
  const [localPriceFrom, setLocalPriceFrom] = useState(filters.priceFrom?.toString() || '');
  const [localPriceTo, setLocalPriceTo] = useState(filters.priceTo?.toString() || '');

  const { data: allServices, loading } = useCatalogCache();

  // 🔹 Фильтрация товаров (мемоизируем)
  const services = useMemo(() => {
    if (!allServices) return [];
    
    return allServices.filter(service => {
      if (filters.search && !service.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.category && filters.category !== 'all' && service.category !== filters.category) {
        return false;
      }
      if (filters.priceFrom !== null && service.price < filters.priceFrom) {
        return false;
      }
      if (filters.priceTo !== null && service.price > filters.priceTo) {
        return false;
      }
      return true;
    });
  }, [allServices, filters]);

  // 🔹 Синхронизация фильтров из URL при загрузке
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get('search') || '';
    const urlCategory = params.get('category') || '';
    const urlPriceFrom = params.get('price_from');
    const urlPriceTo = params.get('price_to');

    // Обновляем только если фильтры в URL отличаются от текущих
    if (urlSearch !== filters.search || urlCategory !== filters.category) {
      dispatch(setFilters({
        search: urlSearch,
        category: urlCategory,
        priceFrom: urlPriceFrom ? Number(urlPriceFrom) : null,
        priceTo: urlPriceTo ? Number(urlPriceTo) : null,
      }));
    }
    
    // Синхронизируем локальные инпуты
    setLocalSearch(urlSearch);
    setLocalCategory(urlCategory);
    setLocalPriceFrom(urlPriceFrom || '');
    setLocalPriceTo(urlPriceTo || '');
  }, [location.search, dispatch, filters]);

  // 🔹 Применение фильтров
  const handleApplyFilters = () => {
    const fromValue = localPriceFrom ? Math.max(0, Number(localPriceFrom)) : null;
    const toValue = localPriceTo ? Math.max(0, Number(localPriceTo)) : null;
    
    const newFilters = {
      search: localSearch,
      category: localCategory,
      priceFrom: fromValue,
      priceTo: toValue,
    };
    
    dispatch(setFilters(newFilters));

    // 🔹 Обновляем URL
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.category && newFilters.category !== 'all') params.set('category', newFilters.category);
    if (newFilters.priceFrom !== null) params.set('price_from', String(newFilters.priceFrom));
    if (newFilters.priceTo !== null) params.set('price_to', String(newFilters.priceTo));
    
    navigate(`/catalog/?${params}`, { replace: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  };

  const handleResetFilters = () => {
    dispatch(clearFilters());
    setLocalSearch('');
    setLocalCategory('');
    setLocalPriceFrom('');
    setLocalPriceTo('');
    navigate('/catalog/', { replace: true });
  };

  const handleAddToCart = async (e: React.MouseEvent, service: Service) => {
    e.stopPropagation();
    
    if (!user) {
      navigate('/login/', { state: { from: '/catalog/' } });
      dispatch(showNotification({ 
        type: 'info', 
        message: 'Войдите, чтобы добавить товар в заказ' 
      }));
      return;
    }
    
    setAddingId(service.id);
    try {
      const result = await dispatch(addToCartThunk(service.id));
      if (addToCartThunk.fulfilled.match(result)) {
        dispatch(showNotification({ type: 'success', message: `"${service.name}" добавлен в заказ` }));
      } else {
        dispatch(showNotification({ type: 'error', message: 'Ошибка добавления' }));
      }
    } catch {
      dispatch(showNotification({ type: 'error', message: 'Ошибка сети' }));
    }
    setAddingId(null);
  };

  // 🔹 Список категорий для фильтра
  const categories = useMemo(() => {
    if (!allServices) return ['all'];
    const unique = [...new Set(allServices.map(s => s.category))];
    return ['all', ...unique];
  }, [allServices]);

  if (loading && !allServices) {
    return <Loader size="large" text="Загрузка каталога..." />;
  }

  return (
    <div className="container">
      <div className="catalog-header">
        <h2 className="page-title">Каталог товаров</h2>
      </div>

      {/* 🔹 Панель фильтров */}
      <div className="filters-panel">
        <div className="filter-row">
          <div className="filter-group">
            <label>Поиск:</label>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Название товара..."
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Категория:</label>
            <select
              value={localCategory}
              onChange={(e) => setLocalCategory(e.target.value)}
              onKeyDown={handleKeyDown}
              className="filter-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Все категории' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Цена от:</label>
            <input
              type="number"
              min="0"
              value={localPriceFrom}
              onChange={(e) => setLocalPriceFrom(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0"
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Цена до:</label>
            <input
              type="number"
              min="0"
              value={localPriceTo}
              onChange={(e) => setLocalPriceTo(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="999999"
              className="filter-input"
            />
          </div>

          <div className="filter-buttons">
            <button onClick={handleApplyFilters} className="filter-btn filter-apply">
              Применить
            </button>
            <button onClick={handleResetFilters} className="filter-btn filter-reset">
              Сбросить
            </button>
          </div>
        </div>
      </div>

      {/* 🔹 Сетка товаров */}
      {services.length > 0 ? (
        <div className="products-grid">
          {services.map((service) => (
            <div
              key={service.id}
              className="product-card"
              onClick={() => navigate(`/service/${service.id}/`)}
              role="button"
              tabIndex={0}
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
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                (e.currentTarget as HTMLElement).style.borderColor = '#005bff';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                (e.currentTarget as HTMLElement).style.borderColor = '#e0e0e0';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              {/* Изображение */}
              <div style={{
                width: '100%',
                height: '240px',
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
                  src={service.image_url || '/placeholder.svg'} 
                  alt={service.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseOver={(e) => {
                    (e.target as HTMLImageElement).style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    (e.target as HTMLImageElement).style.transform = 'scale(1)';
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  loading="lazy"
                />
              </div>
              
              {/* Информация */}
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
                }}>{service.name}</h3>
                
                <p style={{
                  fontSize: '13px',
                  color: '#888',
                  marginBottom: '8px',
                }}>{service.category}</p>
                
                {service.rating && (
                  <p style={{
                    fontSize: '13px',
                    color: '#ffa500',
                    marginBottom: '12px',
                    fontWeight: 500,
                  }}>★ {service.rating}</p>
                )}
                
                <p style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#005bff',
                  marginTop: 'auto',
                }}>{service.price.toLocaleString('ru-RU')} ₽</p>
              </div>
              
              {/* Кнопка добавления */}
              <button
                onClick={(e) => handleAddToCart(e, service)}
                disabled={addingId === service.id}
                style={{
                  margin: '0 16px 16px',
                  padding: '10px 16px',
                  background: addingId === service.id ? '#ccc' : '#005bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: addingId === service.id ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onMouseOver={(e) => {
                  if (addingId !== service.id) {
                    (e.currentTarget as HTMLElement).style.background = '#0047cc';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (addingId !== service.id) {
                    (e.currentTarget as HTMLElement).style.background = '#005bff';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }
                }}
                aria-label={`Добавить ${service.name} в заказ`}
              >
                {addingId === service.id ? (
                  <>
                    <span>⏳</span>
                    <span>Добавление...</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'block'}}>
                      <circle cx="9" cy="21" r="1"/>
                      <circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                      <path d="M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/>
                    </svg>
                    <span>В заказ</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-cart">
          <p>Товары не найдены</p>
          {(filters.search || filters.category || filters.priceFrom !== null || filters.priceTo !== null) && (
            <button onClick={handleResetFilters} className="btn btn-secondary">
              Сбросить фильтры
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceList;
