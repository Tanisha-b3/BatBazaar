import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import axios from 'axios';

interface CartItem {
  id: number;
  name: string;
  price: number;
  old_price: number;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  totalPrice: number;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

import { API_URL } from '../config';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const fetchCart = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setCartItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      setCartItems(response.data.cart);
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCartItems([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      fetchCart();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', fetchCart);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleStorageChange);
    };
  }, []);

const addToCart = async (productId: number, quantity: number = 1) => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      throw new Error('Please login to add items to cart');
    }
    
    try {
      await axios.post(`${API_URL}/cart`, 
        { productId, quantity },
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );
      await fetchCart();
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw error;
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;
    
    try {
      await axios.put(`${API_URL}/cart`,
        { productId, quantity },
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );
      await fetchCart();
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error: any) {
      console.error('Error updating cart:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  };

  const removeFromCart = async (productId: number) => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;
    
    try {
      await axios.delete(`${API_URL}/cart/${productId}`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      await fetchCart();
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  };

  const clearCart = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;
    
    try {
      await axios.delete(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      await fetchCart();
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  };

  // const updateQuantity = async (productId: number, quantity: number) => {
  //   if (!token) return;
    
  //   try {
  //     await axios.put(`${API_URL}/cart`,
  //       { productId, quantity },
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );
  //     await fetchCart();
  //     window.dispatchEvent(new CustomEvent('cartUpdated'));
  //   } catch (error) {
  //     console.error('Error updating cart:', error);
  //     throw error;
  //   }
  // };

  // const removeFromCart = async (productId: number) => {
  //   if (!token) return;
    
  //   try {
  //     await axios.delete(`${API_URL}/cart/${productId}`, {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
  //     await fetchCart();
  //     window.dispatchEvent(new CustomEvent('cartUpdated'));
  //   } catch (error) {
  //     console.error('Error removing from cart:', error);
  //     throw error;
  //   }
  // };

  // const clearCart = async () => {
  //   if (!token) return;
    
  //   try {
  //     await axios.delete(`${API_URL}/cart`, {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
  //     await fetchCart();
  //     window.dispatchEvent(new CustomEvent('cartUpdated'));
  //   } catch (error) {
  //     console.error('Error clearing cart:', error);
  //     throw error;
  //   }
  // };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      totalPrice,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
};