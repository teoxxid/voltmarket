import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { ServiceCard } from '../components/ServiceCard';
import type { Service } from '../types/Service';

// 🔹 Константы кэширования
const CACHE_PREFIX = 'voltmarket_services_';
const DEFAULT_TTL = 300000; // 5 минут в миллисекундах

// 🔹 Mock-данные для Лабы 6 (требование: "fallback при отсутствии доступа")
const mockServices: Service[] = [
  { 
    id: 1, 
    name: 'iPhone 16 Pro', 
    price: 119990, 
    description: 'Флагманский смартфон с процессором A18 Pro и титановым корпусом', 
    image_url: 'http://localhost:9000/services/iphone16pro.jpg', 
    category: 'Смартфоны', 
    brand: 'Apple', 
    rating: 4.8 
  },
  { 
    id: 2, 
    name: 'MacBook Pro 16', 
    price: 249990, 
    description: 'Мощный ноутбук для профессионалов с чипом M3 Max', 
    image_url: 'http://localhost:9000/services/macbookpro16.jpg', 
    category: 'Ноутбуки', 
    brand: 'Apple', 
    rating: 4.9 
  },
  { 
    id: 3, 
    name: 'Sony WH-1000XM5', 
    price: 34990, 
    description: 'Беспроводные наушники с шумоподавлением премиум-класса', 
    image_url: 'http://localhost:9000/services/sonywh1000xm5.jpg', 
    category: 'Аудио', 
    brand: 'Sony', 
    rating: 4.7 
  },
  { 
    id: 4, 
    name: 'Samsung Galaxy S24 Ultra', 
    price: 129990, 
    description: 'Флагман на Android с ИИ-функциями и стилусом S Pen', 
    image_url: 'http://localhost:9000/services/galaxys24ultra.jpg', 
    category: 'Смартфоны', 
    brand: 'Samsung', 
    rating: 4.7 
  },
  { 
    id: 5, 
    name: 'LG OLED C3 55"', 
    price: 149990, 
    description: '4K OLED телевизор с поддержкой Dolby Vision и игровыми режимами', 
    image_url: 'http://localhost:9000/services/lgoledc3.jpg', 
    category: 'Телевизоры', 
    brand: 'LG', 
    rating: 4.9 
  },
  { 
    id: 6, 
    name: 'Dyson V15 Detect', 
    price: 74990, 
    description: 'Беспроводной пылесос с лазерной подсветкой и подсчётом частиц', 
    image_url: 'http://localhost:9000/services/dysonv15.jpg', 
    category: 'Бытовая техника', 
    brand: 'Dyson', 
    rating: 4.6 
  },
];

// 🔹 Хук для кэширования запросов (переиспользуемый)
function useCachedFetch<T>(url: string, ttl: number = DEFAULT_TTL) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [cacheStatus, setCacheStatus] = useState<'HIT' | 'MISS' | 'ERROR' | 'LOADING'>('LOADING');

  const fetchData = useCallback(async () => {
    const cacheKey = CACHE_PREFIX + btoa(url); // Base64 для безопасного ключа
    const now = Date.now();

    // 1. Проверяем localStorage
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data: cachedData, timestamp, expiresAt } = JSON.parse(cached);
        
        if (now < expiresAt) {
          // ✅ CACHE HIT
          console.log(`[${new Date().toISOString()}] 🟢 CACHE HIT | key=${cacheKey} | ttl=${ttl}ms`);
          setData(cachedData);
          setCacheStatus('HIT');
          setLoading(false);
          return;
        } else {
          // ⏰ TTL истёк
          console.log(`[${new Date().toISOString()}] ⏰ CACHE EXPIRED | key=${cacheKey}`);
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (e) {
      console.warn(`[${new Date().toISOString()}] ⚠️ CACHE PARSE ERROR | key=${cacheKey}`, e);
      localStorage.removeItem(cacheKey);
    }

    // 2. CACHE MISS -> fetch from API
    console.log(`[${new Date().toISOString()}] 🔴 CACHE MISS | key=${cacheKey} | fetching from API...`);
    setCacheStatus('MISS');
    setLoading(true);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      
      // Нормализация ответа (бэкенд возвращает {status, data} или просто массив)
      const resultData = json.data || json;
      
      // Сохраняем в кэш
      localStorage.setItem(cacheKey, JSON.stringify({
        data: resultData,
        timestamp: now,
        expiresAt: now + ttl,
      }));
      
      console.log(`[${new Date().toISOString()}] 💾 CACHE SET | key=${cacheKey} | ttl=${ttl}ms`);
      
      setData(resultData);
      setCacheStatus('HIT'); // После сохранения считаем, что данные "из кэша" для следующих рендеров
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ CACHE ERROR | key=${cacheKey} | error=`, error);
      setCacheStatus('ERROR');
      throw error; // Пробрасываем ошибку дальше для fallback на mock
    } finally {
      setLoading(false);
    }
  }, [url, ttl]);

  // Функция для ручной инвалидации кэша
  const invalidateCache = useCallback(() => {
    const cacheKey = CACHE_PREFIX + btoa(url);
    localStorage.removeItem(cacheKey);
    console.log(`[${new Date().toISOString()}] 🗑 CACHE INVALIDATE | key=${cacheKey}`);
    fetchData(); // Перезагружаем данные
  }, [url, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, cacheStatus, invalidateCache };
}

// 🔹 Основной компонент
const ServiceList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Все');
  const [priceRange, setPriceRange] = useState('');

  // Формируем уникальный URL с параметрами для кэширования
  const params = new URLSearchParams();
  if (search) params.append('name', search);
  if (category !== 'Все') params.append('category', category);
  if (priceRange) {
    const [min, max] = priceRange.split('-');
    params.append('price_min', min);
    if (max) params.append('price_max', max);
  }
  const apiUrl = `/api/services/?${params.toString()}`;

  // Используем наш хук кэширования
  const { 
    data: apiData, 
    loading: apiLoading, 
    cacheStatus, 
    invalidateCache 
  } = useCachedFetch<Service[]>(apiUrl);

  // Состояние для данных (могут быть из API или mock)
  const [services, setServices] = useState<Service[]>([]);
  const [usingMock, setUsingMock] = useState(false);

  // Обработка данных: если API упал -> fallback на mock
  useEffect(() => {
    if (apiData && Array.isArray(apiData)) {
      setServices(apiData);
      setUsingMock(false);
    }
  }, [apiData]);

  // 🔹 Динамический список категорий
  const categories = ['Все', ...new Set(services.map(s => s.category))];

  // 🔹 Клиентская фильтрация (для мгновенного отклика интерфейса)
  const filtered = services.filter(service => {
    const matchSearch = service.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'Все' || service.category === category;
    
    let matchPrice = true;
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      if (max) {
        matchPrice = service.price >= min && service.price <= max;
      } else {
        matchPrice = service.price >= min;
      }
    }
    
    return matchSearch && matchCategory && matchPrice;
  });

  const handleAddToCart = (id: number) => {
    console.log(`🛒 Добавление товара ${id} в корзину`);
  };

  // 🔹 Кнопка сброса ВСЕГО кэша (для демо)
  const handleClearAllCache = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
        console.log(`[${new Date().toISOString()}] 🗑 CACHE CLEAR | key=${key}`);
      }
    });
    window.location.reload();
  };

  // 🔹 Индикатор статуса кэша
  const CacheBadge = () => {
    const colors = {
      HIT: '#28a745',    // зелёный
      MISS: '#dc3545',   // красный
      ERROR: '#6c757d',  // серый
      LOADING: '#ffc107' // жёлтый
    };
    const labels = {
      HIT: '🟢 Cache Hit',
      MISS: '🔴 Cache Miss',
      ERROR: '⚪ Error',
      LOADING: '🔄 Loading'
    };

    return (
      <div style={{
        position: 'fixed',
        top: 70,
        right: 20,
        padding: '6px 12px',
        borderRadius: '20px',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 'bold',
        backgroundColor: colors[cacheStatus],
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transition: 'background-color 0.2s'
      }}>
        {labels[cacheStatus]}
        {usingMock && ' (mock)'}
      </div>
    );
  };

  if (apiLoading && services.length === 0) {
    return (
      <Container className="py-5 text-center">
        <CacheBadge />
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-3">Загрузка каталога...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <CacheBadge />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Каталог товаров</h2>
        
        {/* Кнопка сброса кэша (только для демо) */}
        <Button 
          variant="outline-danger" 
          size="sm" 
          onClick={handleClearAllCache}
          title="Очистить кэш и перезагрузить данные"
        >
          🗑 Сбросить кэш
        </Button>
      </div>

      {/* Фильтры */}
      <Row className="mb-4 g-3">
        <Col md={5}>
          <Form.Control
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Select value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select value={priceRange} onChange={e => setPriceRange(e.target.value)}>
            <option value="">Все цены</option>
            <option value="0-50000">до 50 000 ₽</option>
            <option value="50000-100000">50 000 – 100 000 ₽</option>
            <option value="100000-999999">от 100 000 ₽</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Список карточек */}
      <Row xs={1} md={2} lg={3} className="g-4">
        {filtered.map((service) => (
          <Col key={service.id}>
            <ServiceCard 
              service={service} 
              onAddToCart={handleAddToCart} 
            />
          </Col>
        ))}
      </Row>

      {filtered.length === 0 && !apiLoading && (
        <p className="text-center mt-5 text-muted">
          {usingMock 
            ? 'Mock-данные: товары не найдены. Попробуйте изменить фильтры.' 
            : 'Товары не найдены. Попробуйте изменить фильтры.'
          }
        </p>
      )}
    </Container>
  );
};

export default ServiceList;
