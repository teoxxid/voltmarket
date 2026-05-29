import React from 'react';
import { Link } from 'react-router-dom';

interface ServiceCardProps {
  service: {
    id: number;
    name: string;
    price: number;
    image_url?: string;
    category?: string;
  };
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  return (
    <div className="service-card">
      <Link to={`/pages/service/${service.id}/`}>
        <div className="service-image-wrapper">
          <img 
            src={service.image_url || '/placeholder.svg'}
            alt={service.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
      </Link>
      <div className="service-info">
        <h3>{service.name}</h3>
        <p className="price">{service.price.toLocaleString('ru-RU')} ₽</p>
        {service.category && <p className="category">{service.category}</p>}
      </div>
    </div>
  );
};

export default ServiceCard;
