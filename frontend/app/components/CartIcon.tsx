'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';

interface CartIconProps {
  onClick: () => void;
  className?: string;
}

const CartIcon = ({ onClick }: CartIconProps) => {
  const { cart } = useCart();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('CartIcon clicked!', { cart, onClick }); // Debug log
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
      title="Abrir carrito"
      aria-label={`Carrito con ${cart.total_items} productos`}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z"
        />
      </svg>
      
      {cart.total_items > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {cart.total_items}
        </span>
      )}
    </button>
  );
};

export default CartIcon;
