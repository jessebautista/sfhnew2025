import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from './CartContext';

const FloatingCartButton: React.FC = () => {
  const { state, toggleCart } = useCart();

  if (state.items.length === 0) {
    return null;
  }

  return (
    <button
      onClick={toggleCart}
      className="lg:hidden fixed bottom-6 right-6 z-40 bg-harmony text-white p-4 rounded-full shadow-lg hover:bg-harmonydark transition-all duration-200 transform hover:scale-110 active:scale-95"
      aria-label={`Shopping cart with ${state.totalItems} items`}
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        
        {/* Badge */}
        <div className="absolute -top-3 -right-3 bg-melody text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-md min-w-[24px]">
          {state.totalItems > 99 ? '99+' : state.totalItems}
        </div>
        
        {/* Pulse animation when items are added */}
        <div className="absolute inset-0 bg-harmony rounded-full animate-ping opacity-25"></div>
      </div>
    </button>
  );
};

export default FloatingCartButton;