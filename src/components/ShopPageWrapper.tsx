import React from 'react';
import { CartProvider } from './CartContext';

interface ShopPageWrapperProps {
  children: React.ReactNode;
}

const ShopPageWrapper: React.FC<ShopPageWrapperProps> = ({ children }) => {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
};

export default ShopPageWrapper;