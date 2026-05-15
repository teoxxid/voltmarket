import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface CartItem {
  id: number;
  service: {
    id: number;
    name: string;
    price: string;
    image_url: string;
  };
  quantity: number;
  price_at_time: string;
}

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    const loadCart = async () => {
      try {
        // 🔹 Сначала получаем ID черновика
        const cartIcon = await api.get('/orders/cart/');
        if (cartIcon.data.data?.order_id) {
          setOrderId(cartIcon.data.data.order_id);
          
          // 🔹 Затем загружаем детали заявки
          const order = await api.get(`/orders/${cartIcon.data.data.order_id}/`);
          if (order.data.data?.items) {
            setCartItems(order.data.data.items);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCart();
  }, []);

  if (loading) return <div>Загрузка...</div>;
  if (cartItems.length === 0) return <div>Корзина пуста</div>;

  return (
    <div>
      <h2>Заявка #{orderId}</h2>
      {cartItems.map(item => (
        <div key={item.id}>
          <img src={item.service.image_url} alt={item.service.name} />
          <h3>{item.service.name}</h3>
          <p>Цена: {item.price_at_time} ₽</p>
          <p>Количество: {item.quantity}</p>
        </div>
      ))}
    </div>
  );
};

export default Cart;
