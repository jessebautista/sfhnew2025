import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ShoppingCart, Plus, Minus, X, Eye, Filter, Grid, List, Search, Star, Heart } from 'lucide-react';
import { formatPrice as utilFormatPrice } from '../lib/utils';
import { CartProvider, useCart } from './CartContext';
import Cart from './Cart';
import FloatingCartButton from './FloatingCartButton';

// Enhanced mock product data
const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Sing for Hope Classic T-Shirt',
    price: 2500,
    originalPrice: 3000,
    description: 'Comfortable cotton t-shirt featuring our signature logo',
    image: '/src/images/singforhope.jpg',
    category: 'apparel',
    rating: 4.8,
    reviewCount: 127,
    variants: [
      { id: 'tshirt-s', size: 'S' },
      { id: 'tshirt-m', size: 'M' },
      { id: 'tshirt-l', size: 'L' },
      { id: 'tshirt-xl', size: 'XL' },
    ],
    tags: ['cotton', 'comfort', 'logo'],
    featured: true
  },
  {
    id: 2,
    name: 'Piano Design Tote Bag',
    price: 1800,
    description: 'Canvas tote bag featuring beautiful piano artwork',
    image: '/src/images/pianos-stock-1.png',
    category: 'accessories',
    rating: 4.6,
    reviewCount: 89,
    variants: [
      { id: 'tote-standard', size: 'One Size' }
    ],
    tags: ['canvas', 'piano', 'art'],
    featured: true
  },
  {
    id: 3,
    name: 'Music Note Pin Set',
    price: 1200,
    description: 'Set of enamel pins featuring musical notes and SFH logo',
    image: '/pianos-icon.png',
    category: 'accessories',
    rating: 4.9,
    reviewCount: 156,
    variants: [
      { id: 'pins-set', size: 'Set of 3' }
    ],
    tags: ['enamel', 'pins', 'music'],
    featured: false
  },
  {
    id: 4,
    name: 'Harmony Coffee Mug',
    price: 1500,
    description: 'Ceramic mug with inspiring arts quotes',
    image: '/logo.svg',
    category: 'home',
    rating: 4.7,
    reviewCount: 203,
    variants: [
      { id: 'mug-11oz', size: '11oz' }
    ],
    tags: ['ceramic', 'quotes', 'coffee'],
    featured: true
  },
  {
    id: 5,
    name: 'Artist Series Hoodie',
    price: 4500,
    originalPrice: 5500,
    description: 'Limited edition hoodie with artist collaboration design',
    image: '/src/images/singforhope.jpg',
    category: 'apparel',
    rating: 4.9,
    reviewCount: 78,
    variants: [
      { id: 'hoodie-s', size: 'S' },
      { id: 'hoodie-m', size: 'M' },
      { id: 'hoodie-l', size: 'L' },
      { id: 'hoodie-xl', size: 'XL' },
    ],
    tags: ['artist', 'limited', 'hoodie'],
    featured: true
  },
  {
    id: 6,
    name: 'Piano Keys Bookmark Set',
    price: 800,
    description: 'Metal bookmarks inspired by piano keys',
    image: '/pianos-icon.png',
    category: 'accessories',
    rating: 4.4,
    reviewCount: 67,
    variants: [
      { id: 'bookmarks-set', size: 'Set of 2' }
    ],
    tags: ['metal', 'piano', 'books'],
    featured: false
  }
];

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  variants: { id: string; size: string }[];
  tags: string[];
  featured: boolean;
}

const ShopComponentContent: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [filterBy, setFilterBy] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  
  const { addItem, state } = useCart();

  useEffect(() => {
    // Load products from API (Printful or mock data)
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        console.log('ShopComponent: Starting to fetch products...');
        const response = await fetch('/api/products');
        console.log('ShopComponent: Fetch response:', response.status);
        const result = await response.json();
        console.log('ShopComponent: API result:', result);
        
        if (result.success && result.data) {
          // Transform Printful data to match our product interface
          const transformedProducts = result.data.map((product: any) => ({
            ...product,
            originalPrice: product.price > 2500 ? product.price + 500 : undefined,
            category: inferCategory(product.name),
            rating: Math.random() * (5 - 4) + 4, // Random rating between 4-5
            reviewCount: Math.floor(Math.random() * (200 - 10) + 10), // Random reviews 10-200
            tags: generateTags(product.name),
            featured: Math.random() > 0.6, // 40% chance of being featured
          }));
          
          setProducts(transformedProducts);
          console.log(`Products loaded from: ${result.source} (${transformedProducts.length} products)`);
        } else {
          throw new Error('Failed to load products from API');
        }
      } catch (err) {
        console.error('Error loading products:', err);
        // Fallback to mock products if API fails
        const productsWithCategories = MOCK_PRODUCTS.map(product => ({
          ...product,
          category: product.category || 'other'
        }));
        setProducts(productsWithCategories);
        setError('Using offline product catalog.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Helper function to infer category from product name
  const inferCategory = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('shirt') || lowerName.includes('hoodie') || lowerName.includes('tee') || lowerName.includes('apron') || lowerName.includes('hat') || lowerName.includes('beanie')) {
      return 'apparel';
    } else if (lowerName.includes('mug') || lowerName.includes('tumbler') || lowerName.includes('bottle') || lowerName.includes('mouse pad') || lowerName.includes('laptop')) {
      return 'home';
    } else if (lowerName.includes('pin') || lowerName.includes('button') || lowerName.includes('bag') || lowerName.includes('tote')) {
      return 'accessories';
    }
    return 'other';
  };

  // Helper function to generate tags from product name
  const generateTags = (name: string) => {
    const tags = [];
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('eco')) tags.push('eco-friendly');
    if (lowerName.includes('youth') || lowerName.includes('baby')) tags.push('kids');
    if (lowerName.includes('unisex')) tags.push('unisex');
    if (lowerName.includes('classic')) tags.push('classic');
    if (lowerName.includes('premium') || lowerName.includes('quality')) tags.push('premium');
    
    // Add material/type tags
    if (lowerName.includes('cotton')) tags.push('cotton');
    if (lowerName.includes('stainless')) tags.push('stainless-steel');
    if (lowerName.includes('fleece')) tags.push('fleece');
    
    return tags.slice(0, 3); // Limit to 3 tags
  };

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(product => product.category === filterBy);
    }

    // Apply price range filter
    filtered = filtered.filter(product =>
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => b.id - a.id);
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, sortBy, filterBy, priceRange]);

  const handleAddToCart = (productId: number, variantId: string, size: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = {
      id: productId,
      variantId,
      quantity: 1,
      size,
      price: product.price,
      name: product.name,
      image: product.image
    };

    addItem(cartItem);
  };

  const handleCheckout = async () => {
    if (state.items.length === 0) return;

    setIsCheckingOut(true);
    
    try {
      toast.loading('Redirecting to checkout...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.dismiss();
      window.location.href = '/shop/checkout';
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const formatPrice = (cents: number) => {
    return utilFormatPrice(cents, 'en');
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

  const categories = Array.from(new Set(products.map(p => p.category))).map(cat => ({
    id: cat,
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    count: products.filter(p => p.category === cat).length
  }));

  return (
    <>
      <Toaster position="top-right" />
      
      {/* Floating Cart Button */}
      <FloatingCartButton />

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={() => setQuickViewProduct(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <button 
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-50"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="grid md:grid-cols-2 gap-8 p-8">
                <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={quickViewProduct.image}
                    alt={quickViewProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{quickViewProduct.name}</h2>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(quickViewProduct.rating) ? 'fill-current' : 'fill-none stroke-current'}`} />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {quickViewProduct.rating} ({quickViewProduct.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="text-2xl font-bold text-harmony">
                        {formatPrice(quickViewProduct.price)}
                      </span>
                      {quickViewProduct.originalPrice && quickViewProduct.originalPrice > quickViewProduct.price && (
                        <span className="text-lg text-gray-500 line-through">
                          {formatPrice(quickViewProduct.originalPrice)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">{quickViewProduct.description}</p>
                  </div>
                  
                  <ProductOptions
                    product={quickViewProduct}
                    onAddToCart={handleAddToCart}
                    onClose={() => setQuickViewProduct(null)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filters Header */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-harmony focus:border-harmony"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>

              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-harmony focus:border-harmony"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-harmony focus:border-harmony"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-harmony text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-harmony text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Products Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border p-6 animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-xl mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onQuickView={setQuickViewProduct}
                    formatPrice={formatPrice}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}

            {!isLoading && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBy('all');
                    setPriceRange([0, 10000]);
                  }}
                  className="btn-harmony"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Desktop Shopping Cart */}
          <div className="lg:col-span-1 hidden lg:block">
            <Cart
              isCheckingOut={isCheckingOut}
              onCheckout={handleCheckout}
            />
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
  viewMode: 'grid' | 'list';
}> = ({ product, onAddToCart, onQuickView, formatPrice, viewMode }) => {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [isLiked, setIsLiked] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(product.id, selectedVariant.id, selectedVariant.size);
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="flex">
          <div className="w-48 h-32 bg-gray-100 flex-shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-6 flex justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-current' : 'fill-none stroke-current'}`} />
                    ))}
                  </div>
                  <span className="ml-1 text-xs text-gray-600">({product.reviewCount})</span>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {product.category}
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-between items-end">
              <div className="text-right mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-harmony">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                </button>
                <button
                  onClick={() => onQuickView(product)}
                  className="btn-outline-harmony px-3 py-2 text-sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </button>
                <button
                  onClick={handleAddToCart}
                  className="btn-harmony px-4 py-2 text-sm"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-x-2">
            <button
              onClick={() => onQuickView(product)}
              className="bg-white text-gray-900 p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors"
              title="Quick View"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="bg-white text-gray-900 p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors"
              title="Add to Wishlist"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 space-y-1">
          {product.featured && (
            <span className="bg-melody text-white text-xs px-2 py-1 rounded-full font-medium">
              Featured
            </span>
          )}
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Sale
            </span>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{product.description}</p>
          
          {/* Rating */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex text-yellow-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-current' : 'fill-none stroke-current'}`} />
              ))}
            </div>
            <span className="text-xs text-gray-600">
              {product.rating} ({product.reviewCount})
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xl font-bold text-harmony">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through ml-2">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {product.category}
          </span>
        </div>

        {/* Size Selection */}
        {product.variants.length > 1 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Size:
            </label>
            <select
              value={selectedVariant.id}
              onChange={(e) => {
                const variant = product.variants.find(v => v.id === e.target.value);
                if (variant) setSelectedVariant(variant);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-harmony focus:border-harmony"
            >
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="w-full btn-harmony py-3 font-medium"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
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
    <div className="space-y-6">
      {product.variants.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Size:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={`py-2 px-3 text-sm border rounded-lg transition-colors ${
                  selectedVariant.id === variant.id
                    ? 'border-harmony bg-harmony text-white'
                    : 'border-gray-300 hover:border-harmony hover:text-harmony'
                }`}
              >
                {variant.size}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        className="w-full btn-harmony py-4 text-lg font-semibold"
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        Add to Cart
      </button>
    </div>
  );
};

// Main wrapper component with CartProvider
const ShopComponent: React.FC = () => {
  return (
    <CartProvider>
      <ShopComponentContent />
    </CartProvider>
  );
};

export default ShopComponent;