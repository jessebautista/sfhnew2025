import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ShoppingCart, Plus, Minus, X, Eye, Filter, Grid, List, Search } from 'lucide-react';
import { formatPrice as utilFormatPrice } from '../lib/utils';
import { CartProvider, useCart } from './CartContext';
import Cart from './Cart';
import FloatingCartButton from './FloatingCartButton';

// Mock product data - in production, this would come from Printful API
const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Sing for Hope T-Shirt',
    price: 2500, // in cents
    description: 'Comfortable cotton t-shirt featuring our signature logo',
    image: '/singforhope.jpg',
    variants: [
      { id: 'tshirt-s', size: 'S' },
      { id: 'tshirt-m', size: 'M' },
      { id: 'tshirt-l', size: 'L' },
      { id: 'tshirt-xl', size: 'XL' },
    ]
  },
  {
    id: 2,
    name: 'Piano Design Tote Bag',
    price: 1800,
    description: 'Canvas tote bag featuring beautiful piano artwork',
    image: '/singforhope.jpg',
    variants: [
      { id: 'tote-standard', size: 'One Size' }
    ]
  },
  {
    id: 3,
    name: 'Music Note Pin Set',
    price: 1200,
    description: 'Set of enamel pins featuring musical notes and SFH logo',
    image: '/pianos-icon.png',
    variants: [
      { id: 'pins-set', size: 'Set of 3' }
    ]
  },
  {
    id: 4,
    name: 'Harmony Coffee Mug',
    price: 1500,
    description: 'Ceramic mug with inspiring arts quotes',
    image: '/logo.svg',
    variants: [
      { id: 'mug-11oz', size: '11oz' }
    ]
  }
];

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  variants: { id: string; size: string }[];
  category?: string;
}

const ShopComponentContent: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [filterBy, setFilterBy] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { addItem } = useCart();

  useEffect(() => {
    // Load products from API (Printful or mock data)
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/products');
        const result = await response.json();
        
        if (result.success) {
          setProducts(result.data);
          console.log(`Products loaded from: ${result.source}`);
        } else {
          throw new Error('Failed to load products');
        }
      } catch (err) {
        console.error('Error loading products:', err);
        // Fallback to mock products if API fails
        setProducts(MOCK_PRODUCTS);
        setError('Using offline product catalog.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  const addToCart = (productId: number, variantId: string, size: string) => {
    const product = products.find(p => p.id === productId);
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.id === productId && item.variantId === variantId
      );

      if (existingItem) {
        toast.success(`Added another ${product?.name || 'item'} to cart!`);
        return prevCart.map(item =>
          item.id === productId && item.variantId === variantId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        toast.success(`${product?.name || 'Item'} added to cart!`);
        return [...prevCart, { id: productId, variantId, quantity: 1, size }];
      }
    });
  };

  const removeFromCart = (productId: number, variantId: string) => {
    const product = products.find(p => p.id === productId);
    toast.success(`${product?.name || 'Item'} removed from cart`);
    
    setCart(prevCart => 
      prevCart.filter(item => 
        !(item.id === productId && item.variantId === variantId)
      )
    );
  };

  const updateQuantity = (productId: number, variantId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId, variantId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId && item.variantId === variantId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const product = products.find(p => p.id === item.id);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const formatPrice = (cents: number) => {
    // Use current language for locale-aware formatting
    const currentLang = 'en'; // TODO: Get from props/context
    return utilFormatPrice(cents, currentLang);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsCheckingOut(true);
    
    try {
      // In production, this would create a Stripe Checkout session
      // and integrate with Printful for order fulfillment
      
      toast.loading('Processing your order...');
      
      // Mock checkout process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.dismiss();
      toast.success('Thank you for your purchase! This is a demo - no payment was processed.');
      setCart([]);
      setShowCart(false);
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="shop-error">
            <h2 className="text-xl font-semibold mb-2">Shop Temporarily Unavailable</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 btn-harmony"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      
      {/* Mobile Cart Toggle Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowCart(true)}
          className="bg-harmony text-white p-4 rounded-full shadow-lg hover:bg-harmonydark transition-colors relative"
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-melody text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {cart.reduce((total, item) => total + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Cart Overlay */}
      {showCart && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setShowCart(false)}>
          <div className="fixed right-0 top-0 h-full w-80 max-w-[90vw] bg-white shadow-xl transform transition-transform" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Shopping Cart</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => {
                      const product = products.find(p => p.id === item.id);
                      if (!product) return null;

                      return (
                        <CartItem
                          key={`${item.id}-${item.variantId}`}
                          item={item}
                          product={product}
                          onUpdateQuantity={updateQuantity}
                          onRemove={removeFromCart}
                          formatPrice={formatPrice}
                        />
                      );
                    })}
                  </div>
                  
                  <div className="border-t pt-4 mt-auto">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-lg font-semibold">
                        {formatPrice(getCartTotal())}
                      </span>
                    </div>
                    
                    <button
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                      className="w-full btn-melody justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCheckingOut ? 'Processing...' : 'Checkout'}
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Secure checkout powered by Stripe
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={() => setQuickViewProduct(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <button 
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-50"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="grid md:grid-cols-2 gap-6 p-6">
                <div className="aspect-square overflow-hidden rounded-lg">
                  <img
                    src={quickViewProduct.image}
                    alt={quickViewProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{quickViewProduct.name}</h3>
                  <p className="text-xl font-semibold text-harmony mb-4">
                    {formatPrice(quickViewProduct.price)}
                  </p>
                  <p className="text-gray-600 mb-6">{quickViewProduct.description}</p>
                  
                  <ProductOptions
                    product={quickViewProduct}
                    onAddToCart={addToCart}
                    onClose={() => setQuickViewProduct(null)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Products Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="shop-loading bg-white rounded-lg shadow-sm p-4">
                  <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  onQuickView={setQuickViewProduct}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop Shopping Cart */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Shopping Cart</h2>
            
            {cart.length === 0 ? (
              <p className="text-gray-500">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cart.map((item) => {
                    const product = products.find(p => p.id === item.id);
                    if (!product) return null;

                    return (
                      <CartItem
                        key={`${item.id}-${item.variantId}`}
                        item={item}
                        product={product}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeFromCart}
                        formatPrice={formatPrice}
                      />
                    );
                  })}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-lg font-semibold">
                      {formatPrice(getCartTotal())}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full btn-melody justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCheckingOut ? 'Processing...' : 'Checkout'}
                  </button>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Secure checkout powered by Stripe
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

const ProductCard: React.FC<{
  product: Product;
  onAddToCart: (id: number, variantId: string, size: string) => void;
  onQuickView: (product: Product) => void;
  formatPrice: (cents: number) => string;
}> = ({ product, onAddToCart, onQuickView, formatPrice }) => {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-200">
      <div className="aspect-square overflow-hidden relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <button
          onClick={() => onQuickView(product)}
          className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{product.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-semibold text-gray-900">
            {formatPrice(product.price)}
          </span>
        </div>

        {product.variants.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size:
            </label>
            <select
              value={selectedVariant.id}
              onChange={(e) => {
                const variant = product.variants.find(v => v.id === e.target.value);
                if (variant) setSelectedVariant(variant);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-harmony focus:border-harmony"
            >
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.size}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onAddToCart(product.id, selectedVariant.id, selectedVariant.size)}
            className="flex-1 btn-harmony justify-center"
          >
            Add to Cart
          </button>
          <button
            onClick={() => onQuickView(product)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const CartItem: React.FC<{
  item: CartItem;
  product: Product;
  onUpdateQuantity: (id: number, variantId: string, quantity: number) => void;
  onRemove: (id: number, variantId: string) => void;
  formatPrice: (cents: number) => string;
}> = ({ item, product, onUpdateQuantity, onRemove, formatPrice }) => {
  return (
    <div className="flex items-center space-x-3">
      <img
        src={product.image}
        alt={product.name}
        className="w-12 h-12 object-cover rounded"
      />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {product.name}
        </p>
        <p className="text-xs text-gray-500">{item.size}</p>
        <p className="text-sm text-gray-900">
          {formatPrice(product.price)}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onUpdateQuantity(item.id, item.variantId, item.quantity - 1)}
          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <Minus className="w-3 h-3" />
        </button>
        
        <span className="text-sm font-medium w-8 text-center">
          {item.quantity}
        </span>
        
        <button
          onClick={() => onUpdateQuantity(item.id, item.variantId, item.quantity + 1)}
          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <Plus className="w-3 h-3" />
        </button>
        
        <button
          onClick={() => onRemove(item.id, item.variantId)}
          className="text-red-500 hover:text-red-700 ml-2 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ProductOptions component for quick view modal
const ProductOptions: React.FC<{
  product: Product;
  onAddToCart: (id: number, variantId: string, size: string) => void;
  onClose: () => void;
}> = ({ product, onAddToCart, onClose }) => {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);

  const handleAddToCart = () => {
    onAddToCart(product.id, selectedVariant.id, selectedVariant.size);
    onClose();
  };

  return (
    <div>
      {product.variants.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Size:
          </label>
          <select
            value={selectedVariant.id}
            onChange={(e) => {
              const variant = product.variants.find(v => v.id === e.target.value);
              if (variant) setSelectedVariant(variant);
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-harmony focus:border-harmony"
          >
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.size}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        className="w-full btn-harmony justify-center"
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ShopComponent;
