'use client';

import React from 'react';
import { useCart } from '../../context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import './cart.css';

const CartClientSimple = () => {
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  const getImageUrl = (url: string) => {
    if (!url) return 'https://via.placeholder.com/120x120/f0f0f0/666666?text=🌸';
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    const baseUrl = 'http://localhost:8000';
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1 className="cart-title">🛒 Tu Carrito</h1>
        {!cart.is_empty && (
          <button
            onClick={clearCart}
            className="clear-cart-btn"
          >
            🗑️ Vaciar carrito
          </button>
        )}
      </div>

      {cart.is_empty ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2 className="empty-cart-title">Tu carrito está vacío</h2>
          <p className="empty-cart-text">¡Descubre nuestros hermosos arreglos florales!</p>
          <Link href="/productos" className="shop-now-btn">
            🌸 Ver productos
          </Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items-section">
            <div className="cart-items-header">
              <h2 className="items-title">
                🌺 Productos ({cart.total_items} {cart.total_items === 1 ? 'item' : 'items'})
              </h2>
            </div>
              
            <div className="cart-items-list">
              {cart.items.map((item) => (
                <div key={item.producto.id} className="cart-item">
                  <div className="item-content">
                    <div className="item-image">
                      <Image
                        src={getImageUrl(item.producto.imagen_principal)}
                        alt={item.producto.nombre}
                        width={120}
                        height={120}
                        className="product-img"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/120x120/f0f0f0/666666?text=🌸';
                        }}
                      />
                    </div>

                    <div className="item-info">
                      <h3 className="item-name">{item.producto.nombre}</h3>
                      <p className="item-description">{item.producto.descripcion}</p>
                      <div className="item-price">{formatPrice(item.price)} c/u</div>
                      <div className="item-stock">📦 Stock: {item.producto.stock}</div>
                    </div>

                    <div className="item-controls">
                      <div className="item-total">{formatPrice(item.total_price)}</div>
                      
                      <div className="quantity-controls">
                        <button
                          onClick={() => updateQuantity(item.producto.id, item.quantity - 1)}
                          disabled={loading}
                          className="qty-btn qty-minus"
                          title="Reducir cantidad"
                        >
                          −
                        </button>
                        
                        <span className="qty-display">{item.quantity}</span>
                        
                        <button
                          onClick={() => updateQuantity(item.producto.id, item.quantity + 1)}
                          disabled={loading || item.quantity >= item.producto.stock}
                          className="qty-btn qty-plus"
                          title="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.producto.id)}
                        disabled={loading}
                        className="remove-btn"
                        title="Eliminar producto"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h2 className="summary-title">💰 Resumen del pedido</h2>
              
              <div className="summary-details">
                <div className="summary-row">
                  <span>Subtotal ({cart.total_items} items)</span>
                  <span>{formatPrice(cart.total_price)}</span>
                </div>
                
                <div className="summary-row">
                  <span>🚚 Envío</span>
                  <span className="free-shipping">Gratis</span>
                </div>
                
                <div className="summary-total">
                  <span>Total</span>
                  <span>{formatPrice(cart.total_price)}</span>
                </div>
              </div>

              <div className="summary-actions">
                <Link href="/checkout" className="checkout-btn">
                  💳 Finalizar compra
                </Link>
                
                <Link href="/productos" className="continue-btn">
                  🌸 Continuar comprando
                </Link>
              </div>

              <div className="summary-benefits">
                <div className="benefit-item">
                  ✅ Envío gratuito en CABA
                </div>
                <div className="benefit-item">
                  ✅ Flores frescas garantizadas
                </div>
                <div className="benefit-item">
                  ✅ Pago seguro con Mercado Pago
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartClientSimple;
