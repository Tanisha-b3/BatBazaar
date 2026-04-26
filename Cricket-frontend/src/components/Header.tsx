import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, ShoppingCart, User, Settings, LogOut, ChevronDown, X, Home, Tag, Package, Phone, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface NavbarProps {
  user?: User | null;
  onLogout?: () => void;
  cartCount?: number;
}

const Navbar: React.FC<NavbarProps> = ({ user: propUser, onLogout, cartCount: propCartCount }) => {
  const { user: contextUser, logout: contextLogout } = useAuth();
  const user = propUser || contextUser;
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCount, _setNotificationCount] = useState(0);
  const [cartCount, setCartCount] = useState(propCartCount || 0);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: 'Home', href: '/#home', icon: Home },
    { name: 'Sale', href: '/#topseller', icon: Tag },
    { name: 'Accessories', href: '/#featured', icon: Package },
    { name: 'All Products', href: '/products', icon: Package },
    { name: 'Contact Us', href: '/contact', icon: Phone },
    { name: "FAQ's", href: '/#footer', icon: HelpCircle },
  ];

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

// Load cart count from localStorage and backend
  useEffect(() => {
    let isMounted = true;
    
    const loadCartCount = async () => {
      if (!isMounted) return;
      
      const token = localStorage.getItem('token');
      
      // If logged in, fetch from backend only
      if (token && isMounted) {
        try {
          const response = await axios.get(`${API_URL}/cart`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 3000
          });
          const backendCart = response.data.cart;
          if (backendCart && Array.isArray(backendCart)) {
            const backendCount = backendCart.reduce((sum: number, item: any) => sum + (item?.quantity || 1), 0);
            if (isMounted) setCartCount(backendCount);
          }
        } catch (error) {
          // Silent fail for backend
          if (isMounted) setCartCount(0);
        }
      } else {
        // Not logged in, use localStorage cart
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          try {
            const cart = JSON.parse(savedCart);
            if (cart && Array.isArray(cart) && cart.length > 0) {
              const count = cart.reduce((sum: number, item: any) => sum + (item?.quantity || 1), 0);
              if (isMounted) setCartCount(count);
            } else {
              if (isMounted) setCartCount(0);
            }
          } catch (error) {
            localStorage.removeItem('cart');
            if (isMounted) setCartCount(0);
          }
        } else {
          if (isMounted) setCartCount(0);
        }
      }
    };

    // Initial load
    loadCartCount();
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCartCount();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      isMounted = false;
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    if (contextLogout) contextLogout();
    if (onLogout) onLogout();
    setShowDropdown(false);
    setMobileMenuOpen(false);
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    navigate('/login');
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.includes('#')) {
      e.preventDefault();
      const [path, hash] = href.split('#');
      
      if (path === '/' || path === '') {
        if (location.pathname === '/') {
          const element = document.getElementById(hash);
          if (element) {
            const navbarHeight = 75;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }
        } else {
          navigate(href);
        }
      } else {
        navigate(href);
      }
    }
  };

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    if (href.includes('#')) {
      const [path, hash] = href.split('#');
      if (path === '/' || path === '') {
        return location.pathname === '/' && location.hash === `#${hash}`;
      }
      return location.pathname === path && location.hash === `#${hash}`;
    }
    if (href.includes('?')) {
      const basePath = href.split('?')[0];
      return location.pathname === basePath;
    }
    return location.pathname === href;
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full h-[75px] transition-all duration-300 z-50 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-md'
      }`}>
        <div className="max-w-[1440px] mx-auto h-full px-4 md:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="w-[90px] h-16 flex items-center shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 ml-8 xl:ml-32">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`group flex items-center gap-1 text-base font-medium pb-1 transition-all duration-300 ${
                    isActiveLink(link.href)
                      ? 'text-gray-900 border-b-2 border-[#3F51B5]'
                      : 'text-[#464646] hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} className="transition-transform group-hover:scale-110" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-[#464646]" />
            ) : (
              <svg className="w-6 h-6 text-[#464646]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

{/* Right Section - Desktop */}
          <div className="hidden md:flex items-center gap-2 md:gap-4">
            {/* Notification Bell - only when logged in */}
            {user && (
              <Link to="/notifications" className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors group">
                <Bell className="w-5 h-5 md:w-6 md:h-6 text-[#373737] group-hover:text-gray-900 transition-colors" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-semibold px-1">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart - always show */}
            <Link to="/cart" className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors group">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-[#373737] group-hover:text-gray-900 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#3F51B5] rounded-full text-[10px] text-white flex items-center justify-center font-semibold px-1">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

{user ? (
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors group"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-r from-[#3F51B5] to-[#667eea] flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-[#222222] group-hover:text-gray-900 transition-colors">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`text-[#373737] transition-all duration-200 ${
                      showDropdown ? 'rotate-180 text-gray-900' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-[260px] bg-white shadow-xl rounded-lg py-2 z-50 border border-gray-100 animate-fadeIn">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors hover:text-gray-900"
                        onClick={() => setShowDropdown(false)}
                      >
                        <User size={16} className="text-gray-400" /> 
                        My Profile
                      </Link>
                      
                      <Link
                        to="/orders"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <ShoppingCart size={16} className="text-gray-400" /> 
                        My Orders
                      </Link>
                      
                      <Link
                        to="/notifications"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Bell size={16} className="text-gray-400" /> 
                        Notifications
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors hover:text-gray-900"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Settings size={16} className="text-gray-400" /> 
                        Settings
                      </Link>
                      
                      <hr className="my-1 border-gray-100" />
                      
                      <button 
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors" 
                        onClick={handleLogout}
                      >
                        <LogOut size={16} /> 
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Link 
                  to="/login" 
                  className="px-5 md:px-6 h-[35px] bg-gradient-to-r from-[#3F51B5] to-[#667eea] text-white rounded-full text-sm md:text-base font-medium hover:shadow-lg transition-all hover:scale-105 flex items-center"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="px-5 md:px-6 h-[35px] bg-white border-2 border-[#3F51B5] text-gray-900 rounded-full text-sm md:text-base font-medium hover:bg-[#3F51B5] hover:text-white transition-all hover:scale-105 flex items-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className="fixed top-[75px] left-0 w-full bg-white shadow-xl z-40 lg:hidden animate-slideDown max-h-[calc(100vh-75px)] overflow-y-auto">
            <div className="py-4 px-4">
              {user && (
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#3F51B5] to-[#667eea] flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={(e) => {
                        handleNavClick(e, link.href);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 py-3 px-3 rounded-lg text-base font-medium transition-colors ${
                        isActiveLink(link.href)
                          ? 'text-gray-900 bg-blue-50'
                          : 'text-[#464646] hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={18} />
                      {link.name}
                    </Link>
                  );
                })}
                
                {user && (
                  <div className="border-t border-gray-100 mt-4 pt-4">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 py-3 px-3 rounded-lg text-base text-[#464646] hover:bg-gray-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User size={18} /> My Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center gap-3 py-3 px-3 rounded-lg text-base text-[#464646] hover:bg-gray-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ShoppingCart size={18} /> My Orders
                    </Link>
                    <Link
                      to="/notifications"
                      className="flex items-center gap-3 py-3 px-3 rounded-lg text-base text-[#464646] hover:bg-gray-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Bell size={18} /> Notifications
                      {notificationCount > 0 && (
                        <span className="ml-auto min-w-[20px] h-[20px] bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-semibold">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/cart"
                      className="flex items-center gap-3 py-3 px-3 rounded-lg text-base text-[#464646] hover:bg-gray-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ShoppingCart size={18} /> Cart
                      {cartCount > 0 && (
                        <span className="ml-auto min-w-[20px] h-[20px] bg-[#3F51B5] rounded-full text-[10px] text-white flex items-center justify-center font-semibold">
                          {cartCount > 9 ? '9+' : cartCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 py-3 px-3 rounded-lg text-base text-[#464646] hover:bg-gray-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings size={18} /> Settings
                    </Link>
                    <button 
                      className="w-full flex items-center gap-3 py-3 px-3 rounded-lg text-base text-red-600 hover:bg-red-50 transition-colors mt-2"
                      onClick={handleLogout}
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </div>
                )}
                
                {!user && (
                  <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
                    <Link
                      to="/login"
                      className="block text-center py-3 px-3 rounded-lg bg-[#3F51B5] text-white font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="block text-center py-3 px-3 rounded-lg border-2 border-[#3F51B5] text-gray-900 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Navbar;