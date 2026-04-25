import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import axios from "axios";
import { Link } from "react-router-dom";
import { Trash2, ShoppingBag, ArrowLeft, CreditCard, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_URL } from "../config";

const productImages: Record<string, string> = {
  '/bat1.png': '/bat1.png',
  '/bat2.png': '/bat2.png',
  '/bat3.png': '/bat3.png',
  '/bag.png': '/bag.png',
  '/helmet.png': '/helmet.png',
  '/stumps.png': '/stumps.png',
  '/kit.png': '/kit.png',
  '/gloves.png': '/gloves.png',
};

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  old_price: number;
  image: string;
  quantity: number;
}

interface RecommendedProduct {
  id: number;
  name: string;
  price: number;
  old_price: number;
  image: string;
}

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems: backendCart, totalPrice, updateQuantity, removeFromCart, clearCart, isLoading } = useCart();
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [isLocalCart, setIsLocalCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recommended, setRecommended] = useState<RecommendedProduct[]>([]);
  const [recLoading, setRecLoading] = useState(true);

useEffect(() => {
    loadCart();
    fetchRecommended();
  }, []);

  useEffect(() => {
    const handleCartUpdate = () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        setIsLocalCart(false);
      } else {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          try {
            const parsed = JSON.parse(savedCart);
            if (parsed && Array.isArray(parsed)) {
              setLocalCart(parsed);
              setIsLocalCart(true);
            } else {
              setLocalCart([]);
              setIsLocalCart(false);
            }
          } catch (e) {
            setLocalCart([]);
            setIsLocalCart(false);
          }
        } else {
          setLocalCart([]);
          setIsLocalCart(false);
        }
      }
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const loadCart = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      setIsLocalCart(false);
      setLoading(false);
    } else {
      // If not logged in, use localStorage
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          if (parsed && Array.isArray(parsed)) {
            setLocalCart(parsed);
          } else {
            localStorage.removeItem('cart');
          }
        } catch (e) {
          console.error('Error parsing cart:', e);
          localStorage.removeItem('cart');
        }
      }
      setIsLocalCart(true);
      setLoading(false);
    }
  };

  const fetchRecommended = async () => {
    setRecLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products?category=kit`);
      setRecommended(response.data.products.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recommended:", error);
    } finally {
      setRecLoading(false);
    }
  };

  useEffect(() => {
    const handleCartUpdate = () => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          if (parsed && Array.isArray(parsed)) {
            setLocalCart(parsed);
          }
        } catch (e) {
          // Silent fail
        }
      }
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const localTotalPrice = Array.isArray(localCart) 
    ? localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0) 
    : 0;

  const handleLocalQuantity = async (productId: number, delta: number) => {
    const updated = localCart.map(item => 
      item.product_id === productId 
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    ).filter(item => item.quantity > 0);
    setLocalCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const handleLocalRemove = async (productId: number) => {
    const updated = localCart.filter(item => item.product_id !== productId);
    setLocalCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const handleLocalClear = async () => {
    setLocalCart([]);
    localStorage.removeItem('cart');
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const handleBackendQuantity = async (productId: number, delta: number, currentQty: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      await handleBackendRemove(productId);
    } else {
      await updateQuantity(productId, newQty);
    }
  };

  const handleBackendRemove = async (productId: number) => {
    await removeFromCart(productId);
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to proceed to checkout');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  // Use either backend cart or local cart
  const displayCart = isLocalCart ? localCart : backendCart;
  const displayTotal = isLocalCart ? localTotalPrice : totalPrice;

  if (loading || isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen py-6  flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen mt-20 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Your Cart</h1>
          <div className="w-16"></div>
        </div>

        {displayCart.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
            <p className="text-gray-400 text-sm mb-6">Looks like you haven't added any items yet</p>
            <Link 
              to="/products" 
              className="inline-flex items-center gap-2 bg-[#3F51B5] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#2c3a8c] transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items - Left Column */}
            <div className="lg:col-span-2 space-y-4">
              {displayCart.map((item: any) => {
                const itemId = item.product_id || item.id;
                const discount = item.old_price > item.price ? Math.round(((item.old_price - item.price) / item.old_price) * 100) : 0;
                
                return (
                  <div key={itemId} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <Link to={`/product/${itemId}`} className="flex-shrink-0">
                        <img
                          src={productImages[item.image] || item.image || '/bat1.png'}
                          alt={item.name}
                          className="w-28 h-28 object-contain bg-gray-50 rounded-lg p-2"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/bat1.png'; }}
                        />
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1">
                        <Link to={`/product/${itemId}`} className="text-gray-900 font-medium hover:underline line-clamp-2">
                          {item.name}
                        </Link>

                        {discount > 0 && (
                          <p className="text-gray-900 text-sm font-semibold mt-1">
                            {discount}% OFF
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xl font-bold text-gray-900">${item.price}</span>
                          {item.old_price > item.price && (
                            <span className="text-sm text-gray-400 line-through">${item.old_price}</span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
                      </div>

                      {/* Quantity Controls & Remove */}
                      <div className="flex flex-col items-end gap-3">
                        {isLocalCart ? (
                          <div className="flex items-center border border-gray-200 rounded-lg">
                            <button 
                              onClick={() => handleLocalQuantity(itemId, -1)}
                              className="px-3 py-1.5 hover:bg-gray-50 rounded-l-lg transition"
                            >
                              −
                            </button>
                            <span className="px-4 min-w-[50px] text-center font-medium">{item.quantity}</span>
                            <button 
                              onClick={() => handleLocalQuantity(itemId, 1)}
                              className="px-3 py-1.5 hover:bg-gray-50 rounded-r-lg transition"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center border border-gray-200 rounded-lg">
                            <button 
                              onClick={() => handleBackendQuantity(itemId, -1, item.quantity)}
                              className="px-3 py-1.5 hover:bg-gray-50 rounded-l-lg transition"
                            >
                              −
                            </button>
                            <span className="px-4 min-w-[50px] text-center font-medium">{item.quantity}</span>
                            <button 
                              onClick={() => handleBackendQuantity(itemId, 1, item.quantity)}
                              className="px-3 py-1.5 hover:bg-gray-50 rounded-r-lg transition"
                            >
                              +
                            </button>
                          </div>
                        )}

                        <button 
                          onClick={() => isLocalCart ? handleLocalRemove(itemId) : handleBackendRemove(itemId)}
                          className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm transition"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Clear Cart Button */}
              {displayCart.length > 1 && (
                <button
                  onClick={() => isLocalCart ? handleLocalClear() : clearCart()}
                  className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 transition"
                >
                  <Trash2 size={14} /> Clear all items
                </button>
              )}
            </div>

            {/* Order Summary - Right Column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 border-b border-gray-100 pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({displayCart.length} items)</span>
                    <span className="font-medium">${displayTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-green-600 font-medium">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span className="font-medium">${(displayTotal * 0.1).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 mb-4">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">${(displayTotal * 1.1).toFixed(2)}</span>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-[#3F51B5] text-white py-3 rounded-lg font-semibold hover:bg-[#2c3a8c] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <CreditCard size={18} />
                  Proceed to Checkout
                </button>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  Free delivery on orders above $50
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ChevronRight size={20} className="text-gray-900" />
              <h2 className="text-xl font-semibold text-gray-900">
                Recommended for You
              </h2>
            </div>
            <Link 
              to="/products" 
              className="text-gray-900 hover:text-[#2c3a8c] text-sm font-medium flex items-center gap-1 transition"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>

          {recLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                  <div className="bg-gray-100 h-36"></div>
                  <div className="p-2 space-y-2">
                    <div className="h-3 bg-gray-100 rounded"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {recommended.map((item) => {
                const discount = item.old_price > 0 ? Math.round(((item.old_price - item.price) / item.old_price) * 100) : 0;
                return (
                  <Link 
                    key={item.id} 
                    to={`/product/${item.id}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="bg-gray-50 p-3 flex items-center justify-center h-36">
                      <img
                        src={item.image || '/kit.png'}
                        alt="Product"
                        className="h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/kit.png"; }}
                      />
                    </div>
                    <div className="p-2">
                      {discount > 0 && (
                        <div className="bg-[#3F51B5] text-white text-xs font-semibold px-1.5 py-0.5 rounded inline-block mb-1">
                          {discount}% OFF
                        </div>
                      )}
                      <p className="text-xs text-gray-700 line-clamp-2 mb-2 group-hover:text-gray-900 transition">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-gray-900">${item.price}</span>
                        {item.old_price > item.price && (
                          <span className="text-xs text-gray-400 line-through">${item.old_price}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}