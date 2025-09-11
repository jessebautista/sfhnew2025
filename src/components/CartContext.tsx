import React, { createContext, useContext, useReducer, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface CartItem {
  id: number;
  variantId: string;
  quantity: number;
  size: string;
  color?: string;
  price: number;
  name: string;
  image: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalPrice: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { id: number; variantId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; variantId: string; quantity: number } }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(
        item => item.id === action.payload.id && item.variantId === action.payload.variantId
      );

      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id && item.variantId === action.payload.variantId
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
        
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((total, item) => total + item.quantity, 0),
          totalPrice: updatedItems.reduce((total, item) => total + (item.price * item.quantity), 0)
        };
      }

      const newItems = [...state.items, action.payload];
      return {
        ...state,
        items: newItems,
        totalItems: newItems.reduce((total, item) => total + item.quantity, 0),
        totalPrice: newItems.reduce((total, item) => total + (item.price * item.quantity), 0)
      };
    }

    case 'REMOVE_ITEM': {
      const filteredItems = state.items.filter(
        item => !(item.id === action.payload.id && item.variantId === action.payload.variantId)
      );
      
      return {
        ...state,
        items: filteredItems,
        totalItems: filteredItems.reduce((total, item) => total + item.quantity, 0),
        totalPrice: filteredItems.reduce((total, item) => total + (item.price * item.quantity), 0)
      };
    }

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity === 0) {
        return cartReducer(state, { 
          type: 'REMOVE_ITEM', 
          payload: { id: action.payload.id, variantId: action.payload.variantId } 
        });
      }

      const updatedItems = state.items.map(item =>
        item.id === action.payload.id && item.variantId === action.payload.variantId
          ? { ...item, quantity: action.payload.quantity }
          : item
      );

      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((total, item) => total + item.quantity, 0),
        totalPrice: updatedItems.reduce((total, item) => total + (item.price * item.quantity), 0)
      };
    }

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    case 'OPEN_CART':
      return { ...state, isOpen: true };

    case 'CLOSE_CART':
      return { ...state, isOpen: false };

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0
      };

    case 'LOAD_CART':
      const loadedItems = action.payload;
      return {
        ...state,
        items: loadedItems,
        totalItems: loadedItems.reduce((total, item) => total + item.quantity, 0),
        totalPrice: loadedItems.reduce((total, item) => total + (item.price * item.quantity), 0)
      };

    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (id: number, variantId: string) => void;
  updateQuantity: (id: number, variantId: string, quantity: number) => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const initialState: CartState = {
  items: [],
  isOpen: false,
  totalItems: 0,
  totalPrice: 0
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('sfh-cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          dispatch({ type: 'LOAD_CART', payload: parsedCart });
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }

      // Listen for toggle cart events from header
      const handleToggleCart = () => {
        console.log('Toggle cart event received - opening cart');
        dispatch({ type: 'TOGGLE_CART' });
      };

      window.addEventListener('toggleCart', handleToggleCart);

      return () => {
        window.removeEventListener('toggleCart', handleToggleCart);
      };
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sfh-cart', JSON.stringify(state.items));
        // Dispatch custom event for cart updates
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [state.items]);

  const addItem = (item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
    toast.success(`${item.name} added to cart!`);
  };

  const removeItem = (id: number, variantId: string) => {
    const item = state.items.find(item => item.id === id && item.variantId === variantId);
    dispatch({ type: 'REMOVE_ITEM', payload: { id, variantId } });
    if (item) {
      toast.success(`${item.name} removed from cart`);
    }
  };

  const updateQuantity = (id: number, variantId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, variantId, quantity } });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const openCart = () => {
    dispatch({ type: 'OPEN_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast.success('Cart cleared');
  };

  const value: CartContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    toggleCart,
    openCart,
    closeCart,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};