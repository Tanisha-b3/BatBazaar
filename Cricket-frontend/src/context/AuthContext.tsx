import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, phone?: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { API_URL } from '../config';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Set default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, phone?: string) => {
    try {
      const payload = phone ? { phone, password } : { email, password };
      const response = await axios.post(`${API_URL}/auth/login`, payload);
      
      console.log('Login response:', response.data);
      
      // Handle different response structures
      let authToken: string;
      let userData: User;
      
      if (response.data.accessToken) {
        // Backend returns accessToken and refreshToken
        authToken = response.data.accessToken;
        userData = response.data.user;
        
        // Store refresh token if needed
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
      } else if (response.data.token) {
        // Backend returns token directly
        authToken = response.data.token;
        userData = response.data.user;
      } else {
        throw new Error('Invalid response structure from server');
      }
      
      setToken(authToken);
      setUser(userData);
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, phone, password });
      
      console.log('Register response:', response.data);
      
      // Handle different response structures
      let authToken: string;
      let userData: User;
      
      if (response.data.accessToken) {
        authToken = response.data.accessToken;
        userData = response.data.user;
        
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
      } else if (response.data.token) {
        authToken = response.data.token;
        userData = response.data.user;
      } else {
        throw new Error('Invalid response structure from server');
      }
      
      setToken(authToken);
      setUser(userData);
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('cart');
    delete axios.defaults.headers.common['Authorization'];
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};