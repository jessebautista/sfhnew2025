import React, { useState, useEffect } from 'react';
import { ShoppingCart } from '../lib/icons';

interface CartButtonProps {
  translations?: any;
}

const CartButton: React.FC<CartButtonProps> = ({ translations }) => {
  const [cartCount, setCartCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load cart count from localStorage
    try {
      const savedCart = localStorage.getItem('sfh-cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        const totalItems = cart.reduce((total: number, item: any) => total + item.quantity, 0);
        setCartCount(totalItems);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }

    // Listen for cart updates
    const handleStorageChange = () => {
      try {
        const savedCart = localStorage.getItem('sfh-cart');
        if (savedCart) {
          const cart = JSON.parse(savedCart);
          const totalItems = cart.reduce((total: number, item: any) => total + item.quantity, 0);
          setCartCount(totalItems);
        } else {
          setCartCount(0);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        setCartCount(0);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for cart updates within the same tab
    window.addEventListener('cartUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleStorageChange);
    };
  }, []);

  const handleCartClick = () => {
    
    // Check if we're on a page with cart functionality (ShopComponentNew)
    const isProductsPage = window.location.pathname.includes('/shop/products') || 
                          window.location.pathname.includes('/shop/category') ||
                          window.location.pathname.includes('/shop/product/');
    
    if (isProductsPage) {
      // Dispatch custom event to toggle cart
      window.dispatchEvent(new CustomEvent('toggleCart'));
    } else {
      // Redirect to products page where cart is functional
      window.location.href = '/shop/products';
    }
  };

  if (!isClient) {
    return (
      <button
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-harmony transition-all duration-200 relative"
        aria-label="Shopping cart"
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Cart
      </button>
    );
  }

  return (
    <button
      onClick={handleCartClick}
      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-harmony transition-all duration-200 relative"
      aria-label={`Shopping cart with ${cartCount} items`}
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      Cart
      
      {/* Badge */}
      {cartCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-harmony text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md min-w-[20px]">
          {cartCount > 99 ? '99+' : cartCount}
        </div>
      )}
    </button>
  );
};

export default CartButton;