import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Service {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
}

interface HomePageProps {
  user: { username: string; role: 'USER' | 'ADMIN' } | null;
  services?: Service[];
  background_video_url?: string;
}

const HomePage: React.FC<HomePageProps> = ({ 
  user, 
  services: propServices, 
  background_video_url = 'http://localhost:9000/services/background.mp4'
}) => {
  const [popularServices, setPopularServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    if (propServices && propServices.length > 0) {
      setPopularServices(propServices);
      setLoadingServices(false);
      return;
    }

    const fetchPopular = async () => {
      try {
        const res = await fetch('/api/services/?limit=4');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        
        const data = json.results || json.data || json;
        const servicesList = Array.isArray(data) ? data : [];
        
        setPopularServices(servicesList.slice(0, 4));
      } catch (err) {
        console.error('Failed to fetch popular services:', err);
        setPopularServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchPopular();
  }, [propServices]);

  const services = propServices && propServices.length > 0 ? propServices : popularServices;

  return (
    <>
      {/* 🔹 Геро-секция с видео */}
      <section className="hero-section">
        <video
          key={background_video_url}
          autoPlay
          muted
          loop
          playsInline
          className="hero-background-video"
          onLoadedData={() => console.log('✅ Video loaded:', background_video_url)}
          onError={(e) => console.error('❌ Video error:', e)}
        >
          <source src={background_video_url} type="video/mp4" />
          Ваш браузер не поддерживает видео.
        </video>
        
        <div className="hero-overlay">
          <h1>Маркетплейс электронной техники</h1>
          <p>Лучшие товары от лучших производителей</p>
          <Link to="/catalog/" className="hero-btn">Перейти в каталог</Link>
        </div>
      </section>

      {/* 🔹 Популярные товары (первые 4) */}
      <section className="video-catalog">
        <h2>Популярные товары</h2>
        
        {loadingServices ? (
          <p style={{textAlign:'center',color:'#666',padding:'40px'}}>Загрузка товаров...</p>
        ) : services.length > 0 ? (
          <div className="video-grid">
            {services.slice(0, 4).map((service) => (
              <div key={service.id} className="video-card">
                <Link to={`/service/${service.id}/`} className="video-thumbnail-link">
                  <div className="video-thumbnail">
                    <img 
                      src={service.image_url || '/placeholder.svg'} 
                      alt={service.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                      loading="lazy"
                    />
                  </div>
                </Link>
                <div className="video-info">
                  <h3>{service.name}</h3>
                  <p className="price">{service.price.toLocaleString('ru-RU')} ₽</p>
                  {service.category && <p className="category">{service.category}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{textAlign:'center',color:'#666',padding:'40px'}}>Товары временно недоступны</p>
        )}
      </section>

      {/* 🔹 CTA блок */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Готовы сделать заказ?</h2>
          <p>Перейдите в каталог и выберите нужные товары</p>
          <Link to="/catalog/" className="cta-btn">Перейти в каталог</Link>
        </div>
      </section>

      {/* 🔹 Подсказка для гостей */}
      {!user && (
        <div className="guest-hint">
          <p>
            <Link to="/login/">Войдите</Link> или <Link to="/register/">зарегистрируйтесь</Link>, 
            чтобы оформлять заявки и отслеживать их статус
          </p>
        </div>
      )}
    </>
  );
};

export default HomePage;
