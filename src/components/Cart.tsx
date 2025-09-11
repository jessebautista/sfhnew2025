import React from 'react';
import { X, Plus, Minus, ShoppingCart, Heart, Trash2 } from '../lib/icons';
import { useCart } from './CartContext';
import { formatPrice as utilFormatPrice } from '../lib/utils';

const formatPrice = (cents: number) => {
  return utilFormatPrice(cents, 'en');
};

interface CartProps {
  isCheckingOut?: boolean;
  onCheckout?: () => void;
}

const Cart: React.FC<CartProps> = ({ isCheckingOut = false, onCheckout }) => {
  const { state, removeItem, updateQuantity, closeCart } = useCart();

  const handleCheckout = () => {
    if (state.items.length === 0) return;
    
    if (onCheckout) {
      onCheckout();
    } else {
      // Default behavior - redirect to checkout page
      window.location.href = '/shop/checkout';
    }
  };

  return (
    <>
      {/* Desktop Cart Sidebar */}
      <div className="hidden lg:block sticky top-24">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
            <div className="flex items-center text-sm text-gray-500">
              <ShoppingCart className="w-4 h-4 mr-1" />
              {state.totalItems} {state.totalItems === 1 ? 'item' : 'items'}
            </div>
          </div>
          
          {state.items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <p className="text-sm text-gray-400">Add items to get started</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {state.items.map((item) => (
                  <CartItemCard
                    key={`${item.id}-${item.variantId}`}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
              
              <div className="border-t pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({state.totalItems} items)</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(state.totalPrice)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-medium">
                    {state.totalPrice >= 5000 ? 'Free' : '+$9.99'}
                  </span>
                </div>
                
                <div className="flex justify-between text-lg font-semibold pt-3 border-t">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    {formatPrice(state.totalPrice + (state.totalPrice >= 5000 ? 0 : 999))}
                  </span>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full btn-harmony py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingOut ? 'Processing...' : 'Secure Checkout'}
                </button>
                
                <p className="text-xs text-gray-500 text-center">
                  Secure payment powered by Stripe
                </p>
                
                {state.totalPrice < 5000 && (
                  <p className="text-xs text-center text-harmony">
                    Add {formatPrice(5000 - state.totalPrice)} more for free shipping!
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cart Modal Overlay (both mobile and desktop when opened from header) */}
      {state.isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={closeCart}>
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-white">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
                <p className="text-sm text-gray-500">
                  {state.totalItems} {state.totalItems === 1 ? 'item' : 'items'}
                </p>
              </div>
              <button 
                onClick={closeCart} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {state.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 mb-6">Discover our amazing products and add them to your cart</p>
                  <button
                    onClick={closeCart}
                    className="btn-harmony"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {state.items.map((item) => (
                    <CartItemCard
                      key={`${item.id}-${item.variantId}`}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                      formatPrice={formatPrice}
                      isMobile
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            {state.items.length > 0 && (
              <div className="border-t bg-white p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(state.totalPrice)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-green-600 font-medium">
                      {state.totalPrice >= 5000 ? 'Free' : '+$9.99'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">
                      {formatPrice(state.totalPrice + (state.totalPrice >= 5000 ? 0 : 999))}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full btn-harmony py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingOut ? 'Processing...' : 'Secure Checkout'}
                </button>
                
                {state.totalPrice < 5000 && (
                  <p className="text-xs text-center text-harmony">
                    Add {formatPrice(5000 - state.totalPrice)} more for free shipping!
                  </p>
                )}
                
                <p className="text-xs text-gray-500 text-center">
                  Secure payment powered by Stripe
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

interface CartItemCardProps {
  item: any;
  onUpdateQuantity: (id: number, variantId: string, quantity: number) => void;
  onRemove: (id: number, variantId: string) => void;
  formatPrice: (cents: number) => string;
  isMobile?: boolean;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ 
  item, 
  onUpdateQuantity, 
  onRemove, 
  formatPrice,
  isMobile = false 
}) => {
  return (
    <div className={`bg-gray-50 rounded-xl p-4 ${isMobile ? '' : 'border border-gray-100'}`}>
      <div className="flex items-start space-x-3">
        <div className="w-16 h-16 bg-white rounded-lg overflow-hidden shadow-sm">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">
            {item.name}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            {item.size && <span>Size: {item.size}</span>}
            {item.color && <span>• {item.color}</span>}
          </div>
          <div className="font-semibold text-harmony text-sm mb-3">
            {formatPrice(item.price)}
          </div>
          
          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onUpdateQuantity(item.id, item.variantId, item.quantity - 1)}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:border-harmony transition-colors"
                disabled={item.quantity <= 1}
              >
                <Minus className="w-3 h-3" />
              </button>
              
              <span className="text-sm font-medium w-8 text-center">
                {item.quantity}
              </span>
              
              <button
                onClick={() => onUpdateQuantity(item.id, item.variantId, item.quantity + 1)}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:border-harmony transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            
            <button
              onClick={() => onRemove(item.id, item.variantId)}
              className="text-red-500 hover:text-red-700 p-1 transition-colors"
              title="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;