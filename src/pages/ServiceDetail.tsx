import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEmbedding, cosineSimilarity } from '../utils/similarity';

// 🔹 Интерфейс для услуги
export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  video_url?: string;
  brand?: string;
  rating?: number;
  weight?: number;
  status?: string;
  [key: string]: any;
}

// 🔹 Mock-данные для Лабы 6 (требование: "fallback при отсутствии доступа")
const mockServices: Service[] = [
  { id: 1, name: "iPhone 16 Pro", description: "Флагманский смартфон с процессором A18 Pro и титановым корпусом", price: 120000, category: "Смартфоны", image_url: "http://localhost:9000/services/iphone16pro.jpg" },
  { id: 2, name: "Samsung Galaxy S24", description: "Премиум смартфон с ИИ-функциями и отличным дисплеем", price: 95000, category: "Смартфоны", image_url: "http://localhost:9000/services/galaxys24.jpg" },
  { id: 3, name: "MacBook Pro 14", description: "Профессиональный ноутбук с чипом M3 для сложных задач", price: 180000, category: "Ноутбуки", image_url: "http://localhost:9000/services/macbookpro14.jpg" },
  { id: 4, name: "Sony WH-1000XM5", description: "Беспроводные наушники с шумоподавлением премиум-класса", price: 35000, category: "Аудио", image_url: "http://localhost:9000/services/sonywh1000xm5.jpg" },
  { id: 5, name: "LG OLED C3", description: "4K OLED телевизор с поддержкой Dolby Vision и игровыми режимами", price: 150000, category: "Телевизоры", image_url: "http://localhost:9000/services/lgoledc3.jpg" },
  { id: 6, name: "iPhone 15 Pro", description: "Прошлогодний флагман с отличной камерой", price: 99000, category: "Смартфоны", image_url: "http://localhost:9000/services/iphone15pro.jpg" },
];

const ServiceDetail = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const serviceIdNum = serviceId ? parseInt(serviceId, 10) : 0;

  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [similarServices, setSimilarServices] = useState<Service[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // 🔹 Загрузка текущей услуги
  useEffect(() => {
    if (!serviceIdNum) return;

    const fetchService = async () => {
      try {
        const res = await fetch(`/api/services/${serviceIdNum}/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const serviceData = json.data || json;
        setCurrentService(serviceData);
      } catch {
        // Тихий fallback на mock, если бэкенд недоступен
        const mock = mockServices.find(s => s.id === serviceIdNum);
        setCurrentService(mock || null);
      }
    };
    fetchService();
  }, [serviceIdNum]);

  // 🔹 Вычисление похожих товаров
  useEffect(() => {
    if (!currentService) return;

    const findSimilar = async () => {
      setLoadingSimilar(true);
      let allServices: Service[] = [];

      try {
        const res = await fetch('/api/services/');
        if (!res.ok) throw new Error('Network error');
        const json = await res.json();
        allServices = json.data || [];
      } catch {
        // Тихий fallback на mock, если бэкенд недоступен
        allServices = mockServices;
      }

      try {
        // 🔹 Transformer.js: вычисление эмбеддингов (может упасть, если CDN заблокирован)
        const currentEmbedding = await getEmbedding(currentService.description);
        const others = allServices.filter(s => s.id !== serviceIdNum && s.description?.trim());
        
        const scored = await Promise.all(
          others.map(async (s) => {
            const emb = await getEmbedding(s.description);
            return { ...s, score: cosineSimilarity(currentEmbedding, emb) };
          })
        );

        const top3 = scored.sort((a, b) => b.score - a.score).slice(0, 3);
        setSimilarServices(top3);
        setUseFallback(false);
        
      } catch {
        // 🔹 Тихий fallback: по категории → любые 3 товара (без логов в консоль)
        const currentCat = (currentService.category || '').trim().toLowerCase();
        
        const byCategory = allServices.filter(s => {
          const sCat = (s.category || '').trim().toLowerCase();
          return s.id !== serviceIdNum && sCat && sCat === currentCat;
        }).slice(0, 3);
        
        if (byCategory.length > 0) {
          setSimilarServices(byCategory);
          setUseFallback(true);
        } else {
          // Если категория пуста — покажем любые 3 других товара
          const anyOthers = allServices.filter(s => s.id !== serviceIdNum).slice(0, 3);
          setSimilarServices(anyOthers);
          setUseFallback(true);
        }
      } finally {
        setLoadingSimilar(false);
      }
    };

    findSimilar();
  }, [currentService, serviceIdNum]);

  if (!currentService) {
    return (
      <div style={{ padding: 50, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p>⏳ Загрузка информации о товаре...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      maxWidth: 1200, 
      margin: '0 auto', 
      padding: 20 
    }}>
      {/* 🔹 Хедер с кнопкой "Назад" */}
      <div style={{ marginBottom: 20 }}>
        <a href="/pages/catalog/" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 8, 
          color: '#2563eb', 
          textDecoration: 'none',
          fontWeight: 500
        }}>
          ← Назад к каталогу
        </a>
      </div>

      {/* 🔹 Основной контент: картинка + инфо */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 40, 
        alignItems: 'start' 
      }}>
        {/* 🔹 Медиа (картинка/видео) — с ограничением размера! */}
        <div style={{ 
          background: '#f8fafc', 
          borderRadius: 12, 
          padding: 20, 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {currentService.video_url ? (
            <video 
              controls 
              autoPlay 
              muted 
              loop 
              style={{ 
                maxWidth: '100%', 
                height: 'auto', 
                maxHeight: 500, 
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <source src={currentService.video_url} type="video/mp4" />
              Ваш браузер не поддерживает видео.
            </video>
          ) : (
            <img 
              src={currentService.image_url || 'https://via.placeholder.com/400x300?text=No+Image'} 
              alt={currentService.name} 
              style={{ 
                maxWidth: '100%', 
                height: 'auto', 
                maxHeight: 500,
                borderRadius: 8,
                objectFit: 'contain',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onError={(e) => { 
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image'; 
              }}
            />
          )}
        </div>

        {/* 🔹 Информация о товаре */}
        <div>
          <h1 style={{ margin: '0 0 12px', fontSize: '2rem', fontWeight: 700 }}>
            {currentService.name}
          </h1>
          
          <p style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            color: '#2563eb', 
            margin: '0 0 16px' 
          }}>
            {currentService.price.toLocaleString('ru-RU')} ₽
          </p>
          
          <p style={{ margin: '0 0 8px', color: '#64748b' }}>
            <strong>Категория:</strong> {currentService.category}
          </p>
          
          {currentService.brand && (
            <p style={{ margin: '0 0 8px', color: '#64748b' }}>
              <strong>Бренд:</strong> {currentService.brand}
            </p>
          )}
          
          {currentService.rating && (
            <p style={{ margin: '0 0 16px', color: '#64748b' }}>
              <strong>Рейтинг:</strong> ★ {currentService.rating}
            </p>
          )}
          
          <div style={{ margin: '24px 0' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.25rem' }}>Описание</h3>
            <p style={{ margin: 0, lineHeight: 1.6, color: '#334155' }}>
              {currentService.description}
            </p>
          </div>
          
          {/* 🔹 Кнопка "Добавить в заявку" */}
          <form method="POST" action={`/pages/order/add/${currentService.id}/`}>
            <button 
              type="submit" 
              style={{
                background: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '14px 32px',
                borderRadius: 8,
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#2563eb')}
            >
              Добавить в заявку
            </button>
          </form>
        </div>
      </div>

      {/* 🔹 Блок "Похожие товары" */}
      <section style={{ 
        marginTop: 60, 
        paddingTop: 30, 
        borderTop: '1px solid #e2e8f0' 
      }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '1.5rem' }}>
          Похожие товары 
          {useFallback && (
            <span style={{ 
              fontSize: '0.9rem', 
              color: '#64748b', 
              fontStyle: 'italic',
              fontWeight: 400
            }}>
              (по категориям)
            </span>
          )}
        </h3>
        
        {loadingSimilar ? (
          <p style={{ color: '#64748b' }}>Загрузка рекомендаций...</p>
        ) : similarServices.length === 0 ? (
          <p style={{ color: '#64748b', fontStyle: 'italic' }}>
            Похожие товары не найдены. Попробуйте выбрать другой товар.
          </p>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: 24 
          }}>
            {similarServices.map(s => (
              <a 
                key={s.id} 
                href={`/pages/service/${s.id}/`} 
                style={{ 
                  display: 'block', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: 12, 
                  padding: 16, 
                  textDecoration: 'none', 
                  color: 'inherit',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  background: 'white'
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                }}
              >
                <img 
                  src={s.image_url || 'https://via.placeholder.com/200x150?text=No+Image'} 
                  alt={s.name}
                  style={{ 
                    width: '100%', 
                    height: 160, 
                    objectFit: 'cover', 
                    borderRadius: 8,
                    background: '#f8fafc'
                  }}
                  onError={(e) => { 
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x150?text=No+Image'; 
                  }}
                />
                <h4 style={{ 
                  margin: '14px 0 6px', 
                  fontSize: '1.1rem', 
                  fontWeight: 600,
                  lineHeight: 1.3
                }}>
                  {s.name}
                </h4>
                <p style={{ 
                  fontWeight: 700, 
                  color: '#2563eb', 
                  margin: '0 0 4px',
                  fontSize: '1.1rem'
                }}>
                  {s.price.toLocaleString('ru-RU')} ₽
                </p>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: '#64748b', 
                  margin: 0 
                }}>
                  {s.category}
                </p>
                
                {/* 🔹 Показываем схожесть только если считали через transformer */}
                {!useFallback && 'score' in s && typeof s.score === 'number' && (
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: '#059669', 
                    marginTop: 8,
                    fontWeight: 500
                  }}>
                    Схожесть: {(s.score * 100).toFixed(1)}%
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ServiceDetail;
